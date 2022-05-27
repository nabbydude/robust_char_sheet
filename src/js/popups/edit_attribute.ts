import { attribute } from "../attribute";
import { counter } from "../counter";
import { reflect_formula_box } from "../components/formula_box";
import { modifier, modifier_operation, modifier_operation_map, validate_address } from "../modifier";
import { close_active_popup, open_popup, popup_data_base, popup_type } from "../popup";
import { property, reflect_all_visible_formula_results } from "../property";
import { ui_state } from "../state";
import { new_from_template } from "../template";
import { update_validity_tooltip } from "../tooltip";
import { auto_resize_element, get_index_in_parent, text_to_id } from "../utils";
import { build_formula, built_formula, evaluate_formula, new_formula_from_text } from "../formula";
import { get_evaluation_context } from "../context";
import { reheat_counter, reheat_modifier, reheat_property } from "../freeze_dry";

export interface edit_attribute_popup_data extends popup_data_base {
	attribute: attribute;
	edit_mode: boolean;
}

export function show_edit_attribute_popup(attribute: attribute, { edit_mode = false } = {}) {
	const element = new_from_template("#edit_attribute_popup_template");
	const data: edit_attribute_popup_data = {
		type: popup_type.edit_attribute,
		element,
		attribute,
		edit_mode,
	};
	hydrate(data);
	open_popup(data);
	reflect_all_visible_formula_results();
}

function hydrate(data: edit_attribute_popup_data) {
	const attribute = data.attribute;
	const element = data.element;

	if (data.edit_mode) {
		element.classList.add("edit_mode");
	} else {
		element.classList.add("view_mode");
	}

	const name_heading = element.querySelector(".header h2.name") as HTMLHeadingElement;
	const name_input = element.querySelector(".header input.name") as HTMLInputElement;
	const id_input = element.querySelector(".header input.id") as HTMLInputElement;
	const edit_button = element.querySelector("button.edit") as HTMLButtonElement;
	const close_button = element.querySelector("button.close") as HTMLButtonElement;
	const description_div = element.querySelector("div.description") as HTMLDivElement;
	const description_textarea = element.querySelector("textarea.description") as HTMLTextAreaElement;

	name_heading.textContent = attribute.name;
	name_input.value = attribute.name;
	id_input.value = attribute.id;
	id_input.dataset.synced = String(attribute.id == text_to_id(attribute.name));
	description_div.textContent = attribute.description;
	description_textarea.value = attribute.description;
	auto_resize_element(description_textarea);

	name_input.addEventListener("input", on_attribute_name_input);
	id_input.addEventListener("input", on_attribute_id_input);
	id_input.addEventListener("blur", on_attribute_id_blur);
	edit_button.addEventListener("click", on_edit_click);
	close_button.addEventListener("click", close_active_popup);
	description_textarea.addEventListener("input", on_attribute_description_input);



	const counter_ul = element.querySelector(".counters ul")!;
	const counter_items = attribute.counters.map(counter => hydrate_counter(new_from_template("#edit_counter_item_template"), counter));
	counter_ul.replaceChildren(...counter_items);

	const property_ul = element.querySelector(".properties ul")!;
	const property_items = attribute.properties.map(property => hydrate_property(new_from_template("#edit_property_item_template"), property));
	property_ul.replaceChildren(...property_items);

	const modifier_ul = element.querySelector(".modifiers ul")!;
	const modifier_items = attribute.modifiers.map(modifier => hydrate_modifier(new_from_template("#edit_modifier_item_template"), modifier));
	modifier_ul.replaceChildren(...modifier_items);

	const add_counter_button = element.querySelector(".counters button.add")!;
	const add_property_button = element.querySelector(".properties button.add")!;
	const add_modifier_button = element.querySelector(".modifiers button.add")!;
	const add_subattribute_button = element.querySelector(".subattributes button.add")!;

	add_counter_button.addEventListener("click", add_new_counter);
	add_property_button.addEventListener("click", add_new_property);
	add_modifier_button.addEventListener("click", add_new_modifier);
}

function on_attribute_name_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	ui_state.active_popup.attribute.name = ev.currentTarget.value;
	const id_input = ev.currentTarget.nextElementSibling as HTMLInputElement;
	const id_value = text_to_id(ev.currentTarget.value);
	id_input.placeholder = id_value;
	if (id_input.dataset.synced == "true") {
		id_input.value = id_value;
		ui_state.active_popup.attribute.id = id_value;
		reflect_all_visible_formula_results();
	}
}

