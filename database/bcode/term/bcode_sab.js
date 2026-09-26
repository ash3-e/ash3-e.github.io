/*
  bcode_sab.js
  ------------------------------------------------------------
  JavaScript implementation of the BCODe SAB streaming syntax parser,
  with semantic parity to the C11 reference:
    bcode_lib/src/bcode_parser.c (bcode_sab_* API)

  Goals:
    - Streaming: feed() accepts chunked input; state is preserved across calls.
    - Callback surface parity: matches bcode_sab_callbacks_t in include/bcode_parser.h.
    - Error parity: emits the same parse error codes and enters resync identically.
    - No EOF concept: unterminated comments/payloads are NOT errors.

  Also included:
    - A pull-style wrapper (SABPullStream) that turns callbacks into an async iterator.

  Numeric types:
    - uint64 values (value1/value2/lengths) are represented as BigInt in JS.
    - exp10 is a Number (int32 range).

  NOTE: This file is an ES module.
*/

// ------------------------------------------------------------
// Public enums (numeric values MUST match the C reference)
// ------------------------------------------------------------

export const BCODE_SAB_ST = Object.freeze({
  NORMAL: 0,
  SEMI_COMMENT: 1,
  PAREN_COMMENT: 2,
  STRING_PAYLOAD: 3,
  HEX_PAYLOAD: 4,
  HEX_SEMI_COMMENT: 5,
  HEX_PAREN_COMMENT: 6,
  RAWBIN_PAYLOAD: 7,
});

export function bcode_sab_state_name(st) {
  switch (st) {
    case BCODE_SAB_ST.NORMAL: return 'normal';
    case BCODE_SAB_ST.SEMI_COMMENT: return 'semi_comment';
    case BCODE_SAB_ST.PAREN_COMMENT: return 'paren_comment';
    case BCODE_SAB_ST.STRING_PAYLOAD: return 'string_payload';
    case BCODE_SAB_ST.HEX_PAYLOAD: return 'hex_payload';
    case BCODE_SAB_ST.HEX_SEMI_COMMENT: return 'hex_semi_comment';
    case BCODE_SAB_ST.HEX_PAREN_COMMENT: return 'hex_paren_comment';
    case BCODE_SAB_ST.RAWBIN_PAYLOAD: return 'rawbin_payload';
    default: return '?';
  }
}

export const BCODE_SAB_PE = Object.freeze({
  SYNTAX: 0,
  OVERFLOW: 1,
  HEX_PAYLOAD_ODD_NIBBLE: 2,
  HEX_PAYLOAD_BAD_HEX: 3,
  PAYLOAD_HINT_MISMATCH: 4,
  HEX_LITERAL_BAD_HEX: 5,
});

export function bcode_sab_parse_error_name(code) {
  switch (code) {
    case BCODE_SAB_PE.SYNTAX: return 'SYNTAX';
    case BCODE_SAB_PE.OVERFLOW: return 'OVERFLOW';
    case BCODE_SAB_PE.HEX_PAYLOAD_ODD_NIBBLE: return 'HEX_PAYLOAD_ODD_NIBBLE';
    case BCODE_SAB_PE.HEX_PAYLOAD_BAD_HEX: return 'HEX_PAYLOAD_BAD_HEX';
    case BCODE_SAB_PE.PAYLOAD_HINT_MISMATCH: return 'PAYLOAD_HINT_MISMATCH';
    case BCODE_SAB_PE.HEX_LITERAL_BAD_HEX: return 'HEX_LITERAL_BAD_HEX';
    default: return '?';
  }
}

export const BC_SHAPE = Object.freeze({
  EMPTY: 0,
  SINGLE: 1,
  PAIR: 2,
});

// ------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------

const U64_MAX = (1n << 64n) - 1n;
const I32_MAX = 2147483647;

function isParam(c) { return c >= 0x40 && c <= 0x5F; }
function isCmd(c) { return c >= 0x60 && c <= 0x7F; }
function isWsp(c) { return c === 0x20 || c === 0x09 || c === 0x0D || c === 0x0A; }

function hexUcVal(c) {
  if (c >= 0x30 && c <= 0x39) return c - 0x30; // 0-9
  if (c >= 0x41 && c <= 0x46) return c - 0x41 + 10; // A-F
  return -1;
}

