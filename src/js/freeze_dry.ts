import { attribute } from "./attribute";
import { character } from "./character";
import { counter } from "./counter";
import { new_formula_from_text } from "./formula";
import { address, modifier, modifier_operation } from "./modifier";
import { property } from "./property";
import { ided_stat_node, ided_stat_node_base, link_both_sides, stat_node_base, stat_node_type } from "./stat_node";

export interface freeze_dried_character {
	character_name: string,
	class: string,
	player_name: string,
	race: string,
	experience: number,
	level: number,
	abilities: {
		strength: number,
		dexterity: number,
		constitution: number,
		intelligence: number,
		wisdom: number,
		charisma: number,
	},
	attributes: freeze_dried_attribute[],
};

interface freeze_dried_attribute {
	id: string,
	name: string,

	condition?: freeze_dried_formula, // subattribute only

	description: string,
	counters: freeze_dried_counter[],
	properties: freeze_dried_property[],
	modifiers: freeze_dried_modifier[],
	subattributes: freeze_dried_attribute[],
};

type freeze_dried_formula = string;

export interface freeze_dried_counter {
	name: string,
	id: string,
	value: number,
	min: freeze_dried_formula,
	max: freeze_dried_formula,
};

export interface freeze_dried_property {
	name: string,
	id: string,
};

export interface freeze_dried_modifier {
	address: address,
	operation: modifier_operation,
	operand: freeze_dried_formula,
	priority: number,
};

////////////////
// freeze_dry //
////////////////

function default_base(): stat_node_base {
	return {
		node_type: stat_node_type.unborn,
		dependencies: [],
		dependants: [],
		children: [],
	}
}

function default_ided_base(): ided_stat_node_base {
	return {
		node_type: stat_node_type.unborn,
		id: "",
		dependencies: [],
		dependants: [],
		children: [],
		children_by_id: {},
	}
}

function default_character(): stat_node_base & { children_by_id: { [id: string]: ided_stat_node } } {
	return {
		node_type: stat_node_type.character,
		dependencies: [],
		dependants: [],
		children: [],
		children_by_id: {},
	}
}

export function freeze_dry_character(base: character): freeze_dried_character {
	return {
		character_name: base.character_name,
		class: base.class,
		player_name: base.player_name,
		race: base.race,
		experience: base.experience,
		level: base.level,
		abilities: {
			strength: base.abilities.strength,
			dexterity: base.abilities.dexterity,
			constitution: base.abilities.constitution,
			intelligence: base.abilities.intelligence,
			wisdom: base.abilities.wisdom,
			charisma: base.abilities.charisma,
		},
		attributes: base.attributes.map(v => freeze_dry_attribute(v)),
	}
}

export function freeze_dry_attribute(attribute: attribute): freeze_dried_attribute {
	return {
		id: attribute.id,
		name: attribute.name,
	
		condition: attribute.condition?.text,
	
		description: attribute.description,
		counters: attribute.counters.map(v => freeze_dry_counter(v)),
		properties: attribute.properties.map(v => freeze_dry_property(v)),
		modifiers: attribute.modifiers.map(v => freeze_dry_modifier(v)),
		subattributes: attribute.subattributes.map(v => freeze_dry_attribute(v)),
	}
}

export function freeze_dry_counter(counter: counter): freeze_dried_counter {
	return {
		name: counter.name,
		id: counter.id,
		value: counter.value,
		min: counter.min.text,
		max: counter.max.text,
	}
}

export function freeze_dry_property(property: property): freeze_dried_property {
	return {
		name: property.name,
		id: property.id,
	}
}

export function freeze_dry_modifier(modifier: modifier): freeze_dried_modifier {
	return {
		address: modifier.address,
		operation: modifier.operation,
		operand: modifier.operand.text,
		priority: modifier.priority,
	}
}

////////////
// reheat //
////////////

export function reheat_character(dried: freeze_dried_character, base_node: stat_node_base = default_character()): character {
	const out = base_node as character;

	out.node_type = stat_node_type.character;
	out.character_name = dried.character_name;
	out.class = dried.class;
	out.player_name = dried.player_name;
	out.race = dried.race;
	out.experience = dried.experience;
	out.level = dried.level;
	out.abilities = {
		strength: dried.abilities.strength,
		dexterity: dried.abilities.dexterity,
		constitution: dried.abilities.constitution,
		intelligence: dried.abilities.intelligence,
		wisdom: dried.abilities.wisdom,
		charisma: dried.abilities.charisma,
	};

	out.attributes = dried.attributes.map(v => {
		const base = out.children_by_id[v.id];
		// TODO: Handle duplicate ids
		const counter = reheat_attribute(v, base);
		if (!base) {
			counter.parent = out;
			out.children.push(counter);
			out.children_by_id[counter.id] = counter;
		}
		return counter;
	});

	return out;
}

export function reheat_attribute(dried: freeze_dried_attribute, base_node: ided_stat_node_base = default_ided_base()): attribute {
	const out = base_node as attribute;

	out.node_type = stat_node_type.attribute;
	out.id = dried.id;
	out.name = dried.name;
	out.description = dried.description;

	out.counters = dried.counters.map(v => {
		const base = out.children_by_id[v.id];
		// TODO: Handle duplicate ids
		const counter = reheat_counter(v, base);
		if (!base) {
			counter.parent = out;
			out.children.push(counter);
			out.children_by_id[counter.id] = counter;
		}
		return counter;
	});

	out.properties = dried.properties.map(v => {
		const base = out.children_by_id[v.id];
		// TODO: Handle duplicate ids
		const property = reheat_property(v, base);
		if (!base) {
			property.parent = out;
			out.children.push(property);
			out.children_by_id[property.id] = property;
		}
		return property;
	});

	out.modifiers = dried.modifiers.map(v => {
		const modifier = reheat_modifier(v);
		modifier.parent = out;
		return modifier;
	});

	out.subattributes = dried.subattributes.map(v => {
		const base = out.children_by_id[v.id];
		// TODO: Handle duplicate ids
		const subattribute = reheat_attribute(v, base);
		if (!base) {
			subattribute.parent = out;
			out.children.push(subattribute);
			out.children_by_id[subattribute.id] = subattribute;
		}
		return subattribute;
	});

	if (dried.condition !== undefined) {
		out.condition = new_formula_from_text(dried.condition, out);
		link_both_sides(out, out.condition);
		out.children.push(out.condition);
	}

	return out;
}

export function reheat_counter(dried: freeze_dried_counter, base_node: ided_stat_node_base = default_ided_base()): counter {
	const out = base_node as counter;

	out.node_type = stat_node_type.counter;
	out.name = dried.name;
	out.id = dried.id;
	out.value = dried.value;

	out.min = new_formula_from_text(dried.min, out);
	out.max = new_formula_from_text(dried.max, out);

	out.children.push(out.min, out.max);

	link_both_sides(out, out.min);
	link_both_sides(out, out.max);

	return out;
}

export function reheat_property(dried: freeze_dried_property, base_node: ided_stat_node_base = default_ided_base()): property {
	const out = base_node as property;

	out.node_type = stat_node_type.property;
	out.id = dried.id;
	out.name = dried.name;

	return out;
}

export function reheat_modifier(dried: freeze_dried_modifier, base_node: stat_node_base = default_base()): modifier {
	const out = base_node as modifier;

	out.node_type = stat_node_type.modifier;
	out.address = dried.address;
	out.operation = dried.operation;
	out.priority = dried.priority;

	out.operand = new_formula_from_text(dried.operand, out);

	link_both_sides(out, out.operand);

	out.children.push(out.operand);

	return out;
}
