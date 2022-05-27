
export function update_validity_tooltip(element: Element) {
	const closest_invalid = element.closest(".invalid");
	if (closest_invalid && (closest_invalid instanceof HTMLElement)) {
		show_tooltip_on(
			closest_invalid,
			closest_invalid.dataset.invalid_reason || "Invalid for some reason...",
			{ danger: true },
		);
	} else {
		hide_tooltip();
	}
}

export function tooltip_mouseleave_handler(ev: MouseEvent) {
	hide_tooltip();
}

interface show_tooltip_options { danger: boolean; }
export function show_tooltip_on(element: Element, message: string, { danger }: show_tooltip_options) {
	const rects = element.getClientRects();
	const hovered_rect = rects[0];
	if (!hovered_rect) return;
	const tooltip = document.querySelector("div#tooltip") as HTMLDivElement;
	tooltip.style.display = "block";
	tooltip.style.maxWidth = `calc(${hovered_rect.width}px + 2rem)`;
	tooltip.textContent = message;
	if (danger) {
		tooltip.classList.add("danger");
	} else {
		tooltip.classList.remove("danger");
	}
	const tooltip_rect = tooltip.getBoundingClientRect();
	
	tooltip.style.left = `${hovered_rect.left + hovered_rect.width / 2 - tooltip_rect.width / 2}px`;
	tooltip.style.top = `calc(${hovered_rect.top - tooltip_rect.height}px - 0.5rem)`;
}

export function hide_tooltip() {
	const tooltip = document.querySelector("div#tooltip") as HTMLDivElement;
	tooltip.style.display = "none";

}
