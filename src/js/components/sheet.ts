import { ui_state } from "../state";
import { hydrate_abilities } from "./ability_list";
import { hydrate_attribute_list } from "./attribute_list";

export function hydrate_sheet() {
	hydrate_abilities();
	hydrate_attribute_list();

}
