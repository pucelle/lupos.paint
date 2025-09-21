import {Point, Vector} from '@pucelle/ff'
import {Matrix2} from '../../../../math'



/** The intermediate result when analyzing ellipsis. */
export interface EllipseParameter{
	center: Point

	/** Betweens -2π ~ 2π. */
	startAngle: number

	/** Betweens -2π ~ 2π. */
	endAngle: number
}


// Unknown parameter cx, cy, θ1, θ2.
// Known parameter x1, y1, x2, y2, rx, ry, ψ.
// cx, cy is the center of ellipse.
// ψ is x axis rotated angle in clockwise (anti-clockwise in Math Coordinate System).

// (cx, i*cy) + (rx * cosθ1, ry * i * sinθ1) * (cosψ, i * sinψ) = (x1, y1)	... 1
// (cx, i*cy) + (rx * cosθ2, ry * i * sinθ2) * (cosψ, i * sinψ) = (x2, y2)	... 2

// 1 minus 2:
// rx * cosθ1 * cosψ - ry * sinθ1 * sinψ - (rx * cosθ2 * cosψ - ry * sinθ2 * sinψ) = x1 - x2
// rx * cosθ1 * sinψ + ry * sinθ1 * cosψ - (rx * cosθ2 * sinψ + ry * sinθ2 * cosψ) = y1 - y2

// [rx * cosψ, -ry * sinψ] * [cosθ1 - cosθ2] = [x1 - x2]
// [rx * sinψ,  ry * cosψ]   [sinθ1 - sinθ2]   [y1 - y2]

// [cosθ1 - cosθ2] = [rx * cosψ, -ry * sinψ]^-1 * [x1 - x2] = [dx]
// [sinθ1 - sinθ2]   [rx * sinψ,  ry * cosψ]      [y1 - y2] = [dy]

// Set θ1 = A + B, θ2 = A - B, then A = (θ1 + θ2) / 2, B = (θ1 - θ2) / 2:

// cos(A+B) - cos(A-B) = dx
//  => 2sinAsinB = -dx				... 3

// sin(A+B) - sin(A-B) = dy
//  => 2sinBcosA = dy				... 4

// 3^2 + 4^2 got:
// 4(sinB)^2 = dx^2 + dy^2
// sinB = (dx^2 + dy^2)^0.5 / 2 	... 5

// According to 5, B has 4 options.
// If `clockwiseFlag` is `true` (anti-clockwise in standard Eular coordinate system), θ2 > θ1, B < 0, 2 options left.
// If `largeArcFlag` is `true`, |θ2 - θ1| > π, |B| > π/2

// from 3 and 4 got:
// tanA = atan2(-dx * Flag(sinB), dy * Flag(sinB)) 		... 6

export function calcPathEllipseParameter(
	start: Point,
	end: Point,
	radius: Vector,
	xAxisAngle: number,
	largeArcFlag: number,
	clockwiseFlag: number,
): EllipseParameter
{
	let cosFi = Math.cos(xAxisAngle)
	let sinFi = Math.sin(xAxisAngle)

	let m = new Matrix2(
		 radius.x * cosFi,
		-radius.y * sinFi,
		 radius.x * sinFi,
		 radius.y * cosFi
	).inverseSelf()

	let {x: dx, y: dy} = m.transferVector(new Vector(start.x - end.x, start.y - end.y))
	let mathClockWiseFlag = clockwiseFlag ? -1 : 1

	let sinB = Math.sqrt(dx * dx + dy * dy) / 2 * mathClockWiseFlag

	// Required, or `Math.asin` will got NaN.
	sinB = Math.min(Math.max(sinB, -1), 1)

	let b = Math.asin(sinB)

	// Reflect from right to left,
	// ensure can always interpolate betweens two radians angle.
	if (largeArcFlag) {
		b = Math.PI * mathClockWiseFlag - b
	}

	let a = Math.atan2(-dx * mathClockWiseFlag, dy * mathClockWiseFlag)
	let startAngle = a + b	// θ1
	let endAngle = a - b	// θ2

	let cosSita1 = Math.cos(startAngle)
	let sinSita1 = Math.sin(startAngle)
	let cx = start.x - radius.x * cosSita1 * cosFi + radius.y * sinSita1 * sinFi
	let cy = start.y - radius.x * cosSita1 * sinFi - radius.y * sinSita1 * cosFi

	return {
		center: new Point(cx, cy),
		startAngle,
		endAngle,
	}
}