function on_attribute_id_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	ui_state.active_popup.attribute.id = text_to_id(ev.currentTarget.value) || text_to_id(ui_state.active_popup.attribute.name);
	reflect_all_visible_formula_results();
}

function on_attribute_id_blur(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	const id = text_to_id(ev.currentTarget.value);
	ev.currentTarget.value = id;
	ev.currentTarget.dataset.synced = String(id == "" || id == text_to_id(ui_state.active_popup.attribute.name));
}

function on_attribute_description_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLTextAreaElement)) throw Error("Event only works on textarea elements");
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	ui_state.active_popup.attribute.description = ev.currentTarget.value;
	const div = ev.currentTarget.parentElement!.querySelector("div.description")!;
	div.textContent = ui_state.active_popup.attribute.description;
	auto_resize_element(ev.currentTarget);
}

function on_edit_click(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLButtonElement)) throw Error("Event only works on Button elements");
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	const popup = ev.currentTarget.closest(".popup")!;
	ui_state.active_popup.edit_mode = !ui_state.active_popup.edit_mode;
	if (ui_state.active_popup.edit_mode) {
		popup.classList.add("edit_mode");
		popup.classList.remove("view_mode");
	} else {
		popup.classList.add("view_mode");
		popup.classList.remove("edit_mode");
	}
}

//////////////
// Counters //
//////////////

function add_new_counter() {
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	const counter: counter = reheat_counter({
		name: `Counter ${ui_state.active_popup.attribute.counters.length}`,
		id: `counter_${ui_state.active_popup.attribute.counters.length}`,
		value: 0,
		min: "0",
		max: "10",
	});
	ui_state.active_popup.attribute.counters.push(counter);
	if (counter.min.error || counter.max.error) throw Error("Failed to build counter default values");
	const context = get_evaluation_context();
	evaluate_formula(counter.min, context, true);
	evaluate_formula(counter.max, context, true);
	const ul = ui_state.active_popup.element.querySelector(".counters ul");
	if (!ul) throw Error("Cannot find counters ul. Is there no active_popup?");
	const item = hydrate_counter(new_from_template("#edit_counter_item_template"), counter);
	ul.appendChild(item);
	reflect_all_visible_formula_results(); // in case the auto-generated name is somehow already referenced
}

function hydrate_counter(element: Element, counter: counter): Element {
	const name_heading  = element.querySelector("h4.name") as HTMLHeadingElement;
	const value_input   = element.querySelector("input.value") as HTMLInputElement;
	const up_button     = element.querySelector("button.up") as HTMLButtonElement;
	const down_button   = element.querySelector("button.down") as HTMLButtonElement;
	const name_input    = element.querySelector("input.name") as HTMLInputElement;
	const id_input      = element.querySelector("input.id") as HTMLInputElement;
	const min_input     = element.querySelector(".min input") as HTMLInputElement;
	const max_input     = element.querySelector(".max input") as HTMLInputElement;
	const delete_button = element.querySelector("button.delete") as HTMLButtonElement;

	name_heading.textContent = counter.name;
	name_input.value = counter.name;
	id_input.value = counter.id;
	id_input.placeholder = text_to_id(counter.name);
	id_input.dataset.synced = String(counter.id == text_to_id(counter.name));
	min_input.value = counter.min.text;
	max_input.value = counter.max.text;
	value_input.value = String(counter.value);
	value_input.value = String(counter.value);


	value_input.addEventListener("input", on_counter_value_input);
	value_input.addEventListener("blur", on_counter_value_blur);
	up_button.addEventListener("click", on_counter_up_click);
	down_button.addEventListener("click", on_counter_down_click);
	name_input.addEventListener("input", on_counter_name_input);
	id_input.addEventListener("input", on_counter_id_input);
	id_input.addEventListener("blur", on_counter_id_blur);
	min_input.addEventListener("input", on_counter_min_input);
	min_input.addEventListener("blur", on_counter_min_blur);
	max_input.addEventListener("input", on_counter_max_input);
	max_input.addEventListener("blur", on_counter_max_blur);
	delete_button.addEventListener("click", on_counter_delete_click);

	return element;
}