function toU8(data) {
  if (data == null) return new Uint8Array(0);

  if (typeof data === 'string') {
    // Byte-per-code-unit string, matching the user's existing line-oriented parser.
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const cc = data.charCodeAt(i);
      if (cc > 0xFF) throw new Error(`String contains non-byte code unit at index ${i}: ${cc}`);
      out[i] = cc;
    }
    return out;
  }

  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  throw new TypeError('Expected Uint8Array|ArrayBuffer|ArrayBufferView|string');
}

const ACC_NONE = 0;
const ACC_DEC = 1;
const ACC_HEX = 2;

function fieldReset(f) {
  f.qual_mask = 0;
  f.stale = false;

  f.shape = BC_SHAPE.EMPTY;
  f.value1 = 0n;
  f.value2 = 0n;
  f.value2_neg = false;
  f.frac_width = 0;

  f.exp_present = false;
  f.exp10 = 0;

  // internal
  f.sep_seen = false;
  f.parsing_v2 = false;

  f.acc_present = false;
  f.acc_mode = ACC_NONE;
  f.acc_hex_open = false;
  f.acc_saw_digit = false;
  f.acc_digit_count = 0;
  f.acc_value = 0n;

  f.exp_neg = false;
  f.exp_digits_seen = false;
  f.exp_mag = 0;
}

function resetMantissaAcc(f) {
  f.acc_present = false;
  f.acc_mode = ACC_NONE;
  f.acc_hex_open = false;
  f.acc_saw_digit = false;
  f.acc_digit_count = 0;
  f.acc_value = 0n;
}

function accMulAddDec(accValue, digit /*0..9*/) {
  const d = BigInt(digit);
  // if accValue > (U64_MAX - d)/10 => overflow
  if (accValue > (U64_MAX - d) / 10n) return null;
  return accValue * 10n + d;
}

function accShiftAddHex(accValue, hexDigit /*0..15*/) {
  const d = BigInt(hexDigit);
  if (accValue > (U64_MAX >> 4n)) return null;
  return (accValue << 4n) | d;
}

function accAddDigit(f, c /* byte */) {
  if (!f.acc_present) {
    f.acc_present = true;
    f.acc_mode = ACC_DEC;
    f.acc_hex_open = false;
    f.acc_saw_digit = false;
    f.acc_digit_count = 0;
    f.acc_value = 0n;
  }

  let next = null;
  if (f.acc_mode === ACC_DEC) {
    if (c < 0x30 || c > 0x39) return false;
    next = accMulAddDec(f.acc_value, c - 0x30);
  } else if (f.acc_mode === ACC_HEX) {
    const v = hexUcVal(c);
    if (v < 0) return false;
    next = accShiftAddHex(f.acc_value, v);
  } else {
    return false;
  }

  if (next === null) return false;
  f.acc_value = next;
  f.acc_saw_digit = true;
  f.acc_digit_count++;
  return true;
}

function beginHexAcc(f) {
  // Start a hex number: '#'
  if (f.acc_present && f.acc_mode !== ACC_HEX) return false;
  if (!f.acc_present) {
    f.acc_present = true;
    f.acc_value = 0n;
    f.acc_digit_count = 0;
    f.acc_saw_digit = false;
  }
  f.acc_mode = ACC_HEX;
  f.acc_hex_open = true;
  return true;
}

function endHexAcc(f) {
  // End a hex number: closing '#'
  if (!f.acc_present || f.acc_mode !== ACC_HEX || !f.acc_hex_open) return false;
  if (!f.acc_saw_digit) return false;
  f.acc_hex_open = false;
  return true;
}

function commitAccToField(p) {
  const f = p._field;
  if (!f.acc_present) return true;

  // For normal field commit (PARAM/CMD), hex must be closed.
  if (f.acc_mode === ACC_HEX && f.acc_hex_open) return false;
  if (!f.acc_saw_digit) return false;

  if (!f.parsing_v2) {
    f.value1 = f.acc_value;
    f.shape = BC_SHAPE.SINGLE;
  } else {
    f.value2 = f.acc_value;
    f.frac_width = f.acc_digit_count;
    f.shape = BC_SHAPE.PAIR;
  }

  resetMantissaAcc(f);
  return true;
}

function startV2(p, sep /* byte '.' or ',' */) {
  const f = p._field;

  // Fractional point must never come after an exponent marker.
  if (f.exp_present) return false;

  // Separator requires a complete first number.
  if (!f.acc_present || !f.acc_saw_digit) return false;
  if (f.acc_mode === ACC_HEX && f.acc_hex_open) return false;

  if (!commitAccToField(p)) return false;
  f.sep_seen = true;
  f.parsing_v2 = true;
  f.value2_neg = (sep === 0x2C); // ','
  return true;
}

