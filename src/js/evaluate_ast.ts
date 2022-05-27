import jsep from "jsep";
import { ast_node_types, is_core } from "./ast";
import { attribute } from "./attribute";
import { character } from "./character";
import { init_jsep } from "./jsep_hack";
import { stat_node, stat_node_type } from "./stat_node";
init_jsep();

enum diceroll_setting {
	disabled,
}

export type evaluate_value = string | number | boolean | attribute | ((...args: evaluate_value[]) => evaluate_value) | evaluate_value[] | undefined


function get_evaluate_value_of_stat_node(node: stat_node): evaluate_value {
	switch (node.node_type) {
		case stat_node_type.unborn: throw Error("Character has no attribute with that id");
		case stat_node_type.attribute: return node;
		case stat_node_type.counter: {
			if (node.error) throw Error("There's an error in a referenced node");
			return node.value;
		}
		case stat_node_type.property: {
			if (node.error) throw Error("There's an error in a referenced node");
			return node.result;
		}
		default: throw Error("Formula is somehow referencing an unhandled node. This shouldn't happen");
	}
}

export function evaluate_ast(node: jsep.Expression): evaluate_value {
	if (!is_core(node)) throw Error("Unknown node type");
	switch (node.type) {
		case ast_node_types.Literal: {
			if (node.value instanceof RegExp) return undefined;
			if (node.value === null) return undefined;
			return node.value;
		}
		case ast_node_types.ThisExpression: {
			return get_evaluate_value_of_stat_node(character.children_by_id["this"]);
		}
		case ast_node_types.Identifier: {
			return get_evaluate_value_of_stat_node(character.children_by_id[node.name]);
		}
		
		case ast_node_types.MemberExpression: {
			const attribute = evaluate_ast(node.object);
			if (node.optional && attribute === undefined) {
				// this skips resolution of computed members below, which I'm pretty sure is how its supposed to work
				return attribute;
			}
			if (
				typeof attribute !== "object" ||
				!("node_type" in attribute) ||
				attribute.node_type !== stat_node_type.attribute
			) throw Error("Cannot access members of non-attributes");


			if (node.computed) {
				throw Error("Computed member access is disabled due to dependency issues");
				// const property = evaluate_ast(node.property, context);
				// return object[property];
			} else {
				const property = node.property as jsep.CoreExpression;
				if (property.type !== ast_node_types.Identifier) throw Error("Invalid non-identifier node on non-computed property. How did we get here?"); 
				return get_evaluate_value_of_stat_node(attribute.children_by_id[property.name]);
			}
		}
		case ast_node_types.UnaryExpression: {
			const argument = evaluate_ast(node.argument);
			switch (node.operator) {
				case "!": return !argument;
				case "-": { if (typeof argument !== "number") throw Error("Cannot do math on a non-number value"); return -argument; }
				case "+": { if (typeof argument !== "number") throw Error("Cannot do math on a non-number value"); return +argument; }
				case "~": { if (typeof argument !== "number") throw Error("Cannot do math on a non-number value"); return ~argument; }
				default: throw Error("Invalid unary operator");
			}
		}
		case ast_node_types.BinaryExpression: {
			const left = evaluate_ast(node.left);
			const right = evaluate_ast(node.right);
			switch (node.operator) {
				case "==":  return left === right;
				case "!=":  return left !== right;
				case ">":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left > right; }
				case "<":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left < right; }
				case ">=":  { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left >= right; }
				case "<=":  { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left <= right; }
				// todo: allow string concat
				case "+":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left + right; }
				case "-":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left - right; }
				case "*":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left * right; }
				case "/":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left / right; }
				case "%":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left % right; }
				case "**":  { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left ** right; }
				case "&":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left & right; }
				case "|":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left | right; }
				case "^":   { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left ^ right; }
				case "<<":  { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left << right; }
				case ">>":  { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left >> right; }
				case ">>>": { if (typeof left !== "number" || typeof right !== "number") throw Error("Cannot do math on a non-number value"); return left >>> right; }
				case "||":  return left || right;
				case "&&":  return left && right;

				case "d":
				case "D": {
					// todo: implement
					switch (diceroll_setting.disabled) {
						case undefined:
						case diceroll_setting.disabled: {
							throw Error("Dice are unsupported for this value");
						}
					}
				}

				default: throw Error("Invalid binary operator");
			}
		}
		case ast_node_types.ConditionalExpression: {
			const test = evaluate_ast(node.test);
			const consequent = evaluate_ast(node.consequent);
			const alternate = evaluate_ast(node.alternate);
			return test ? consequent : alternate;
		}
		case ast_node_types.CallExpression: {
			const callee = evaluate_ast(node.callee);
			if (typeof callee !== "function") throw Error("Cannot call a non-function value");
			const args = node.arguments.map(arg => evaluate_ast(arg));
			return callee.apply(undefined, args);
		}
		case ast_node_types.ArrayExpression: {
			const elements = node.elements.map(el => evaluate_ast(el));
			return elements;
		}
		case ast_node_types.Compound: {
			let res: evaluate_value;
			for (const exp of node.body) res = evaluate_ast(exp);
			return res;
		}
		default:
			return undefined;
	}
};
