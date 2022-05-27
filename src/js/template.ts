
const template_cache = new Map<string, HTMLTemplateElement>();

export function get_template(selector: string): HTMLTemplateElement {
	const cached = template_cache.get(selector);
	if (cached) return cached;
	const gotten = document.querySelector(selector) as HTMLTemplateElement;
	template_cache.set(selector, gotten);
	return gotten;
}

export function new_from_template(selector: string): Element {
	return get_template(selector).content.firstElementChild!.cloneNode(true) as Element;
}