function setQual(f, q /* byte */) {
  switch (q) {
    case 0x2D: /* '-' */ f.qual_mask |= 0x01; break;
    case 0x3C: /* '<' */ f.qual_mask |= 0x02; break;
    case 0x3E: /* '>' */ f.qual_mask |= 0x04; break;
    case 0x3F: /* '?' */ f.qual_mask |= 0x08; break;
    case 0x21: /* '!' */ f.stale = true; break;
    default: break;
  }
}

function expAddDigit(f, c /* byte */) {
  if (c < 0x30 || c > 0x39) return false;
  const d = c - 0x30;

  // bound to INT32_MAX magnitude
  if (f.exp_mag > Math.floor((I32_MAX - d) / 10)) return false;
  f.exp_mag = f.exp_mag * 10 + d;
  f.exp_digits_seen = true;
  return true;
}

function startExp(p, neg /* bool */) {
  const f = p._field;

  if (f.exp_present) return false;

  // Exponent cannot start inside an open hex literal.
  if (f.acc_present && f.acc_mode === ACC_HEX && f.acc_hex_open) return false;

  // Exponent must follow the mantissa.
  if (f.parsing_v2) {
    if (!f.acc_present || !f.acc_saw_digit) return false;
    if (!commitAccToField(p)) return false;
    if (f.shape !== BC_SHAPE.PAIR) return false;
  } else {
    if (f.shape === BC_SHAPE.EMPTY) {
      if (!f.acc_present || !f.acc_saw_digit) return false;
      if (!commitAccToField(p)) return false;
      if (f.shape !== BC_SHAPE.SINGLE) return false;
    }
  }

  f.exp_present = true;
  f.exp_neg = !!neg;
  f.exp_digits_seen = false;
  f.exp_mag = 0;
  f.exp10 = 0;
  return true;
}

function finalizeExp(f) {
  if (!f.exp_present) {
    f.exp10 = 0;
    return true;
  }
  const mag = f.exp_digits_seen ? f.exp_mag : 1;
  if (mag > I32_MAX) return false;
  let e = mag | 0;
  if (f.exp_neg) e = -e;
  f.exp10 = e;
  return true;
}

function takeLenPrefixForPayload(p) {
  const f = p._field;

  if (f.qual_mask !== 0 || f.stale) return { len_present: false, len: 0n };
  if (f.shape !== BC_SHAPE.EMPTY) return { len_present: false, len: 0n };
  if (f.sep_seen || f.parsing_v2 || f.exp_present) return { len_present: false, len: 0n };

  if (!f.acc_present || !f.acc_saw_digit) return { len_present: false, len: 0n };
  if (f.acc_mode === ACC_HEX && f.acc_hex_open) return { len_present: false, len: 0n };

  const len = f.acc_value;
  resetMantissaAcc(f);
  return { len_present: true, len };
}

// ------------------------------------------------------------
// SABParser: callback-surface parity with C
// ------------------------------------------------------------

/**
 * @typedef {Object} bcode_sab_callbacks_t
 * @property {(user:any, term:number, term_is_cmd:boolean, field:any)=>void=} on_field
 * @property {(user:any, cmd:number)=>void=} on_line_latched
 * @property {(user:any, is_ack:boolean)=>void=} on_reset
 * @property {(user:any, len_present:boolean, len:bigint)=>void=} on_payload_string_begin
 * @property {(user:any, b:number)=>void=} on_payload_string_byte
 * @property {(user:any, term:number, is_null_string:boolean, len_present:boolean, expected_len:bigint, actual_len:bigint, len_match:boolean)=>void=} on_payload_string_end
 * @property {(user:any, len_present:boolean, len:bigint)=>void=} on_payload_hex_begin
 * @property {(user:any, b:number)=>void=} on_payload_hex_byte
 * @property {(user:any, len_present:boolean, expected_len:bigint, actual_len:bigint, len_match:boolean)=>void=} on_payload_hex_end
 * @property {(user:any, len:bigint)=>void=} on_payload_raw_begin
 * @property {(user:any, b:number)=>void=} on_payload_raw_byte
 * @property {(user:any)=>void=} on_payload_raw_end
 * @property {(user:any, code:number, offending_byte:number, state:number, a:bigint, b:bigint)=>void=} on_parse_error
 */

