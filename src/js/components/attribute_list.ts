import { attribute } from "../attribute";
import { show_edit_attribute_popup } from "../popups/edit_attribute";
import { character } from "../character";
import { new_from_template } from "../template";
import { get_index_in_parent } from "../utils";

export function hydrate_attribute_list() {
	const add_attribute_button = document.querySelector("#sheet .attributes .add") as HTMLButtonElement;
	add_attribute_button.addEventListener("click", on_add_attribute_click);
	const ul = document.querySelector("#sheet .attributes ul")!;

	const counter_items = character.attributes.map(attribute => hydrate_attribute(new_from_template("#sheet_attribute_item_template"), attribute));
	ul.replaceChildren(...counter_items);
}


function on_add_attribute_click() {
	add_new_attribute();
}

function add_new_attribute() {
	const attribute = {
		name: `Attribute ${character.attributes.length}`,
		id: `attribute_${character.attributes.length}`,
		description: "",
		counters: [],
		properties: [],
		modifiers: [],
		subattributes: [],
	};
	character.attributes.push(attribute);
	
	const ul = document.querySelector("#sheet .attributes ul")!;
	const item = hydrate_attribute(new_from_template("#sheet_attribute_item_template"), attribute);
	ul.appendChild(item);

}

function hydrate_attribute(element: Element, attribute: attribute): Element {
	const name_button = element.querySelector("button.name") as HTMLButtonElement;
	const delete_button = element.querySelector("button.delete") as HTMLButtonElement;
	name_button.textContent = attribute.name;
	name_button.addEventListener("click", on_attribute_view_click);
	delete_button.addEventListener("click", on_attribute_delete_click);
	
	return element;
}

function on_attribute_view_click(ev: MouseEvent) {
	const li = (ev.currentTarget as HTMLButtonElement).closest("li")!;
	const index = get_index_in_parent(li);
	show_edit_attribute_popup(character.attributes[index]);
}

function on_attribute_delete_click(ev: MouseEvent) {
	if (!(ev.currentTarget instanceof HTMLButtonElement)) throw Error("Event only works on button elements");
	const li = ev.currentTarget.closest("li")!
	const index = get_index_in_parent(li);
	character.attributes.splice(index, 1);
	li.remove();
}
