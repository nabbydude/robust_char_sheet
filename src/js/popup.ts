import { edit_attribute_popup_data } from "./popups/edit_attribute";
import { ui_state } from "./state";

export enum popup_type {
	none,
	edit_attribute,
}

export interface popup_data_base {
	type: popup_type,
	element: Element,
}

export type popup_data = edit_attribute_popup_data;

export function open_popup(data: popup_data) {
	ui_state.active_popup = data;
	const container = document.querySelector("#popup_container") as HTMLElement;
	container.style.display = "grid";
	container.appendChild(data.element);
}

export function close_active_popup() {
	if (!ui_state.active_popup) {
		console.warn("close_active_popup called with no active popup, skipping");
		return;
	}
	const container = document.querySelector("#popup_container") as HTMLElement;
	container.style.display = "none";
	ui_state.active_popup.element.remove();
	ui_state.active_popup = undefined;
}