export class SABParser {
  /**
   * @param {bcode_sab_callbacks_t|null=} cb
   * @param {any=} user
   */
  constructor(cb = null, user = null) {
    /** @type {bcode_sab_callbacks_t} */
    this._cb = cb ? { ...cb } : {};
    this._user = user;

    this._st = BCODE_SAB_ST.NORMAL;
    this._resync = false;

    this._field = {};
    fieldReset(this._field);

    // raw payload consumption
    this._raw_remaining = 0n;
    this._raw_restore_hex_open = false;

    // hex payload decode nibble state
    this._hex_have_half = false;
    this._hex_half = 0;

    // string payload body length
    this._str_len = 0n;
    this._str_len_present = false;
    this._str_len_expected = 0n;

    // hex payload decoded length
    this._hex_decoded_len = 0n;
    this._hex_len_present = false;
    this._hex_len_expected = 0n;

    // line-scoped accounting (since last non-reset CMD)
    this._line_param_fields = 0;
    this._line_payload_seen = false;
  }

  /** Reset to initial state (keeps callbacks + user pointer). */
  reset() {
    this._st = BCODE_SAB_ST.NORMAL;
    this._resync = false;
    fieldReset(this._field);

    this._raw_remaining = 0n;
    this._raw_restore_hex_open = false;

    this._hex_have_half = false;
    this._hex_half = 0;

    this._str_len = 0n;
    this._str_len_present = false;
    this._str_len_expected = 0n;

    this._hex_decoded_len = 0n;
    this._hex_len_present = false;
    this._hex_len_expected = 0n;

    this._line_param_fields = 0;
    this._line_payload_seen = false;
  }

  /** Update callbacks/user pointer at runtime (keeps parsing state). */
  setCallbacks(cb = null, user = this._user) {
    if (cb) this._cb = { ...cb };
    this._user = user;
  }

  /** @returns {number} */
  get state() { return this._st; }

  /** @returns {boolean} */
  get in_resync() { return this._resync; }

  /** Feed bytes into the streaming parser. */
  feed(chunk) {
    const u8 = toU8(chunk);
    for (let i = 0; i < u8.length; i++) {
      this._feedByte(u8[i]);
    }
  }

  _enterResync(code, offendingByte, a = 0n, b = 0n) {
    if (this._cb.on_parse_error) {
      this._cb.on_parse_error(this._user, code, offendingByte & 0xFF, this._st, a, b);
    }

    // Drop pending line state and discard until next CMD in NORMAL.
    fieldReset(this._field);
    this._st = BCODE_SAB_ST.NORMAL;

    this._raw_remaining = 0n;
    this._hex_have_half = false;
    this._str_len = 0n;
    this._str_len_present = false;
    this._str_len_expected = 0n;
    this._hex_decoded_len = 0n;
    this._hex_len_present = false;
    this._hex_len_expected = 0n;
    this._raw_restore_hex_open = false;

    this._resync = true;
  }

  _beginRawPayload() {
    const f = this._field;

    // Determine whether we should restore hex-open mantissa after payload.
    this._raw_restore_hex_open = !!(f.acc_present && f.acc_mode === ACC_HEX && f.acc_hex_open);

    // Length derives only from FIRST number value1 (or accumulator if not committed).
    let len = 0n;
    if (f.shape !== BC_SHAPE.EMPTY) {
      len = f.value1;
    } else if (f.acc_present && f.acc_saw_digit) {
      len = f.acc_value;
    } else {
      len = 0n;
    }

    // Consume + reset mantissa accumulator.
    resetMantissaAcc(f);

    this._raw_remaining = len;
    if (this._cb.on_payload_raw_begin) this._cb.on_payload_raw_begin(this._user, len);

    if (len === 0n) {
      if (this._cb.on_payload_raw_end) this._cb.on_payload_raw_end(this._user);

      // If hex was open, resume in hex-open mode with accumulator reset to 0.
      if (this._raw_restore_hex_open) {
        this._raw_restore_hex_open = false;
        f.acc_present = true;
        f.acc_mode = ACC_HEX;
        f.acc_hex_open = true;
        f.acc_saw_digit = false;
        f.acc_digit_count = 0;
        f.acc_value = 0n;
      }
      this._st = BCODE_SAB_ST.NORMAL;
    } else {
      this._st = BCODE_SAB_ST.RAWBIN_PAYLOAD;
    }
    return true;
  }

