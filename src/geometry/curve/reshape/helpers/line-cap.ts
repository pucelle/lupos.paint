import {RadialLine, Vector} from '@pucelle/ff'
import {CubicBezierCurve} from '../../curves'


/** Calculate the curve for rounded line join. */
export function calcRoundLineCapBezierCurves(radial1: RadialLine, radial2: RadialLine): [CubicBezierCurve, CubicBezierCurve] {
	let radius = Vector.fromDiff(radial1.point, radial2.point).getLength() / 2
	let vector = radial1.vector.add(radial2.vector).normalizeSelf().multiplyScalarSelf(radius)
	let centerP = radial1.point.mix(radial2.point, 0.5).addSelf(vector)
	let centerV = vector.rotateSelf(Math.PI / 2)
	let centerRadial = new RadialLine(centerP, centerV)
	let q1 = radial1.intersect(centerRadial)!.point
	let q2 = radial2.intersect(centerRadial)!.point

	// Nearly equals arc.
	let control1L = radial1.point.mix(q1, 0.552)
	let control1R = centerP.mix(q1, 0.552)
	let control2L = centerP.mix(q2, 0.552)
	let control2R = radial2.point.mix(q2, 0.552)

	return [
		new CubicBezierCurve(radial1.point, centerP, control1L, control1R),
		new CubicBezierCurve(centerP, radial2.point, control2L, control2R),
	]
}