import { counter } from "./counter";
import { formula } from "./formula";
import { modifier } from "./modifier";
import { property } from "./property";
import { ided_stat_node, ided_stat_node_base, stat_node_type } from "./stat_node";

export interface attribute extends ided_stat_node_base {
	node_type: stat_node_type.attribute,
	name: string,
	
	condition?: formula, // subattribute only

	description: string,
	counters: counter[],
	properties: property[],
	modifiers: modifier[],
	subattributes: attribute[],
}

export function is_attribute_enabled(attribute: attribute): boolean {
	return true;
	// if (!subattribute.condition.ast) {
	// 	subattribute.condition.ast = jsep(subattribute.condition.text);
	// }
	// return Boolean(evaluate_expression(subattribute.condition.ast, {}));
}