  _finalizeField(termByte, termIsCmd) {
    if (!commitAccToField(this)) return false;
    if (!finalizeExp(this._field)) return false;

    // If a separator was seen, we must have committed a second number.
    if (this._field.sep_seen && this._field.shape !== BC_SHAPE.PAIR) return false;

    if (this._cb.on_field) {
      const pub = {
        qual_mask: this._field.qual_mask,
        stale: this._field.stale,
        shape: this._field.shape,
        value1: this._field.value1,
        value2: this._field.value2,
        value2_neg: this._field.value2_neg,
        frac_width: this._field.frac_width,
        exp_present: this._field.exp_present,
        exp10: this._field.exp10,
      };
      this._cb.on_field(this._user, termByte, !!termIsCmd, pub);
    }

    fieldReset(this._field);

    if (termIsCmd) {
      this._line_param_fields = 0;
      this._line_payload_seen = false;
      if (this._cb.on_line_latched) this._cb.on_line_latched(this._user, termByte);
    } else {
      this._line_param_fields++;
    }
    return true;
  }

  _handleResetCmd() {
    const f = this._field;

    // RESET-ACK is encoded as 0x3E 0x7F ('>' then DEL).
    const isAck =
      this._line_param_fields === 0 &&
      !this._line_payload_seen &&
      f.qual_mask === 0x04 &&
      !f.stale &&
      f.shape === BC_SHAPE.EMPTY &&
      !f.acc_present &&
      !f.sep_seen &&
      !f.exp_present;

    // Discard pending line and return to baseline parser state.
    fieldReset(this._field);
    this._st = BCODE_SAB_ST.NORMAL;
    this._raw_remaining = 0n;
    this._raw_restore_hex_open = false;
    this._hex_have_half = false;
    this._hex_half = 0;
    this._str_len = 0n;
    this._str_len_present = false;
    this._str_len_expected = 0n;
    this._hex_decoded_len = 0n;
    this._hex_len_present = false;
    this._hex_len_expected = 0n;
    this._resync = false;
    this._line_param_fields = 0;
    this._line_payload_seen = false;

    if (this._cb.on_reset) this._cb.on_reset(this._user, isAck);
  }

