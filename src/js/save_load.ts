import { character } from "./character";
import { hydrate_sheet } from "./components/sheet";
import { freeze_dry_character, reheat_character } from "./freeze_dry";
import { close_active_popup } from "./popup";
import { ui_state } from "./state";
import { link_everything, update_all_nodes } from "./stat_node";

export function save_character() {
	const freeze_dried = freeze_dry_character(character)
	localStorage.setItem("character", JSON.stringify(freeze_dried));
}

export function load_character() {
	const string_data = localStorage.getItem("character") ;
	if (!string_data) throw Error("Failed to load character data");
	const freeze_dried = JSON.parse(string_data);

	reheat_character(freeze_dried, character);
	
	if (ui_state.active_popup) close_active_popup();
	
	link_everything();
	update_all_nodes();
	hydrate_sheet();
}
