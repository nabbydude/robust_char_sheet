import jsep from "jsep";
import { evaluate_ast } from "./evaluate_ast";
import { link_dependee_side, stat_node, stat_node_base, stat_node_type, unlink_dependee_side, update_dependants } from "./stat_node";
import { get_ast_dependencies } from "./ast";
import { diff_arrays } from "./utils";

export interface formula_base extends stat_node_base {
	node_type: stat_node_type.formula,
	text: string,
	ast?: jsep.Expression,
	result?: number,
	error?: Error,
};

export type built_formula = formula_base & {
	ast: jsep.Expression,
};

export type formula_with_build_error = formula_base & {
	ast: undefined,
	result: undefined,
	error: Error,
};

export type evaluated_formula = built_formula & {
	ast: jsep.Expression,
	error: undefined,
};

export type formula_with_evaluation_error = built_formula & {
	ast: jsep.Expression,
	result: undefined,
	error: Error,
};

export type errored_formula = formula_with_build_error | formula_with_evaluation_error;
export type formula = built_formula | evaluated_formula | errored_formula;

export function new_formula_from_text(text: string, parent?: stat_node): formula {
	const out = { text, parent } as formula;
	build_formula(out, true);
	if (!out.error)	link_formula(out);
	return out;
}

export function build_formula(formula: formula, force = false): asserts formula is built_formula | formula_with_build_error {
	if (!force && formula.ast) return;
	formula.error = undefined;
	formula.ast = undefined;
	try {
		formula.ast = jsep(formula.text);
	} catch(e: unknown) {
		if (!(e instanceof Error)) throw e;
		formula.error = e;
	}
}

/**
 * @returns { stat_node[] } any old dependencies that were removed. (They should be updated)
 */
export function link_formula(formula: built_formula): stat_node[] {
	const dependencies = get_ast_dependencies(formula.ast);
	const [old, novel] = diff_arrays(formula.dependencies, dependencies);

	for (const node of old) unlink_dependee_side(formula, node);
	for (const node of novel) link_dependee_side(formula, node);

	formula.dependencies = dependencies;

	return old;
}

export function evaluate_formula(formula: built_formula): asserts formula is evaluated_formula | formula_with_evaluation_error {
	formula.result = undefined;
	formula.error = undefined;

	try {
		const result = evaluate_ast(formula.ast);
		if (typeof result === "number") formula.result = result;
	} catch(e: unknown) {
		if (!(e instanceof Error)) throw e;
		(formula as formula_with_evaluation_error).error = e;
	}
}

export function update_formula(formula: formula, notify_dependants: boolean = true) {
	if (!formula.ast) return;
	evaluate_formula(formula);
	if (notify_dependants) update_dependants(formula);
}
