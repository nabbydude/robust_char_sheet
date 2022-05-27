import { address_value, get_all_modifiable_addresses } from "./context";
import { formula } from "./formula";
import { stat_node_base, stat_node_type, update_dependants } from "./stat_node";

export enum modifier_operation {
	set,
	add,
	subtract,
	multiply,
	divide,
	clamp_minimum,
	clamp_maximum,
};

export const modifier_operation_map = {
	[modifier_operation.set]: "=",
	[modifier_operation.add]: "+",
	[modifier_operation.subtract]: "\u{2212}",
	[modifier_operation.multiply]: "\u{00D7}",
	[modifier_operation.divide]: "\u{00F7}",
	[modifier_operation.clamp_minimum]: ">",
	[modifier_operation.clamp_maximum]: "<",
} as const;

export type address = string;

export interface modifier extends stat_node_base {
	node_type: stat_node_type.modifier,
	address: address,
	operation: modifier_operation,
	operand: formula,
	priority: number,
	error?: Error,
};

export function validate_address(address: address): [valid: true, members: string[]] | [valid: false, reason: string] {
	if (/[^a-z0-9_\.]/.test(address)) return [false, "Invalid character in address"];
	if (/\.\./.test(address)) return [false, "Can't have two adjacent dots in an address"];
	if (/^\.|\.$/.test(address)) return [false, "Address can't begin or end with a dot"];
	const members = address.split(".");
	const context = get_all_modifiable_addresses();
	let current: address_value | undefined = context;
	for (const member of members) {
		if (typeof current !== "object") return [false, "Can't index into a non-attribute subvalue"];
		current = current[member];
		if (current === undefined) return [false, "Can't access a non-existent property/subattribute"];
	}
	if (typeof current === "object") return [false, "Can't modify an attribute directly, access one of its properties instead"];
	if (current === "counter") return [false, "Can't modify a counter directly, trying making a property and set its min or max to that"];
	if (current === "property") {
		// address.members = members;
		return [true, members];
	}
	throw Error("Unexpected value in address_value: " + current);
}

export function update_modifier(modifier: modifier, notify_dependants: boolean = true) {
	if (notify_dependants) update_dependants(modifier);
}
