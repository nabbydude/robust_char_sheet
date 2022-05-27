import { attribute } from "./attribute";
import { character } from "./character";
import { counter, update_counter } from "./counter";
import { formula, link_formula, update_formula } from "./formula";
import { address, modifier, update_modifier } from "./modifier";
import { property, update_property } from "./property";

export enum stat_node_type {
	unborn,
	character,
	attribute,
	counter,
	property,
	modifier,
	formula,
}

export interface stat_node_base {
	node_type: stat_node_type,
	parent?: stat_node,
	dependencies: stat_node[],
	dependants: stat_node[],
	children: stat_node[],
	error?: Error,
}

export interface ided_stat_node_base extends stat_node_base {
	id: string,
	parent?: ided_stat_node | character,
	children_by_id: { [id: string]: ided_stat_node },
}

export type stat_node = unborn | character | attribute | counter | property | modifier | formula;
export type ided_stat_node = Extract<stat_node, ided_stat_node_base>;


export interface unborn extends ided_stat_node_base {
	node_type: stat_node_type.unborn,
}

export interface unborn_tree {
	// non-terminal nodes must hold data because one node might depend on a.b.c and another on a.b.c.d
	nodes: stat_node[],
	children: { [child: string]: unborn_tree },
}

export function get_node_address(node: ided_stat_node): address {
	let out = node.id;
	for (
		let parent = node.parent;
		parent && parent.node_type !== stat_node_type.character;
		parent = parent.parent
	) {
		out = `${parent.id}.${out}`;
	}
	return out;
}


// Dependency Design Note: if a node directly depends on another for muliple reasons (like a property is in the formula for both a counters min and max) it will be listed twice. This is intentional, so that if one changes then only one will be removed.

export function link_depender_side(depender: stat_node, dependee: stat_node) {
	depender.dependencies.push(dependee);
	// TODO: sort on insertion by modifier prio for properties
}

export function link_dependee_side(depender: stat_node, dependee: stat_node) {
	dependee.dependants.push(depender);
}

export function link_both_sides(depender: stat_node, dependee: stat_node) {
	link_depender_side(depender, dependee);
	link_dependee_side(depender, dependee);
}

export function unlink_depender_side(depender: stat_node, dependee: stat_node) {
	const index = depender.dependencies.indexOf(dependee);
	if (index === -1) throw Error("Dependee not found in dependencies, some sort of desync?");
	if (
		depender.node_type === stat_node_type.unborn &&
		depender.dependencies.length === 1 &&
		depender.dependants.length === 0 &&
		depender.children.length === 0
	) {
		kill_unborn(depender);
	} else {
		depender.dependencies.splice(index, 1);
	}
}

export function unlink_dependee_side(depender: stat_node, dependee: stat_node) {
	const index = dependee.dependants.indexOf(depender);
	if (index === -1) throw Error("Depender not found in dependants, some sort of desync?");
	if (
		depender.node_type === stat_node_type.unborn &&
		depender.dependencies.length === 0 &&
		depender.dependants.length === 1 &&
		depender.children.length === 0
	) {
		kill_unborn(depender);
	} else {
		depender.dependants.splice(index, 1);
	}
}

export function unlink_both_sides(depender: stat_node, dependee: stat_node) {
	unlink_depender_side(depender, dependee);
	unlink_dependee_side(depender, dependee);
}

export function kill_unborn(unborn: unborn) {
	const parent = unborn.parent;
	if (!parent) return;
	if (
		parent.node_type === stat_node_type.unborn &&
		parent.dependencies.length === 0 &&
		parent.dependants.length === 0 &&
		parent.children.length === 1
	) {
		kill_unborn(parent);
	} else {
		const index = parent.children.indexOf(unborn);
		if (index === -1) throw Error("Unborn not found in parent's children, some sort of desync?");
		parent.children.splice(index, 1);
	}
}

export function get_unclaimed_id(parent: ided_stat_node, id: string): string {
	if (!parent.children_by_id[id] || parent.children_by_id[id].node_type === stat_node_type.unborn) return id;
	for (let i = 0; i < 100; i++) {
		const test = `${id}_${i}`;
		if (!parent.children_by_id[test] || parent.children_by_id[id].node_type === stat_node_type.unborn) return test;
	}
	throw Error("Too many claimed IDs. This is getting out of hand");
}

export function get_child_or_create_unborn(node: ided_stat_node | character, id: string): ided_stat_node {
	let child: ided_stat_node | undefined = node.children_by_id[id];
	if (!child) {
		child = {
			node_type: stat_node_type.unborn,
			id,
			parent: node,
			dependencies: [],
			dependants: [],
			children: [],
			children_by_id: {},
		};
		node.children.push(child);
		node.children_by_id[id] = child;
	}

	return child;
}


export function find_node_or_create_unborn(address: address): ided_stat_node {
	const members = address.split(".");
	let current: character | ided_stat_node = character;
	for (const id of members) {
		current = get_child_or_create_unborn(current, id);
	}

	return current as unknown as ided_stat_node;
}

export function link_everything() {
	for (const attribute of character.attributes) {
		link_everything_in_attribute(attribute); 
	}
}

export function link_everything_in_attribute(attribute: attribute) {

	for (const counter of attribute.counters) {
		if (counter.min.ast) link_formula(counter.min); 
		if (counter.max.ast) link_formula(counter.max); 
	}

	for (const modifier of attribute.modifiers) {
		if (modifier.operand.ast) link_formula(modifier.operand); 
	}
	
	for (const subattribute of attribute.subattributes) {
		// TODO: handle subattribute conditions
		link_everything_in_attribute(subattribute); 
	}
}


export function update_all_nodes() {
	const updated_set = new Set<stat_node>();
	for (const attribute of character.attributes) {
		prepare_dependencies_and_update_node_and_children(attribute, updated_set); 
	}
}

export function prepare_dependencies_and_update_node_and_children(node: stat_node, updated_set: Set<stat_node>) {
	if (updated_set.has(node)) return;

	for (const dependee of node.dependencies) {
		prepare_dependencies_and_update_node_and_children(dependee, updated_set); 
	}

	update_node(node, false);
	updated_set.add(node);

	for (const child of node.children) {
		prepare_dependencies_and_update_node_and_children(child, updated_set); 
	}
}

export function update_node(node: stat_node, notify_dependants: boolean = true) {
	switch (node.node_type) {
		case stat_node_type.unborn: { return; }

		case stat_node_type.character: // fallthrough
		case stat_node_type.attribute: { return; }

		case stat_node_type.counter: { update_counter(node, notify_dependants); return; }
		case stat_node_type.property: { update_property(node, notify_dependants); return; }
		case stat_node_type.modifier: { update_modifier(node, notify_dependants); return; }
		case stat_node_type.formula: { update_formula(node, notify_dependants); return; }
	}
}

export function update_dependants(node: stat_node) {
	for (const dependant of node.dependants) {
		update_node(dependant);
	}
}