  _feedByte(c) {
    c &= 0xFF;

    // Resynchronization mode: discard until next CMD in NORMAL.
    if (this._resync) {
      if (this._st === BCODE_SAB_ST.NORMAL && isCmd(c)) {
        if (c === 0x7F) { // DEL
          this._handleResetCmd();
          return;
        }
        this._resync = false;
        fieldReset(this._field);
        this._line_param_fields = 0;
        this._line_payload_seen = false;
      }
      return;
    }

    switch (this._st) {
      case BCODE_SAB_ST.SEMI_COMMENT:
        if (c === 0x0A) this._st = BCODE_SAB_ST.NORMAL;
        return;

      case BCODE_SAB_ST.PAREN_COMMENT:
        if (c === 0x29) this._st = BCODE_SAB_ST.NORMAL; // ')'
        return;

      case BCODE_SAB_ST.STRING_PAYLOAD:
        if (c === 0x0A || c === 0x00) {
          // If a length hint is present, it MUST match exactly.
          if (this._str_len_present && this._str_len !== this._str_len_expected) {
            this._enterResync(BCODE_SAB_PE.PAYLOAD_HINT_MISMATCH, c, this._str_len_expected, this._str_len);
            return;
          }

          const isNullString = (c === 0x00 && this._str_len === 0n);
          const lenMatch = true;
          if (this._cb.on_payload_string_end) {
            this._cb.on_payload_string_end(
              this._user,
              c,
              isNullString,
              this._str_len_present,
              this._str_len_expected,
              this._str_len,
              lenMatch,
            );
          }

          this._str_len_present = false;
          this._str_len_expected = 0n;
          this._st = BCODE_SAB_ST.NORMAL;
          return;
        }

        // If a length hint is present, exceeding it before terminator is a parse error.
        if (this._str_len_present && this._str_len >= this._str_len_expected) {
          this._enterResync(BCODE_SAB_PE.PAYLOAD_HINT_MISMATCH, c, this._str_len_expected, this._str_len + 1n);
          return;
        }

        this._str_len++;
        if (this._cb.on_payload_string_byte) this._cb.on_payload_string_byte(this._user, c);
        return;

      case BCODE_SAB_ST.RAWBIN_PAYLOAD:
        if (this._cb.on_payload_raw_byte) this._cb.on_payload_raw_byte(this._user, c);
        if (this._raw_remaining > 0n) this._raw_remaining--;
        if (this._raw_remaining === 0n) {
          if (this._cb.on_payload_raw_end) this._cb.on_payload_raw_end(this._user);

          // Restore hex-open mantissa if requested.
          if (this._raw_restore_hex_open) {
            this._raw_restore_hex_open = false;
            const f = this._field;
            f.acc_present = true;
            f.acc_mode = ACC_HEX;
            f.acc_hex_open = true;
            f.acc_saw_digit = false;
            f.acc_digit_count = 0;
            f.acc_value = 0n;
          }

          this._st = BCODE_SAB_ST.NORMAL;
        }
        return;

      case BCODE_SAB_ST.HEX_SEMI_COMMENT:
        if (c === 0x0A) this._st = BCODE_SAB_ST.HEX_PAYLOAD;
        return;

      case BCODE_SAB_ST.HEX_PAREN_COMMENT:
        if (c === 0x29) this._st = BCODE_SAB_ST.HEX_PAYLOAD;
        return;

      case BCODE_SAB_ST.HEX_PAYLOAD:
        if (c === 0x25) { // '%'
          if (this._hex_have_half) {
            this._enterResync(BCODE_SAB_PE.HEX_PAYLOAD_ODD_NIBBLE, c, 0n, 0n);
            return;
          }
          if (this._hex_len_present && this._hex_decoded_len !== this._hex_len_expected) {
            this._enterResync(BCODE_SAB_PE.PAYLOAD_HINT_MISMATCH, c, this._hex_len_expected, this._hex_decoded_len);
            return;
          }

          const lenMatch = true;
          if (this._cb.on_payload_hex_end) {
            this._cb.on_payload_hex_end(
              this._user,
              this._hex_len_present,
              this._hex_len_expected,
              this._hex_decoded_len,
              lenMatch,
            );
          }

          this._hex_len_present = false;
          this._hex_len_expected = 0n;
          this._hex_decoded_len = 0n;
          this._st = BCODE_SAB_ST.NORMAL;
          return;
        }

        if (isWsp(c)) return;
        if (c === 0x3B) { this._st = BCODE_SAB_ST.HEX_SEMI_COMMENT; return; } // ';'
        if (c === 0x28) { this._st = BCODE_SAB_ST.HEX_PAREN_COMMENT; return; } // '('

        {
          const v = hexUcVal(c);
          if (v < 0) {
            this._enterResync(BCODE_SAB_PE.HEX_PAYLOAD_BAD_HEX, c, 0n, 0n);
            return;
          }
          if (!this._hex_have_half) {
            this._hex_half = v;
            this._hex_have_half = true;
          } else {
            const byte = ((this._hex_half << 4) | v) & 0xFF;
            this._hex_have_half = false;
            this._hex_decoded_len++;

            if (this._hex_len_present && this._hex_decoded_len > this._hex_len_expected) {
              this._enterResync(BCODE_SAB_PE.PAYLOAD_HINT_MISMATCH, c, this._hex_len_expected, this._hex_decoded_len);
              return;
            }
            if (this._cb.on_payload_hex_byte) this._cb.on_payload_hex_byte(this._user, byte);
          }
        }
        return;

      case BCODE_SAB_ST.NORMAL:
      default:
        break;
    }

    // NORMAL mode
    if (isWsp(c)) return;

    // Special case: inside an open #...# hex literal.
    {
      const fhex = this._field;
      if (fhex.acc_present && fhex.acc_mode === ACC_HEX && fhex.acc_hex_open) {
        // Comments
        if (c === 0x3B) { this._st = BCODE_SAB_ST.SEMI_COMMENT; return; }
        if (c === 0x28) { this._st = BCODE_SAB_ST.PAREN_COMMENT; return; }

        // Payloads (allowed to interrupt numbers, including hex)
        if (c === 0x24) { // '$'
          const { len_present: lp, len } = takeLenPrefixForPayload(this);
          this._line_payload_seen = true;
          this._str_len = 0n;
          this._str_len_present = lp;
          this._str_len_expected = len;
          if (this._cb.on_payload_string_begin) this._cb.on_payload_string_begin(this._user, lp, len);
          this._st = BCODE_SAB_ST.STRING_PAYLOAD;
          return;
        }
        if (c === 0x25) { // '%'
          const { len_present: lp, len } = takeLenPrefixForPayload(this);
          this._line_payload_seen = true;
          this._hex_have_half = false;
          this._hex_decoded_len = 0n;
          this._hex_len_present = lp;
          this._hex_len_expected = len;
          if (this._cb.on_payload_hex_begin) this._cb.on_payload_hex_begin(this._user, lp, len);
          this._st = BCODE_SAB_ST.HEX_PAYLOAD;
          return;
        }
        if (c === 0x26) { // '&'
          this._line_payload_seen = true;
          if (!this._beginRawPayload()) {
            this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
          }
          return;
        }

        // Closing delimiter
        if (c === 0x23) { // '#'
          if (!endHexAcc(fhex)) {
            this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
          }
          return;
        }

        // Digits
        if (c >= 0x30 && c <= 0x39) {
          if (!accAddDigit(fhex, c)) this._enterResync(BCODE_SAB_PE.OVERFLOW, c, 0n, 0n);
          return;
        }
        if (c >= 0x41 && c <= 0x46) {
          if (!accAddDigit(fhex, c)) this._enterResync(BCODE_SAB_PE.OVERFLOW, c, 0n, 0n);
          return;
        }

        if (c >= 0x61 && c <= 0x66) {
          this._enterResync(BCODE_SAB_PE.HEX_LITERAL_BAD_HEX, c, 0n, 0n);
          return;
        }

        this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
        return;
      }
    }

    // PARAM/CMD end fields regardless of other content.
    if (isParam(c)) {
      if (!this._finalizeField(c, false)) this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
      return;
    }
    if (isCmd(c)) {
      if (c === 0x7F) { // DEL
        this._handleResetCmd();
        return;
      }
      if (!this._finalizeField(c, true)) this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
      return;
    }

    // Comments
    if (c === 0x3B) { this._st = BCODE_SAB_ST.SEMI_COMMENT; return; }
    if (c === 0x28) { this._st = BCODE_SAB_ST.PAREN_COMMENT; return; }

    // Payloads
    if (c === 0x24) { // '$'
      const { len_present: lp, len } = takeLenPrefixForPayload(this);
      this._line_payload_seen = true;
      this._str_len = 0n;
      this._str_len_present = lp;
      this._str_len_expected = len;
      if (this._cb.on_payload_string_begin) this._cb.on_payload_string_begin(this._user, lp, len);
      this._st = BCODE_SAB_ST.STRING_PAYLOAD;
      return;
    }
    if (c === 0x25) { // '%'
      const { len_present: lp, len } = takeLenPrefixForPayload(this);
      this._line_payload_seen = true;
      this._hex_have_half = false;
      this._hex_decoded_len = 0n;
      this._hex_len_present = lp;
      this._hex_len_expected = len;
      if (this._cb.on_payload_hex_begin) this._cb.on_payload_hex_begin(this._user, lp, len);
      this._st = BCODE_SAB_ST.HEX_PAYLOAD;
      return;
    }
    if (c === 0x26) { // '&'
      this._line_payload_seen = true;
      if (!this._beginRawPayload()) this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
      return;
    }

    // Exponent markers
    if (c === 0x2A || c === 0x2F) { // '*' or '/'
      if (!startExp(this, c === 0x2F)) this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
      return;
    }

    // Qualifiers
    if (c === 0x2D || c === 0x3C || c === 0x3E || c === 0x3F || c === 0x21) {
      setQual(this._field, c);
      return;
    }

    // Pair separator
    if (c === 0x2E || c === 0x2C) { // '.' or ','
      if (!startV2(this, c)) this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
      return;
    }

    // Hex delimiters
    if (c === 0x23) { // '#'
      const f = this._field;
      if (f.exp_present) { this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n); return; }

      if (!f.acc_present) {
        if (!beginHexAcc(f)) this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
        return;
      }
      if (f.acc_mode === ACC_HEX && f.acc_hex_open) {
        if (!endHexAcc(f)) this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
        return;
      }
      this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
      return;
    }

