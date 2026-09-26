
/* Use the accessors scoped in BCODeSTD */
const BCODeSTD_IDX   = "@";
const BCODeSTD_RANGE = "[";
const BCODeSTD_SEQ   = "]";
const BCODeSTD_ERR   = "\\";
const BCODeSTD_RET   = "^";

/*
const BCODeHL = {
	 BLACK    : "\x1b[30m"
	,RED      : "\x1b[31m"
	,GREEN    : "\x1b[32m"
	,YELLOW   : "\x1b[33m"
	,BLUE     : "\x1b[34m"
	,MAGENTA  : "\x1b[35m"
	,CYAN     : "\x1b[36m"
	,WHITE    : "\x1b[37m"
};

const BCODeHL_RESET    = "\x1b[0m";

const BCODeHL_BLACK    = "\x1b[30m";
const BCODeHL_RED      = "\x1b[31m";
const BCODeHL_GREEN    = "\x1b[32m";
const BCODeHL_YELLOW   = "\x1b[33m";
const BCODeHL_BLUE     = "\x1b[34m";
const BCODeHL_MAGENTA  = "\x1b[35m";
const BCODeHL_CYAN     = "\x1b[36m";
const BCODeHL_WHITE    = "\x1b[37m";

const BCODeHL = {
	hex : function(){
	}
};


const BCODeHL_NUM   = [BCODeHL_GREEN, BCODeHL_RESET];
const BCODeHL_CMD   = [BCODeHL_YELLOW, ];
const BCODeHL_PARAM = [BCODeHL_BLUE;
 */

class STD {
	static get INDEX(){
		return BCODeSTD_IDX;
	}

	static get RANGE(){
		return BCODeSTD_RANGE;
	}

	static get SEQ(){
		return BCODeSTD_SEQ;
	}

	static get ERR(){
		return BCODeSTD_ERR;
	}

	static get RET(){
		return BCODeSTD_RET;
	}
};

export class Line {
	constructor(rawVal) {
		this.v = rawVal;

		/* Populate shortcuts. */
		this.code = this.v.cmd.code;

		this.cmd = this.v.cmd;
		this.params = this.v.params;
	}

	checkCmd(major, minor, cmd){
		if(this.code != cmd)
			return false;

		let tmp = this.numpair();
		if(tmp[0] != major)
			return false;

		if(tmp[1] != minor)
			return false;

		return true;
	}

	string() {
		if (("binBuffer" in this.v)){
			const decoder = new TextDecoder('utf-8');
			return decoder.decode(this.v.binBuffer);
		}
		if (!("strBuffer" in this.v)) throw new Error("Nonexistent string value");

		return this.v.strBuffer;
	}

	bin() {
		if (!("binBuffer" in this.v)) throw new Error("Nonexistent string value");

		return this.v.binBuffer;
	}

	getv(param) {
		/* Referring to the command. */
		if (!param) return this.cmd;

		if (!(param in this.params))
			throw new Error("Nonexistent parameter: " + param);

		let tmp = this.params[param];

		if (!(typeof tmp.numValue === "number")) {
			console.log(this);
			throw new Error(
				"Parameter is not numeric: " + param + ", it is " + typeof tmp.numValue
			);
		}

		return tmp;
	}

	bool(param) {
		return param in this.params;
	}

	numeric(param) {
		let tmp = this.getv(param);
		return tmp.numValue;
	}

	numpair(param) {
		let tmp = this.getv(param);
		return [tmp.acc, tmp.accFrac];
	}

	numstr(param) {
		let tmp = this.getv(param);
		return tmp.strValue;
	}

	static highlight(inputArr) {
		// Highlight implementation if needed
	}

	static compose(inputArr) {
		let ret = "";
		for (let k = 0; k < inputArr.length; ++k) {
			let input = inputArr[k];
			if ("str" in input) ret += "$" + input.str + "\n";
			else if ("strBuffer" in input.v) ret += "$" + input.v.strBuffer + "\n";
			else if ("binBuffer" in input.v) {
				let c = "%";
				let buff = input.v.binBuffer;
				for (let m = 0; m < buff.byteLength; ++m) {
					ret += c;
					let q = buff[m].toString(16).toUpperCase();
					if (q.length === 1) q = "0" + q;
					ret += q;

					// Change pad character to ' '
					c = " ";
				}
				ret += "% ";
			}

			let cmd = null;
			for (let p in input.params) {
				if (p.length === 1) {
					if (p >= '`' && p <= '~') {
						if (cmd) throw new Error("Already have command defined!");
						cmd = input.params[p]; // Ensure cmd is set to the correct object from input.params
					} else if (p >= '@' && p <= '_') {
						let rec = input.params[p];
						if (rec.indefinite) ret += "?";
						if (rec.lessthan) ret += "<";
						if (rec.greaterthan) ret += ">";
						ret += (rec.strValue || "") + p + " ";
					}
				}
			}

			// Check if cmd is not null or undefined before accessing its properties
			if (input.cmd) {
				if (input.cmd.indefinite) ret += "?";
				if (input.cmd.lessthan) ret += "<";
				if (input.cmd.greaterthan) ret += ">";
				ret += input.cmd.strValue + input.code + "\r\n";
			} else {
				console.warn("Command object 'cmd' is null or undefined.");
			}
		}

		return ret;
	}
}

