// bcode.lang_v7.js — BCODe syntax v13 doc-highlighting
// Changes vs v6:
// - Plumbing category eliminated. @, [, \, ], ^ are now regular PARAM
//   terminators (indigo); they fall through to TERM_PARAM naturally.
// - Exponent markers (* /) styled as "punctuation" (magenta, same as pair seps).
// - & raw payload marker styled as "string" (teal, same as $ payload).
// - Hex payload %...% delimiter scopes reclassed to teal (via CSS).
// - # hex literal inherits "number" class (purple) as before.
// - Epsilon region no longer references plumbing rules.

(function () {
  if (!window.hljs) return;

  window.hljs.registerLanguage("bcode", function () {
    var PARAM = /[\x40-\x5F]/;      // 0x40–0x5F
    var CMD   = /[\x60-\x7E]/;      // 0x60–0x7E
    var DEL   = /\x7F/;             // 0x7F

    // Comments (normal mode)
    var SEMI_COMMENT  = { className: "comment", begin: /;/, end: /$/, relevance: 0 };
    var PAREN_COMMENT = { className: "comment", begin: /\(/, end: /\)/, relevance: 0 };

    // $ payload (opaque)
    var STRING_PAYLOAD = {
      className: "string",
      begin: /\$/,
      end: /(?:\n|\x00)/,
      excludeEnd: true,
      contains: [],
      relevance: 0
    };

    // & raw payload marker (teal; length-prefixed binary follows)
    var RAW_PAYLOAD_MARKER = { className: "string", begin: /&/, relevance: 0 };

    // Diagnostic code (common pattern in sNaN examples): decimal digits before "<>" and a PARAM terminator.
    // Example: "42<>I" => "42" is diagnostic, "<>" qualifiers, "I" is PARAM terminator.
    var DIAGNOSTIC_DEC = {
      className: "bcode-diagnostic",
      begin: /\b\d+(?=\s*<\s*>\s*[\x40-\x5F])/,
      relevance: 0
    };

    // % payload (uppercase hex only; comments allowed). beginScope/endScope let '%' be styled separately.
    // CSS now styles bcode-hex-delim as teal (payload color).
    var HEX_PAYLOAD = {
      className: "meta",
      begin: /%/,
      beginScope: "bcode-hex-delim",
      end: /%/,
      endScope: "bcode-hex-delim",
      contains: [
        SEMI_COMMENT,
        PAREN_COMMENT,
        { className: "number", begin: /[0-9A-F]+/, relevance: 0 },
        { className: "bcode-illegal", begin: /[a-f]+/, relevance: 0 },
        { className: "bcode-illegal", begin: /[^0-9A-Fa-f%\s;()]+/, relevance: 0 },
        { begin: /\s+/, relevance: 0 }
      ],
      relevance: 0
    };

    // #...# literal (uppercase hex only)
    var HEX_LITERAL = {
      className: "number",
      begin: /#/,
      end: /#/,
      contains: [
        SEMI_COMMENT,
        PAREN_COMMENT,
        { className: "number", begin: /[0-9A-F]+/, relevance: 0 },
        { className: "bcode-illegal", begin: /[a-f]+/, relevance: 0 },
        { className: "bcode-illegal", begin: /[\x40-\x7F]/, relevance: 0 },
        { begin: /\s+/, relevance: 0 }
      ],
      relevance: 0
    };

    var QUALIFIER       = { className: "operator", begin: /[-<>?!]/, relevance: 0 };
    var PAIR_SEP        = { className: "punctuation", begin: /[.,]/, relevance: 0 };
    var EXPONENT_MARKER = { className: "punctuation", begin: /[*\/]/, relevance: 0 };
    var DECIMAL         = { className: "number", begin: /\d+/, relevance: 0 };

    // Terminators
    // Support both the raw 0x7F byte and the literal "DEL" spelling used in docs.
    var TERM_DEL_WORD = { className: "bcode-term-del", begin: /\bDEL\b/, relevance: 0 };
    var TERM_DEL   = { className: "bcode-term-del", begin: DEL, relevance: 0 };
    var TERM_PARAM = { className: "bcode-term-param", begin: PARAM, relevance: 0 };
    var TERM_CMD   = { className: "bcode-term-cmd", begin: CMD, relevance: 0 };

    // Qualified value region: starts at qualifiers, ends BEFORE next terminator/payload/comment
    var QUALIFIED_FIELD = {
      className: "bcode-qualified-field",
      begin: /(?:[-<>?!]\s*)+/,
      end: /(?=[\s\x40-\x7F$%&;()]|$)/,
      contains: [
        SEMI_COMMENT,
        PAREN_COMMENT,
        QUALIFIER,
        DIAGNOSTIC_DEC,
        HEX_LITERAL,
        EXPONENT_MARKER,
        DECIMAL,
        PAIR_SEP
      ],
      relevance: 0
    };

    // Epsilon region: italicize "-<?G ..." until CMD terminator (excluded).
    // (Coloring is handled by CSS so it can match the qualifier tint.)
    var EPSILON_REGION = {
      className: "bcode-epsilon",
      begin: /-?\s*<\s*\?\s*(?=G)/,
      end: /(?=[\x60-\x7F]|$)/,
      contains: [
        SEMI_COMMENT,
        PAREN_COMMENT,
        QUALIFIER,
        HEX_LITERAL,
        EXPONENT_MARKER,
        DECIMAL,
        PAIR_SEP,
        TERM_PARAM
      ],
      relevance: 0
    };

    return {
      name: "BCODe",
      aliases: ["bcode"],
      contains: [
        SEMI_COMMENT,
        PAREN_COMMENT,
        STRING_PAYLOAD,

        // Hex payload before most tokens
        HEX_PAYLOAD,

        // Raw payload marker (& teal)
        RAW_PAYLOAD_MARKER,

        // Special regions
        EPSILON_REGION,

        // Diagnostic code should be recognized before qualified region
        DIAGNOSTIC_DEC,

        QUALIFIED_FIELD,

        HEX_LITERAL,
        QUALIFIER,
        EXPONENT_MARKER,
        PAIR_SEP,
        DECIMAL,

        TERM_DEL_WORD,
        TERM_DEL,
        TERM_PARAM,
        TERM_CMD
      ]
    };
  });
})();