function get_counter_from_element(element: Element): counter {
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	return ui_state.active_popup.attribute.counters[get_index_in_parent(element.closest("li")!)];
}

function on_counter_value_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	counter.value = Number(ev.currentTarget.value) || 0;
	reflect_all_visible_formula_results();
}

function on_counter_value_blur(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	ev.currentTarget.value = String(counter.value);
}

function on_counter_up_click(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLButtonElement)) throw Error("Event only works on button elements");
	const counter = get_counter_from_element(ev.currentTarget);
	counter.value += 1;
	const li = ev.currentTarget.closest("li")!;
	const value_input = li.querySelector("input.value") as HTMLInputElement;
	value_input.value = String(counter.value);
	reflect_all_visible_formula_results();
}

function on_counter_down_click(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLButtonElement)) throw Error("Event only works on button elements");
	const counter = get_counter_from_element(ev.currentTarget);
	counter.value -= 1;
	const li = ev.currentTarget.closest("li")!;
	const value_input = li.querySelector("input.value") as HTMLInputElement;
	value_input.value = String(counter.value);
	reflect_all_visible_formula_results();
}

function on_counter_name_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	counter.name = ev.currentTarget.value;

	const li = ev.currentTarget.closest("li")!;

	const name_heading = li.querySelector("h4.name") as HTMLHeadingElement;
	name_heading.textContent = counter.name;
	
	const id_input = li.querySelector("input.id") as HTMLInputElement;
	const id_value = text_to_id(ev.currentTarget.value);
	id_input.placeholder = id_value;
	if (id_input.dataset.synced == "true") {
		id_input.value = id_value;
		counter.id = id_value;
		reflect_all_visible_formula_results();
	}
}

function on_counter_id_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	counter.id = text_to_id(ev.currentTarget.value) || text_to_id(counter.name);
	reflect_all_visible_formula_results();
}

function on_counter_id_blur(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	const default_id = text_to_id(counter.name);
	const id = text_to_id(ev.currentTarget.value) || default_id;
	ev.currentTarget.value = id;
	ev.currentTarget.dataset.synced = String(id == default_id);
}

function on_counter_min_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	counter.min.text = ev.currentTarget.value;
	build_formula(counter.min, true);
	reflect_formula_box(ev.currentTarget, counter.min);
}

function on_counter_min_blur(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	if (typeof counter.min.result === "number" && counter.value < counter.min.result) {
		counter.value = counter.min.result
		reflect_all_visible_formula_results();
	}
}


function on_counter_max_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	counter.max.text = ev.currentTarget.value;
	build_formula(counter.max, true);
	reflect_formula_box(ev.currentTarget, counter.max);
}

function on_counter_max_blur(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const counter = get_counter_from_element(ev.currentTarget);
	
	if (typeof counter.max.result === "number" && counter.value > counter.max.result) {
		counter.value = counter.max.result
		reflect_all_visible_formula_results();
	}
}

function on_counter_delete_click(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLButtonElement)) throw Error("Event only works on button elements");
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	const li = ev.currentTarget.closest("li")!
	const index = get_index_in_parent(li);
	ui_state.active_popup.attribute.counters.splice(index, 1);
	li.remove();
	reflect_all_visible_formula_results();
}

////////////////
// Properties //
////////////////

function add_new_property() {
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	const property: property = reheat_property({
		name: `Property ${ui_state.active_popup.attribute.properties.length}`,
		id: `property_${ui_state.active_popup.attribute.properties.length}`,
	});
	ui_state.active_popup.attribute.properties.push(property);
	
	const ul = ui_state.active_popup.element.querySelector(".properties ul");
	if (!ul) throw Error("Cannot find properties ul. Is there no active_popup?");
	const item = hydrate_property(new_from_template("#edit_property_item_template"), property);
	ul.appendChild(item);
	reflect_all_visible_formula_results(); // in case the auto-generated name is somehow already referenced
}

function hydrate_property(element: Element, property: property): Element {
	const name_heading = element.querySelector("h4.name") as HTMLHeadingElement;
	const result_span = element.querySelector("span.result") as HTMLSpanElement;
	const name_input = element.querySelector("input.name") as HTMLInputElement;
	const id_input   = element.querySelector("input.id") as HTMLInputElement;
	const delete_button = element.querySelector("button.delete") as HTMLButtonElement;

	name_heading.textContent = property.name;
	result_span.textContent = "0"; // TODO: replace with true value
	name_input.value = property.name;
	id_input.value = property.id;
	id_input.placeholder = text_to_id(property.name);
	id_input.dataset.synced = String(property.id == text_to_id(property.name));

	name_input.addEventListener("input", on_property_name_input);
	id_input.addEventListener("input", on_property_id_input);
	id_input.addEventListener("blur", on_property_id_blur);
	delete_button.addEventListener("click", on_property_delete_click);

	return element;
}