export class Parser {

	constructor(incoming){
		if(typeof incoming === "string"){
			let buf = new ArrayBuffer(incoming.length);
			let bufView = new Uint8Array(buf);
			for (let i = 0; i < incoming.length; ++i)
				bufView[i] = incoming.charCodeAt(i);
			incoming = bufView;
		}

		if(incoming instanceof ArrayBuffer){
			this.buffer = new Uint8Array(incoming);
			this.buffIdx = 0;
			this.incoming = null;
		}
		else if(ArrayBuffer.isView(incoming)){
			this.buffer = incoming;
			this.buffIdx = 0;
			this.incoming = null;
		}
		else
			this.incoming = incoming;
		this.charCounter = 0;
		this.bufferCounter = 0;
		this.lineCounter = 0;
	}

	get stats(){
		return {
			"chars" : this.charCounter
			,"lines" : this.lineCounter
			,"buffers" : this.bufferCounter
		}
	}

	static getDigit(c, hexMode){
		if(c >= 0x30 && c <= 0x39)
			return c - 0x30;

		if(hexMode){
			if(c >= 0x61 && c <= 0x66){
				return c - 0x61 + 10;
			}
			if(c >= 0x41 && c <= 0x46){
				return c - 0x41 + 10;
			}
		}
		return null;
	}

	async getChar(){
		let self = this;
		if(!self.buffer){
			if(!self.incoming)
				return null;

			let ret = await self.incoming.next();
			if(!ret.value)
				return null;
			++self.bufferCounter;
			self.buffer = ret.value;
			self.buffIdx = 0;
		}

		let entry = self.buffer[self.buffIdx];

		++self.buffIdx;
		if(self.buffer.length == self.buffIdx)
			delete self.buffer;

		return entry;
	}

	async bcodeDrop(term){
		let self = this;
		while(true){
			let ch = await self.getChar();
			if(!ch)
				throw new Error("Never got terminating char " + term);

			++self.charCounter;
			let chTmp = String.fromCharCode(ch);
			if(term == chTmp)
				return;
		}
	}

	async bcodeChar(){
		let self = this;
		let c = await self.getChar();
		if(!c)
			return null;

		++self.charCounter;

		/* Binary data is only allowed in limited contexts */
		if((c < 0x20 && c != 0xA && c != 0xD && c != 0x11) || c > 0x7F)
			throw new Error("Invalid binary char");

		return c;
	}

	async parseNumber(rec, incoming){
		let self = this;
		let c = incoming || await self.bcodeChar();
		let bc = String.fromCharCode(c);

		while(true){
			if (bc != ' ') {
				let v = Parser.getDigit(c, rec.hexMode);
				if(null === v){
					return [c, bc];
				}
				rec.acc *= rec.hexMode ? 16 : 10;
				rec.acc += v;
				++rec.digitCount;
			}

			c = await self.bcodeChar();
			bc = String.fromCharCode(c);
		}
	}

	async parseFrac(rec){
		let self = this;
		/* Number parsing mode. */
		while(true){
			let c = await self.bcodeChar();
			let bc = String.fromCharCode(c);

			if (bc != ' ') {
				let v = Parser.getDigit(c, false);
				if(null === v)
					return [c, bc];
				rec.accFrac *= 10;
				rec.accFrac += v;
				++rec.fracCount;
			}
		}
	}

