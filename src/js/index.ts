import { hydrate_sheet } from "./components/sheet";
import { load_character, save_character } from "./save_load";
import { link_everything, update_all_nodes } from "./stat_node";
import { update_validity_tooltip, hide_tooltip } from "./tooltip";

document.addEventListener("mouseover", on_element_mouseover_or_focus);
document.addEventListener("focus", on_element_mouseover_or_focus);
document.addEventListener("mouseleave", () => hide_tooltip());

const save_button = document.querySelector("button#save")!;
const load_button = document.querySelector("button#load")!;
save_button.addEventListener("click", () => save_character());
load_button.addEventListener("click", () => load_character());

function on_element_mouseover_or_focus(ev: Event) {
	if (ev.target instanceof Element) update_validity_tooltip(ev.target);
}

link_everything();
update_all_nodes();
hydrate_sheet();
