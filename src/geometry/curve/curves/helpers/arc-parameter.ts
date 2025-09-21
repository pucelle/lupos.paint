import {Point} from '@pucelle/ff'


/** The intermediate result when analyzing arc. */
export interface ArcParameter{

	/** Center coordinate. */
	center: Readonly<Point>

	/** Betweens -2π ~ 2π. */
	startAngle: number

	/** Betweens -2π ~ 2π. */
	endAngle: number
}


/** Same with ellipse, but more simple. */
export function calcPathArcParameter(
	start: Point,
	end: Point,
	radius: number,
	largeArcFlag: number,
	clockwiseFlag: number
): ArcParameter
{
	let dx = (start.x - end.x) / radius
	let dy = (start.y - end.y) / radius
	let mathClockWiseFlag = clockwiseFlag ? -1 : 1

	let sinB = Math.sqrt(dx * dx + dy * dy) / 2 * mathClockWiseFlag

	// Required, or `Math.asin` may got `NaN`.
	sinB = Math.min(Math.max(sinB, -1), 1)

	// -π/2 ~ π/2
	let b = Math.asin(sinB)

	// Reflect from right to left,
	// ensure can always interpolate betweens two radians angle.
	// -π/2 ~ 3π/2
	if (largeArcFlag) {
		b = Math.PI * mathClockWiseFlag - b
	}

	// -π/2 ~ π/2
	let a = Math.atan2(-dx * mathClockWiseFlag, dy * mathClockWiseFlag)
	let startAngle = a + b	// θ1
	let endAngle = a - b		// θ2

	let cosSita1 = Math.cos(startAngle)
	let sinSita1 = Math.sin(startAngle)
	let cx = start.x - radius * cosSita1
	let cy = start.y - radius * sinSita1

	return {
		center: new Point(cx, cy),
		startAngle,
		endAngle,
	}
}