	async * rxLine(){
		let self = this;

		let clear = true;
		let value = {};
		while(true){

			if(clear){
				value = {
					"params" : {}
				};
				clear = false;
			}

			let c = await self.bcodeChar();
			if(null == c)
				break;

			let bc = String.fromCharCode(c);

			let rec = {
				"hexMode" : false
				,"negative" : false
				,"acc" : 0
				,"accFrac" : 0
				,"digitCount" : 0
				,"fracCount" : 0
			};

			let attr = {
				"indefinite" : false
				,"greaterthan" : false
				,"lessthan" : false
			};

			switch(bc){
					/* Drop comment characters */
				case '(':
					await self.bcodeDrop(')');
					continue;

				case ';':
					await self.bcodeDrop('\n');
					continue;

				case '\t':
				case ' ':
				case '\r':
				case '\n':
					continue;

				case '$':
					{
						let str = "";
						while(true){
							let ch = await self.getChar();
							++self.charCounter;
							let chTmp = String.fromCharCode(ch);
							if('\n' == chTmp)
								break;
							if('\0' == chTmp)
								break;
							str += chTmp;
						}
						value.strBuffer = str;
					}
					continue;

					/* Start of hex binary data array */
				case '%':
					{
						let arr = [];

						while(true){
							let ch = await self.bcodeChar();
							++self.charCounter;
							let chTmp = String.fromCharCode(ch);
							if('%' == chTmp)
								break;
							if('\t' == chTmp
								|| ' ' == chTmp
								|| '\r' == chTmp
								|| '\n' == chTmp)
							{
								continue;
							}

							/* Require 2 hex digits in sequence. */
							let v1 = Parser.getDigit(ch, true);
							if(null === v1)
								throw new Error("Invalid hex symbol in ASCII binary array1 " + ch.value);

							ch = await self.bcodeChar();
							let v2 = Parser.getDigit(ch, true);
							if(null === v2)
								throw new Error("Invalid hex symbol in ASCII binary array2" + ch.value);

							v1 <<= 4;
							v1 |= v2;
							arr.push(v1);
						}
						value.binBuffer = new Uint8Array(arr);
						continue;
					}

					/* Start of hex number */
				case '#':
					rec.hexMode = true;
					let [ct, bct] = await self.parseNumber(rec);
					c = ct;
					bc = bct;
					rec.hexMode = false;

					if(bc != '#')
						throw new Error("Invalid hex symbol in number " + ch.value);

					c = await self.bcodeChar();
					bc = String.fromCharCode(c);
					break;

					/* Start of negative number */
				case '-':
					rec.negative = true;
					let [cta, bcta] = await self.parseNumber(rec);
					c = cta;
					bc = bcta;
					break;

				default:
					const QUALIFIERS = {
						"?" : "indefinite"
						,">" : "greaterthan"
						,"<" : "lessthan"
					};

					if(bc in QUALIFIERS){
						rec[QUALIFIERS[bc]] = true;
						c = await self.bcodeChar();
						bc = String.fromCharCode(c);
						continue;
					}

					break;
			}

			/* Expecting a number or fractional indicator */
			let [ctr, bctr] = await self.parseNumber(rec, c);
			c = ctr;
			bc = bctr;

			if('.' == bc){
				if(!rec.digitCount)
					throw new Error("Decimal with no leading digits");

				if(rec.fracCount)
					throw new Error("Fraction already present!");

				let [cy, bcy] = await self.parseFrac(rec);
				c = cy;
				bc = bcy;
			}
			else if('&' == bc){
				let arr = [];
				/* Binary payload. */
				for(let k = 0; k < rec.acc; ++k){
					c = await self.bcodeChar();
					arr.push(c);
				}
				value.binBuffer = new Uint8Array(arr);
				continue;
			}

			rec.strValue = "";

			if(rec.digitCount){
				let p1 = rec.acc;
				let p2 = "";
				if(rec.fracCount){
					p2 = rec.accFrac + "";
					while(p2.length < rec.fracCount)
						p2 = "0" + p2;
					p2 = "." + p2;
				}
				rec.strValue = p1 + p2;
				rec.numValue = parseFloat(rec.strValue);
				if(rec.negative){
					rec.numValue *= -1.0;
					rec.strValue = "-" + rec.strValue;
				}
			}

			if(rec.greaterthan)
				rec.strValue = ">" + rec.strValue;
			if(rec.lessthan)
				rec.strValue = "<" + rec.strValue;
			if(rec.indefinite){
				rec.strValue = "?" + rec.strValue;
				if(rec.greaterthan){
					rec.numValue = Infinity;
					rec.strValue = "?>";
					if(rec.negative){
						rec.numValue = -Infinity;
						rec.strValue = "-?>";
					}
				}
			}

			/* Look for command. */
			if(c >= 0x60 && c <= 0x7F){
				++self.lineCounter;

				if(!rec.digitCount){
					throw new Error("Command " + self.lineCounter + " must have numeric parameter!");
				}

				rec.code = bc;
				value.cmd = rec;
				yield new Line(value);

				clear = true;
			}
			else if(c >= 0x40 && c <= 0x5F){
				value.params[bc] = rec;
			}
			else{
				/* Error. */
				throw new Error("Invalid bcode char " + c + " '" + bc + "' @ " + self.charCounter);
			}

		}
	}

}

async function parseSegments(parser){
	let ps = parser.rxLine();

	let ret = [];

	while(!ps.done){
		let line = await ps.next();
		if(!line.value)
			break;
		line = line.value;

		if(!line.bool(STD.RANGE)){
			ret.push([line]);
			continue;
		}

		let range = line.numpair(STD.RANGE);
		let lineset = [];
		lineset.push(line);
		while(range[0] != range[1]){
			line = await ps.next();
			if(!line.value)
				break;
			line = line.value;

			lineset.push(line);
			range = line.numpair(STD.RANGE);
		}

		ret.push(lineset);
	}

	return ret;
}

async function parseData(data){
	let parser = new Parser(data);
	let stream = parser.rxLine();

	let lines = [];
	while(true){
		let bcl = await stream.next();
		if(!bcl.value)
			break;
		bcl = bcl.value;
		lines.push(bcl);
	}

	return lines;
}

const BCODe = {
	STD : STD
	,Line : Line
	,Parser : Parser
	,parseSegments : parseSegments
	,parseData : parseData
};

export {BCODe};

export default BCODe;