function get_property_from_element(element: Element): property {
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	return ui_state.active_popup.attribute.properties[get_index_in_parent(element.closest("li")!)];
}

function on_property_name_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const property = get_property_from_element(ev.currentTarget);
	property.name = ev.currentTarget.value;

	const li = ev.currentTarget.closest("li")!;

	const name_heading = li.querySelector("h4.name") as HTMLHeadingElement;
	name_heading.textContent = property.name;

	const id_input = li.querySelector("input.id") as HTMLInputElement;
	const id_value = text_to_id(ev.currentTarget.value);
	id_input.placeholder = id_value;
	if (id_input.dataset.synced == "true") {
		id_input.value = id_value;
		property.id = id_value;
		reflect_all_visible_formula_results();
	}
}

function on_property_id_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const property = get_property_from_element(ev.currentTarget);
	property.id = text_to_id(ev.currentTarget.value) || text_to_id(property.name);
	reflect_all_visible_formula_results();
}

function on_property_id_blur(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const property = get_property_from_element(ev.currentTarget);
	const default_id = text_to_id(property.name);
	const id = text_to_id(ev.currentTarget.value) || default_id;
	ev.currentTarget.value = id;
	ev.currentTarget.dataset.synced = String(id == default_id);
}

function on_property_delete_click(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLButtonElement)) throw Error("Event only works on button elements");
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	const li = ev.currentTarget.closest("li")!
	const index = get_index_in_parent(li);
	ui_state.active_popup.attribute.properties.splice(index, 1);
	li.remove();
	reflect_all_visible_formula_results();
}

///////////////
// Modifiers //
///////////////

function add_new_modifier() {
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	const modifier = reheat_modifier({
		address: "",
		operation: modifier_operation.set,
		operand: "0",
		priority: 0,
	});
	ui_state.active_popup.attribute.modifiers.push(modifier);
	if (modifier.operand.error) throw Error("Failed to build modifier default values");

	const context = get_evaluation_context();
	evaluate_formula(modifier.operand, context);

	const ul = ui_state.active_popup.element.querySelector(".modifiers ul");
	if (!ul) throw Error("Cannot find modifiers ul. Is there no active_popup?");
	const item = hydrate_modifier(new_from_template("#edit_modifier_item_template"), modifier);
	ul.appendChild(item);
	// update_all_visible_properties(); // in case the auto-generated name is somehow already referenced (never true for modifiers)
}

function hydrate_modifier(element: Element, modifier: modifier): Element {
	const address_span    = element.querySelector("span.address") as HTMLSpanElement;
	const operation_span  = element.querySelector("span.operation") as HTMLSpanElement;
	const operand_span    = element.querySelector("span.operand") as HTMLSpanElement;
	const address_input   = element.querySelector("input.address") as HTMLInputElement;
	const operation_input = element.querySelector("select.operation") as HTMLSelectElement;
	const operand_input   = element.querySelector(".operand input") as HTMLInputElement;
	// const priority_input  = element.querySelector("input.priority") as HTMLInputElement;
	const delete_button   = element.querySelector("button.delete") as HTMLInputElement;

	address_span.textContent = modifier.address;
	operation_span.textContent = modifier_operation_map[modifier.operation];
	operand_span.textContent = modifier.operand.text;
	address_input.value = modifier.address;
	operation_input.selectedIndex = modifier.operation;
	operand_input.value = modifier.operand.text;

	address_input.addEventListener("input", on_modifier_address_input);
	address_input.addEventListener("blur", on_modifier_address_blur);
	operation_input.addEventListener("input", on_modifier_operation_input);
	operand_input.addEventListener("input", on_modifier_operand_input);
	delete_button.addEventListener("click", on_modifier_delete_click);

	return element;
}

function get_modifier_from_element(element: Element): modifier {
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	return ui_state.active_popup.attribute.modifiers[get_index_in_parent(element.closest("li")!)];
}

