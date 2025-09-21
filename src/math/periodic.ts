/** 
 * For every `value` that generated from ±`period` repetitively,
 * Pick those inside range `[min, max)`.
 */
export function pickPeriodicValuesInRange(value: number, period: number, min: number, max: number): number[] {
	let vs: number[] = []
	let v = Math.ceil((min - value) / period) * period + value

	while (v < max) {
		vs.push(v)
		v += period
	}

	return vs
}


/** 
 * For one `value` that generated from ±`period` repetitively,
 * Pick one inside range `[min, max)`,
 * if not in range, pick the closest edge value.
 */
export function pickClosestPeriodicValueInRange(value: number, period: number, min: number, max: number): number {
	let v = Math.ceil((min - value) / period) * period + value

	if (v < max) {
		return v
	}

	if (v - max < min - (v - period)) {
		return max
	}
	else {
		return min
	}
}