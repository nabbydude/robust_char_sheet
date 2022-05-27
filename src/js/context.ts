import { attribute } from "./attribute";
import { character } from "./character";

export interface evaluation_context {
	[key: string]: attribute_context,
}

export interface attribute_context {
	[key: string]: attribute_context | number,
}

export function get_evaluation_context(): evaluation_context {
	const context: evaluation_context = {};
	for (const attribute of character.attributes) {
		context[attribute.id] = get_attribute_context(attribute);
	}
	return context;
}

export function get_attribute_context(attribute: attribute): attribute_context {
	const context: attribute_context = {};
	for (const counter of attribute.counters) {
		context[counter.id] = counter.value;
	}
	for (const property of attribute.properties) { // Maybe we dont add these initially and add them one at a time as they are evaluated
		context[property.id] = 0;
		// context[property.id] = property.value;
	}
	for (const subattribute of attribute.subattributes) {
		context[subattribute.id] = get_attribute_context(subattribute);
	}
	return context;
}

export type address_value = modifiable_addresses | "property" | "counter";
export interface modifiable_addresses {
	[key: string]: address_value | undefined,
}

export function get_all_modifiable_addresses(): modifiable_addresses {
	const context: modifiable_addresses = {};
	for (const attribute of character.attributes) {
		context[attribute.id] = get_attribute_modifiable_addresses(attribute);
	}
	return context;
}

export function get_attribute_modifiable_addresses(attribute: attribute): modifiable_addresses {
	const context: modifiable_addresses = {};
	for (const counter of attribute.counters) {
		context[counter.id] = "counter";
	}
	for (const property of attribute.properties) {
		context[property.id] = "property";
	}
	for (const subattribute of attribute.subattributes) {
		context[subattribute.id] = get_attribute_modifiable_addresses(subattribute);
	}
	return context;
}
