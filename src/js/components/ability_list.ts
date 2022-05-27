import { character } from "../character";
import { ability_mod_from_score, pretty_plus_minus } from "../utils";

type MembersOfType<T, U> = {
	[K in keyof T]: T[K] extends U ? K : never
}[keyof T];

export function hydrate_abilities() {
	for (const el of document.querySelector("#abilities")!.children) {
		const input = el.querySelector("input")!;
		input.addEventListener("input", ability_field_changed_handler);
	}

	update_abilities();
}

function ability_field_changed_handler(event: Event) {
	const el = (event.target as HTMLInputElement)
	const container = el.closest("div")!;
	const ability = container.dataset.ability;
	const value = Number(el.value)
	character.abilities[ability as MembersOfType<typeof character.abilities, number>] = value
	const mod = container.querySelector(".ability_mod")!;
	mod.textContent = pretty_plus_minus(ability_mod_from_score(value));
}

export function update_abilities() {
	const abilities: NodeListOf<HTMLDivElement> = document.querySelectorAll("#abilities>div");
	for (const container of abilities) {
		const ability = container.dataset.ability as keyof typeof character.abilities;
		const score_input = container.querySelector("input")!;
		const mod_el = container.querySelector(".ability_mod")!;
		const score = character.abilities[ability as MembersOfType<typeof character.abilities, number>]
		score_input.value = String(score);
		mod_el.textContent = pretty_plus_minus(ability_mod_from_score(score));
	}
}
