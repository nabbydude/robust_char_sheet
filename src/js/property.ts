import { modifier, modifier_operation } from "./modifier";
import { ided_stat_node_base, stat_node, stat_node_type, update_dependants } from "./stat_node";

export interface property extends ided_stat_node_base {
	node_type: stat_node_type.property,
	name: string,
	result?: number,
	error?: Error,
};

export function update_property(property: property, notify_dependants: boolean = true) {
	const old_value = property.result;
	const modifiers = property.dependencies
		.filter((v => v.node_type === stat_node_type.modifier) as (v: stat_node) => v is modifier)
		.sort((a, b) => a.priority - b.priority);

	let value = 0;
	if (modifiers) {
		for (const modifier of modifiers) {
			if (modifier.error) continue;

			const operand = modifier.operand.result;
			if (operand === undefined) continue;
			switch (modifier.operation) {
				case modifier_operation.set:           { value = operand; continue; }
				case modifier_operation.add:           { value += operand; continue; }
				case modifier_operation.subtract:      { value -= operand; continue; }
				case modifier_operation.multiply:      { value *= operand; continue; }
				case modifier_operation.divide:        { value /= operand; continue; }
				case modifier_operation.clamp_minimum: { value = value > operand ? value : operand; continue; }
				case modifier_operation.clamp_maximum: { value = value < operand ? value : operand; continue; }
			}
		}
	}

	property.result = value;
	if (notify_dependants && old_value !== old_value) update_dependants(property);
}
