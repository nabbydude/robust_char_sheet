export function get_index_in_parent(element: Element) {
	return Array.prototype.indexOf.call(element.parentElement!.children, element);
}

export function text_to_id(text: string): string {
	return text
		.toLowerCase()
		.replace(/'/g, "")
		.replace(/[^a-z0-9_]+/g, "_")
		.replace(/__+/g, "_")
		.replace(/^_|_$/g, "");
}

export function ability_mod_from_score(score: number): number {
	return Math.floor(score / 2) - 5;
}

export function pretty_plus_minus(val: number): string {
	if (val > 0) return `+${val}`;
	if (val < 0) return `\u2212${Math.abs(val)}`;
	return "0";
}

export function pretty_minus(val: number): string {
	if (val < 0) return `\u2212${Math.abs(val)}`;
	return `${val}`;
}

export function auto_resize_element(el: HTMLElement) {
	el.style.height = "auto";
	el.style.padding = "0";
	el.style.boxSizing = "content-box";
	el.style.height = `${el.scrollHeight}px`;
	el.style.removeProperty("padding");
	el.style.removeProperty("box-sizing");
}

export function diff_arrays<T>(a: T[], b: T[]): [a_only: T[], b_only: T[]] {
	const a_only: T[] = [];
	const b_only: T[] = [];
	for (const v of a) if (!b.includes(v)) a_only.push(v);
	for (const v of b) if (!a.includes(v)) b_only.push(v);
	return [a_only, b_only];
}
