import {NumberUtils} from '@pucelle/ff'


/** 
 * Solve One Variable Quadratic Equation like `ax^2 + bx + c = 0`.
 * Resulted values will be sorted from lower to upper.
 */
export function solveOneVariableQuadraticEquation(a: number, b: number, c: number): [number, number] | null {
	if (a === 0) {
		return null
	}

	let delta = Math.sqrt(b * b - 4 * a * c)
	if (isNaN(delta)) {
		return null
	}

	delta *= NumberUtils.flag(a)

	return [
		(-b - delta) / (2 * a),
		(-b + delta) / (2 * a),
	]
}