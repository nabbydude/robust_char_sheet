import jsep from "jsep";
import { character } from "./character";
import { init_jsep } from "./jsep_hack";
import { get_child_or_create_unborn, ided_stat_node } from "./stat_node";
init_jsep();

export const ast_node_types = {
	Literal: "Literal",
	Identifier: "Identifier",
	ThisExpression: "ThisExpression",
	MemberExpression: "MemberExpression",
	UnaryExpression: "UnaryExpression",
	BinaryExpression: "BinaryExpression",
	ConditionalExpression: "ConditionalExpression",
	CallExpression: "CallExpression",
	ArrayExpression: "ArrayExpression",
	Compound: "Compound",
} as const;

export function is_core(node: jsep.Expression): node is jsep.CoreExpression {
	return node.type in ast_node_types;
}

export function get_ast_dependencies(ast: jsep.Expression): ided_stat_node[] {
	const out: ided_stat_node[] = [];
	add_dependencies_to_list(ast, out)
	return out;
}

// TODO: this will also add every parent of a dependency to its dependencies. is there a way to fix that through just static analysis?
function add_dependencies_to_list(node: jsep.Expression, list: ided_stat_node[]): ided_stat_node[] {
	if (!is_core(node)) throw Error("Unknown node type");
	switch (node.type) {
		case ast_node_types.Literal: {
			return [];
		}
		case ast_node_types.Identifier: {
			const value = get_child_or_create_unborn(character, node.name);
			list.push(value);
			return [value];
		}
		case ast_node_types.ThisExpression: {
			const value = get_child_or_create_unborn(character, "this");
			list.push(value);
			return [value];
		}
		case ast_node_types.MemberExpression: {
			const objects = add_dependencies_to_list(node.object, list);

			if (node.computed) {
				throw Error("Computed member access is disabled due to dependency issues");
				// const property = evaluate_ast(node.property, context);
				// return object[property];
			} else {
				const property = node.property as jsep.CoreExpression;
				if (property.type !== ast_node_types.Identifier) throw Error("Invalid non-identifier node on non-computed property. How did we get here?");

				const out = [];
				for (const object of objects) {
					const value = get_child_or_create_unborn(object, property.name);
					list.push(value);
					out.push(value);
				}

				return out;
			}
		}
		case ast_node_types.UnaryExpression: {
			return add_dependencies_to_list(node.argument, list);
		}
		case ast_node_types.BinaryExpression: {
			const left = add_dependencies_to_list(node.left, list);
			const right = add_dependencies_to_list(node.right, list);
			return left.concat(right);
		}
		case ast_node_types.ConditionalExpression: {
			const test = add_dependencies_to_list(node.test, list);
			const consequent = add_dependencies_to_list(node.consequent, list);
			const alternate = add_dependencies_to_list(node.alternate, list);
			return consequent.concat(alternate);
		}
		case ast_node_types.CallExpression: {
			const callee = add_dependencies_to_list(node.callee, list);
			const args = node.arguments.flatMap(arg => add_dependencies_to_list(arg, list));
			return callee.concat(args);
		}
		case ast_node_types.ArrayExpression: {
			const elements = node.elements.flatMap(el => add_dependencies_to_list(el, list));
			return elements;
		}
		case ast_node_types.Compound: {
			let res: any;
			for (const exp of node.body) res = add_dependencies_to_list(exp, list);
			return res;
		}
	}
};
