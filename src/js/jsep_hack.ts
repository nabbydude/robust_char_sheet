import { Jsep } from "jsep";

export function init_jsep() {

	Jsep.addBinaryOp("d", 18)
	Jsep.addBinaryOp("D", 18)
	Jsep.removeUnaryOp("++")
	Jsep.removeUnaryOp("--")

	Jsep.prototype.gobbleNumericLiteral = function() {
		let number = '', ch, chCode;

		while (Jsep.isDecimalDigit(this.code)) {
			number += this.expr.charAt(this.index++);
		}

		if (this.code === Jsep.PERIOD_CODE) { // can start with a decimal marker
			number += this.expr.charAt(this.index++);

			while (Jsep.isDecimalDigit(this.code)) {
				number += this.expr.charAt(this.index++);
			}
		}

		ch = this.char;

		if (ch === 'e' || ch === 'E') { // exponent marker
			number += this.expr.charAt(this.index++);
			ch = this.char;

			if (ch === '+' || ch === '-') { // exponent sign
				number += this.expr.charAt(this.index++);
			}

			while (Jsep.isDecimalDigit(this.code)) { // exponent itself
				number += this.expr.charAt(this.index++);
			}

			if (!Jsep.isDecimalDigit(this.expr.charCodeAt(this.index - 1)) ) {
				this.throwError('Expected exponent (' + number + this.char + ')');
			}
		}

		chCode = this.code;

		// // Check to make sure this isn't a variable name that start with a number (123abc)
		// if (Jsep.isIdentifierStart(chCode)) {
		// 	this.throwError('Variable names cannot start with a number (' +
		// 		number + this.char + ')');
		// }
		// else
		if (chCode === Jsep.PERIOD_CODE || (number.length === 1 && number.charCodeAt(0) === Jsep.PERIOD_CODE)) {
			this.throwError('Unexpected period');
		}

		return {
			type: Jsep.LITERAL,
			value: parseFloat(number),
			raw: number
		};
	}

	const UPPERCASE_D = 68;
	const LOWERCASE_D = 100;

	Jsep.prototype.gobbleToken = function() {
		let ch, to_check, tc_len, node;

		this.gobbleSpaces();
		node = this.searchHook('gobble-token');
		if (node) {
			return this.runHook('after-token', node);
		}

		ch = this.code;

		if (Jsep.isDecimalDigit(ch) || ch === Jsep.PERIOD_CODE) {
			// Char code 46 is a dot `.` which can start off a numeric literal
			return this.gobbleNumericLiteral();
		}

		if (ch === Jsep.SQUOTE_CODE || ch === Jsep.DQUOTE_CODE) {
			// Single or double quotes
			node = this.gobbleStringLiteral();
		}
		else if (ch === Jsep.OBRACK_CODE) {
			node = this.gobbleArray();
		}
		else {
			to_check = this.expr.substr(this.index, Jsep.max_unop_len);
			tc_len = to_check.length;

			while (tc_len > 0) {
				// Don't accept an unary op when it is an identifier.
				// Unary ops that start with a identifier-valid character must be followed
				// by a non identifier-part valid character
				if (Jsep.unary_ops.hasOwnProperty(to_check) && (
					!Jsep.isIdentifierStart(this.code) ||
					(this.index + to_check.length < this.expr.length && !Jsep.isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length)))
				)) {
					this.index += tc_len;
					const argument = this.gobbleToken();
					if (!argument) {
						this.throwError('missing unaryOp argument');
					}
					return this.runHook('after-token', {
						type: Jsep.UNARY_EXP,
						operator: to_check,
						argument,
						prefix: true
					});
				}

				to_check = to_check.substr(0, --tc_len);
			}

			if (Jsep.isIdentifierStart(ch)) {
				node = this.gobbleIdentifier();
				if (Jsep.literals.hasOwnProperty(node.name)) {
					node = {
						type: Jsep.LITERAL,
						value: Jsep.literals[node.name],
						raw: node.name,
					};
				}
				else if (node.name === Jsep.this_str) {
					node = { type: Jsep.THIS_EXP };
				}
				// ADDITION HERE
				else if (node.name === "D" || node.name === "d") {
					node = undefined;
					this.index--;
				}
			}
			else if (ch === Jsep.OPAREN_CODE) { // open parenthesis
				node = this.gobbleGroup();
			}
		}

		if (!node) {
			return this.runHook('after-token', false);
		}

		node = this.gobbleTokenProperty(node);
		return this.runHook('after-token', node);
	}

	Jsep.prototype.gobbleExpressions = function(until_code: number) {
		let nodes = [], ch_i, node;

		while (this.index < this.expr.length) {
			ch_i = this.code;

			// CHANGE: Expressions can be separated by commas only
			if (nodes.length !== 0) {
				if (ch_i === Jsep.COMMA_CODE) {
					this.index++;
				} else if (ch_i === until_code) {
					break;
				} else {
					this.throwError('Unexpected "' + this.char + '"');
				}
			}
			// Try to gobble each expression individually
			if (node = this.gobbleExpression()) {
				nodes.push(node);
				// If we weren't able to find a binary expression and are out of room, then
				// the expression passed in probably has too much
			} else if (this.index < this.expr.length) {
				if (ch_i === until_code) {
					break;
				} else {
					this.throwError('Unexpected "' + this.char + '"');
				}
			}
		}

		return nodes;
	}

	Jsep.prototype.gobbleBinaryOp = function() {
		this.gobbleSpaces();
		let to_check = this.expr.substr(this.index, Jsep.max_binop_len);
		let tc_len = to_check.length;

		while (tc_len > 0) {
			// changed to accept identifier-like operators
			if (Jsep.binary_ops.hasOwnProperty(to_check) && (
				(this.index + to_check.length < this.expr.length)
			)) {
				this.index += tc_len;
				return to_check;
			}
			to_check = to_check.substr(0, --tc_len);
		}
		return false;
	}

	Jsep.prototype.parse = function(until_code?: number) {
		this.runHook('before-all');
		// ADDITION: until_code param to pass to gobbleExpressions
		const nodes = this.gobbleExpressions(until_code);

		// If there's only one expression just try returning the expression
		const node = nodes.length === 1
			? nodes[0]
			: {
				type: Jsep.COMPOUND,
				body: nodes
			};
		return this.runHook('after-all', node);
	}
}