    // Digits
    if (c >= 0x30 && c <= 0x39) {
      const f = this._field;
      if (f.exp_present) {
        if (!expAddDigit(f, c)) this._enterResync(BCODE_SAB_PE.OVERFLOW, c, 0n, 0n);
      } else {
        if (!accAddDigit(f, c)) this._enterResync(BCODE_SAB_PE.OVERFLOW, c, 0n, 0n);
      }
      return;
    }

    if (c >= 0x41 && c <= 0x46) {
      const f = this._field;
      if (f.exp_present) { this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n); return; }

      if (!f.acc_present || f.acc_mode !== ACC_HEX) { this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n); return; }
      if (!accAddDigit(f, c)) this._enterResync(BCODE_SAB_PE.OVERFLOW, c, 0n, 0n);
      return;
    }

    // Anything else is malformed in NORMAL mode.
    this._enterResync(BCODE_SAB_PE.SYNTAX, c, 0n, 0n);
  }
}

// ------------------------------------------------------------
// Pull-style wrapper: turn callbacks into async iterator events
// ------------------------------------------------------------

class AsyncQueue {
  constructor() {
    this._q = [];
    this._waiters = [];
    this._closed = false;
  }
  push(v) {
    if (this._closed) return;
    if (this._waiters.length) {
      const w = this._waiters.shift();
      w(v);
    } else {
      this._q.push(v);
    }
  }
  close() {
    if (this._closed) return;
    this._closed = true;
    while (this._waiters.length) {
      const w = this._waiters.shift();
      w(null);
    }
  }
  async shift() {
    if (this._q.length) return this._q.shift();
    if (this._closed) return null;
    return await new Promise((resolve) => this._waiters.push(resolve));
  }
}