function on_modifier_address_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const modifier = get_modifier_from_element(ev.currentTarget);
	modifier.address = ev.currentTarget.value.trim();

	const li = ev.currentTarget.closest("li")!;
	const address_span = li.querySelector("span.address") as HTMLSpanElement;
	const [valid, reason] = validate_address(modifier.address);
	if (valid) {
		ev.currentTarget.classList.remove("invalid"); // RESEARCH: should we use built in clientside validation API?
		address_span.textContent = modifier.address;
	} else {
		ev.currentTarget.classList.add("invalid");
		ev.currentTarget.dataset.invalid_reason = reason;
		address_span.textContent = "\u{26A0}";
	}
	update_validity_tooltip(ev.currentTarget);
	reflect_all_visible_formula_results();
}

function on_modifier_address_blur(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const modifier = get_modifier_from_element(ev.currentTarget);
	ev.currentTarget.value = modifier.address;
}

function on_modifier_operation_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLSelectElement)) throw Error("Event only works on select elements");
	const modifier = get_modifier_from_element(ev.currentTarget);
	modifier.operation = Number(ev.currentTarget.value);
	modifier.priority = Number(ev.currentTarget.value) * 10;
	
	const li = ev.currentTarget.closest("li")!;
	const operation_span = li.querySelector("span.operation") as HTMLSpanElement;
	operation_span.textContent = modifier_operation_map[modifier.operation];
	reflect_all_visible_formula_results();
}

function on_modifier_operand_input(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLInputElement)) throw Error("Event only works on input elements");
	const modifier = get_modifier_from_element(ev.currentTarget);
	modifier.operand.text = ev.currentTarget.value;
	build_formula(modifier.operand, true);
	reflect_all_visible_formula_results();
	update_validity_tooltip(ev.currentTarget);
}

function on_modifier_delete_click(ev: Event) {
	if (!(ev.currentTarget instanceof HTMLButtonElement)) throw Error("Event only works on button elements");
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");
	const li = ev.currentTarget.closest("li")!
	const index = get_index_in_parent(li);
	ui_state.active_popup.attribute.modifiers.splice(index, 1);
	li.remove();
	reflect_all_visible_formula_results();
}

export function reflect_all_formula_results() {
	if (ui_state.active_popup?.type !== popup_type.edit_attribute) throw Error("active_popup is not edit_attribute");

	// TODO: update all inline formula results

	const counters = ui_state.active_popup.attribute.counters;
	const counters_ul = ui_state.active_popup.element.querySelector(".counters ul");
	if (!counters_ul) throw Error("Cannot find counters ul. Is there no active_popup?");
	for (let i = 0; i < counters.length; i++) {
		const counter = counters[i];
		const li = counters_ul.children[i];

		const value_input = li.querySelector("input.value") as HTMLInputElement;
		const min_input = li.querySelector(".min input") as HTMLInputElement;
		const max_input = li.querySelector(".max input") as HTMLInputElement;
		value_input.value = String(counter.value);
		reflect_formula_box(min_input, counter.min);
		reflect_formula_box(max_input, counter.max);
	}

	const properties = ui_state.active_popup.attribute.properties;
	const properties_ul = ui_state.active_popup.element.querySelector(".properties ul");
	if (!properties_ul) throw Error("Cannot find properties ul. Is there no active_popup?");
	for (let i = 0; i < properties.length; i++) {
		const property = properties[i];
		const li = properties_ul.children[i];
		const span = li.querySelector("span.result") as HTMLSpanElement;
		span.textContent = String(property.result);
	}

	const modifiers = ui_state.active_popup.attribute.modifiers;
	const modifiers_ul = ui_state.active_popup.element.querySelector(".modifiers ul");
	if (!modifiers_ul) throw Error("Cannot find modifiers ul. Is there no active_popup?");
	for (let i = 0; i < modifiers.length; i++) {
		const modifier = modifiers[i];
		const li = modifiers_ul.children[i];
		const operand_span = li.querySelector("span.operand") as HTMLSpanElement;
		const operand_input = li.querySelector(".operand input") as HTMLInputElement;

		if (modifier.operand.result === undefined) {
			operand_span.textContent = "\u{26A0}";
		} else {
			operand_span.textContent = String(modifier.operand.result);
		}
		reflect_formula_box(operand_input, modifier.operand);
	}
}
