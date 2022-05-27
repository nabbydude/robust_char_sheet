import { formula } from "../formula";

export function reflect_formula_box(el: HTMLInputElement, formula: formula) {
	if (!formula.error && formula.result === undefined) {
		throw Error(`Formula with text "${formula.text}" has no cache`);
	}
	const formula_label = el.closest("label.formula") as HTMLLabelElement;
	const result_span = formula_label.querySelector("span.result") as HTMLLabelElement;
	if (formula.error) {
		result_span.textContent = `=\u{26A0}`;
		formula_label.classList.add("invalid");
		formula_label.dataset.invalid_reason = formula.error.message;
	} else {
		let displayed_result = String(formula.result);
		if (formula.result === undefined) displayed_result = "?";
		result_span.textContent = `=${displayed_result}`;
		formula_label.classList.remove("invalid");
	}
}
