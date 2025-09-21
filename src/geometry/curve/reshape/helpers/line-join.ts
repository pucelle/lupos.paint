import {Point, RadialLine, Vector} from '@pucelle/ff'


/** Calculate the arc radius for rounded line join. */
export function calcRoundLineJoinRadius(radial1: RadialLine, radial2: RadialLine): number {

	// Get two vector intersection angle.
	// Already know vector is normalized.
	let sitaHalf = Math.acos(radial1.vector.dot(radial2.vector)) / 2
	let pointDiffLengthHalf = Vector.fromDiff(radial1.point, radial2.point).getLength() / 2
	let radius = pointDiffLengthHalf / Math.cos(sitaHalf)

	return radius
}

/** Calculate the miter bevel points for miter line join. */
export function calcMiterLineJoinBevelPoints(radial1: RadialLine, radial2: RadialLine, miterLimit: number): [Point, Point] | null {

	// Get two vector intersection angle.
	// Already know vector is normalized.
	let sitaHalf = Math.acos(radial1.vector.dot(radial2.vector)) / 2

	// MiterLength = W (stroke width) * miterLimit
	// PointDiffLength = W / cos(θ/2)

	// CurrentMiterRate = PointDiffLength / 2 * cot(θ/2) / W
	//                  = cos(θ/2) / 2 * cot(θ/2)
	//                  = 1 / 2sin(θ/2)

	// BevelVectorLength = W * miterLimit / cos(θ/2)
	//                   = PointDiffLength * cos(θ/2) * miterLimit / cos(θ/2)
	//                   = PointDiffLength * miterLimit

	let miterRate = 1 / (2 * Math.sin(sitaHalf))

	// Limit exceed.
	if (miterRate > miterLimit) {
		let bevelVectorLength = Vector.fromDiff(radial1.point, radial2.point).getLength() * miterLimit

		return [
			radial1.point.add(radial1.vector.multiplyScalar(bevelVectorLength)),
			radial2.point.add(radial2.vector.multiplyScalar(bevelVectorLength)),
		]
	}
	else {
		return null
	}
}