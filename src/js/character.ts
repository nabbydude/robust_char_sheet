import { attribute } from "./attribute";
import { ided_stat_node, stat_node, stat_node_base, stat_node_type } from "./stat_node";

export interface character extends stat_node_base {
	node_type: stat_node_type.character,
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
	attributes: attribute[],
	children_by_id: { [id: string]: ided_stat_node },
};

export const character: character = {
	node_type: stat_node_type.character,
	character_name: "",
	class: "",
	player_name: "",
	race: "",
	experience: 0,
	level: 0,
	abilities: {
		strength: 10,
		dexterity: 10,
		constitution: 10,
		intelligence: 10,
		wisdom: 10,
		charisma: 10,
	},

	attributes: [],

	dependencies: [],
	dependants: [],
	children: [],
	children_by_id: {},
};
