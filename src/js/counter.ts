import { formula } from "./formula";
import { ided_stat_node_base, stat_node_type, update_dependants } from "./stat_node";

export interface counter extends ided_stat_node_base {
	node_type: stat_node_type.counter;
	name: string,
	value: number,
	min: formula,
	max: formula,
};

export function update_counter(counter: counter, notify_dependants: boolean = true) {
	if (
		counter.min.result !== undefined &&
		counter.max.result !== undefined &&
		counter.min.result > counter.max.result
	) {
		counter.error = Error("Counter minimum value cannot be greater than its maximum value");
	} else if (counter.min.result !== undefined && counter.value > counter.min.result) {
		counter.value = counter.min.result;
		if (notify_dependants) update_dependants(counter);
	} else if (counter.max.result !== undefined && counter.value > counter.max.result) {
		counter.value = counter.max.result;
		if (notify_dependants) update_dependants(counter);
	}

}