/**
 * Pull-style event wrapper.
 *
 * Event objects correspond 1:1 to callback invocations:
 *   { ev: 'field', term, term_is_cmd, field }
 *   { ev: 'line_latched', cmd }
 *   { ev: 'reset', is_ack }
 *   { ev: 'payload_string_begin', len_present, len }
 *   ...
 *   { ev: 'parse_error', code, offending_byte, state, a, b }
 */
export class SABPullStream {
  constructor() {
    this._queue = new AsyncQueue();

    const cb = {
      on_field: (_u, term, term_is_cmd, field) => {
        this._queue.push({ ev: 'field', term, term_is_cmd, field });
      },
      on_line_latched: (_u, cmd) => {
        this._queue.push({ ev: 'line_latched', cmd });
      },
      on_reset: (_u, is_ack) => {
        this._queue.push({ ev: 'reset', is_ack });
      },
      on_payload_string_begin: (_u, len_present, len) => {
        this._queue.push({ ev: 'payload_string_begin', len_present, len });
      },
      on_payload_string_byte: (_u, b) => {
        this._queue.push({ ev: 'payload_string_byte', b });
      },
      on_payload_string_end: (_u, term, is_null_string, len_present, expected_len, actual_len, len_match) => {
        this._queue.push({ ev: 'payload_string_end', term, is_null_string, len_present, expected_len, actual_len, len_match });
      },
      on_payload_hex_begin: (_u, len_present, len) => {
        this._queue.push({ ev: 'payload_hex_begin', len_present, len });
      },
      on_payload_hex_byte: (_u, b) => {
        this._queue.push({ ev: 'payload_hex_byte', b });
      },
      on_payload_hex_end: (_u, len_present, expected_len, actual_len, len_match) => {
        this._queue.push({ ev: 'payload_hex_end', len_present, expected_len, actual_len, len_match });
      },
      on_payload_raw_begin: (_u, len) => {
        this._queue.push({ ev: 'payload_raw_begin', len });
      },
      on_payload_raw_byte: (_u, b) => {
        this._queue.push({ ev: 'payload_raw_byte', b });
      },
      on_payload_raw_end: (_u) => {
        this._queue.push({ ev: 'payload_raw_end' });
      },
      on_parse_error: (_u, code, offending_byte, state, a, b) => {
        this._queue.push({ ev: 'parse_error', code, offending_byte, state, a, b });
      },
    };

    this._parser = new SABParser(cb, null);
  }

  reset() {
    this._parser.reset();
  }

  feed(chunk) {
    this._parser.feed(chunk);
  }

  /** Close the event stream (does not imply EOF to the parser). */
  close() {
    this._queue.close();
  }

  get parser() {
    return this._parser;
  }

  async *events() {
    while (true) {
      const ev = await this._queue.shift();
      if (ev === null) return;
      yield ev;
    }
  }

  /**
   * Convenience: consume an (async) iterable of chunks and yield events.
   * @param {AsyncIterable<Uint8Array|string|ArrayBuffer>|Iterable<Uint8Array|string|ArrayBuffer>} incoming
   */
  static async *parse(incoming) {
    const ps = new SABPullStream();
    for await (const chunk of incoming) {
      ps.feed(chunk);
      // drain is implicit via event iterator
    }
    ps.close();
    for await (const ev of ps.events()) yield ev;
  }
}
