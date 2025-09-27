import {Point, RadialLine, Vector} from '@pucelle/ff'
import {CubicBezierCurve} from '../../curves'


/** Calculate the curve for rounded line join. */
export function calcRoundLineJoinBezierCurve(radial1: RadialLine, radial2: RadialLine): CubicBezierCurve {
	let q = radial1.intersect(radial2)!.point

	// Nearly equals arc.
	let control1 = radial1.point.mix(q, 0.552)
	let control2 = radial2.point.mix(q, 0.552)

	return new CubicBezierCurve(radial1.point, radial2.point, control1, control2)
}



/** Calculate the miter bevel points for miter line join. */
export function calcMiterLineJoinBevelPoints(radial1: RadialLine, radial2: RadialLine, miterLimit: number): [Point, Point] | null {

	// Get two vector intersection angle.
	// Already know vector is normalized.
	let dotValue = radial1.vector.dot(radial2.vector)
	let sitaHalf = Math.acos(dotValue) / 2
	let strokeWidth = Vector.fromDiff(radial1.point, radial2.point).getLength() / Math.cos(sitaHalf)

	// MiterLength = W (stroke width) * MiterLimit
	// PointDiffLength = W / cos(θ/2)

	// CurrentMiterRate = PointDiffLength / 2 * cot(θ/2) / W
	//                  = cos(θ/2) / 2 * cot(θ/2)
	//                  = 1 / 2sin(θ/2)

	// BevelVectorLength = W * MiterLimit / cos(θ/2)
	//                   = PointDiffLength * cos(θ/2) * MiterLimit / cos(θ/2)
	//                   = PointDiffLength * MiterLimit

	let miterRate = Math.atan(sitaHalf) / 2

	// Limit exceed.
	if (miterRate > miterLimit) {
		let bevelLength = strokeWidth * miterLimit

		return [
			radial1.point.add(radial1.vector.multiplyScalar(bevelLength)),
			radial2.point.add(radial2.vector.multiplyScalar(bevelLength)),
		]
	}
	else {
		return null
	}
}