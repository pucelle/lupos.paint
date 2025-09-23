import {TransformData} from 'geometry'
import {degreeToRadians, getFlag, mayValue, mayZero, nonZeroFlag, radiansToDegree} from '../../math'
import {Matrix} from './matrix'
import {Matrix2} from '../../math/matrix2'
import {Point} from './point'
import {Vector} from './vector'


/** 
 * Privide some tool functions to handle transform,
 * including transform data input & output,
 * Matrix property calculation.
 */
export namespace TransformUtils {

	/** 
	 * Make a 2d matrix from transform data properties.
	 * Computing order is `Scaling -> Rotation -> SkewingY -> Translate`.
	 */
	export function makeMatrixFromData(data: TransformData): Matrix {

		// Based on top-left coordinate system.
		let {origin: anchorPoint, position, scale, rotation, skewAxis, skew} = data
		let m = Matrix.i()

		// Changes coordinate system to current object based.
		if (anchorPoint) {
			m.translateSelf(-anchorPoint[0], -anchorPoint[1])
		}

		// Scaling.
		if (scale) {
			m.scaleSelf(...scale)
		}

		// Rotation.
		if (rotation) {
			m.rotateSelf(degreeToRadians(rotation))
		}

		// Skew based on an axis.
		if (skew && skewAxis) {
			let axisRadians = degreeToRadians(skewAxis)
			m.rotateSelf(axisRadians)
			m.skewSelf(0, degreeToRadians(skew))
			m.rotateSelf(-axisRadians)
		}

		// Restore to world coordinate system.
		if (position) {
			m.translateSelf(...position)
		}

		return m
	}


	/** 
	 * Try to restore transform data from a matrix.
	 * Assume moving one element from a container, or moved to a new container,
	 * We need to add the relative transform matrix to it's transform data to keep it's position,
	 * Such that we must restore it's transform data from a matrix.
	 */
	export function restoreDataFromMatrix(matrix: Matrix, origin: [number, number] | undefined): TransformData {

		// O * Translate(e, f) * SkewY(s) * Rotate(θ) * Scale(x, y) * O^-1 * C = M * C
		// Translate(e, f) * SkewY(s) * Rotate(θ) * Scale(x, y) = O^-1 * M * O
		// [a c e] = Translate(e, f) * SkewY(s) * Rotate(θ) * Scale(x, y)
		// [b d f]
		// =>
		//   [a c] = SkewY(s) * Rotate(θ) * Scale(x, y)
		//   [b d]
		// =>
		//   [1 0][cosθ -sinθ][sx  0] = [a c]
		//   [s 1][sinθ  cosθ][ 0 sy] = [b d]
		// =>
		//   xcosθ = a 			...1
		//  -ysinθ = c			...2
		//   as + xsinθ = b		...3
		//  -cs + ysinθ = d		...4
		// =>
		//   3^2 + 4^2 - 1^2 - 2^2:
		// =>
		// (a^2 + c^2)s^2 + 2(cd - ab)s + (b^2 + d^2 - a^2 - c^2) = 0
		// Got s (choose the one have smaller absolute value), can quickly determine s = 0 if b^2 + d^2 - a^2 - c^2 = 0
		//
		// Substitute s into 3 and 1:
		// => 
		//   tanθ = atan(b - as, a) or atan(-(b - as), -a)
		//	Choose the better one and try to make both x & y are positive, otherwise try to make cosθ is positive.

		// If totally ignore skew, can restore as Translate(e, f) * Rotate(θ) * Scale(x, y),
		// Currently the Scale(x, y) can be represent by 2 matrix eigenvalue. 
		// And the skewing euqlas an un-balanced scaling, which is different in different directions.

		let m = matrix.clone()

		if (origin) {
			m.multiplySelf(Matrix.i().translateSelf(origin[0], origin[1]))
			m.translateSelf(-origin[0], -origin[1])
		}

		let {a, b, c, d, e, f} = m
		let s: number

		// (a^2 + c^2)s^2 + 2(cd - ab)s + (b^2 + d^2 - a^2 - c^2) = 0
		let A = a * a + c * c

		if (A === 0) {
			return {
				origin: origin || [0, 0],
				position: [e, f],
			}
		}

		let C = mayZero(b * b + d * d - A)

		if (C === 0) {
			s = 0
		}
		else {
			let B = -2 * (c * d - a * b)
			let L = B / A * 0.5
			let R = Math.sqrt(B * B - 4 * A * C) / A * 0.5
			s = L - getFlag(L) * R	
		}

		let g = b - a * s
		let h = d + c * s

		// Prefer cosθ > 0, except it will cause both x and y < 0.
		// xcosθ = a
		// ycosθ = d + cs

		let sita: number
		let flagA = nonZeroFlag(mayZero(a))
		let flagDpcs = nonZeroFlag(mayZero(h))
		let flagCosSita = 1

		if (flagA === -1 && flagDpcs === -1) {
			sita = Math.atan2(-g, -a)
			flagCosSita = -1
		}
		else {
			sita = Math.atan2(g, a)
		}

		let sx = Math.sqrt(a * a + Math.pow(g, 2)) * flagA * flagCosSita
		let sy = Math.sqrt(c * c + Math.pow(h, 2)) * flagDpcs * flagCosSita

		let restoredData: TransformData = {}

		if (origin) {
			restoredData.origin = origin
		}

		e = mayZero(e)
		f = mayZero(f)

		if (e !== 0 || f !== 0) {
			restoredData.position = [e, f]
		}

		sx = mayValue(sx, 1)
		sy = mayValue(sy, 1)

		if (sx !== 1 || sy !== 1) {
			restoredData.scale = [sx, sy]
		}

		sita = mayZero(sita)

		if (sita !== 0) {
			restoredData.rotation = radiansToDegree(sita)
		}

		s = mayZero(s)
		
		if (s !== 0) {
			restoredData.skew = radiansToDegree(Math.atan(sita))
		}

		return restoredData
	}

	
	/** 
	 * Make a transform matrix which can be used to transform from two start points, to two final points.
	 * Ignore skew transform.
	 * Used for pinch event.
	 */
	export function makeNonSkewMatrixFromPoints(fromPoints: [Point, Point], toPoints: [Point, Point]): Matrix {

		// Let it transform from C1 and C2, to C3 and C4:

		// M = Translate(x, y) * Rotate(θ) * Scale(s)
		// M * [C1, C2] = [C3, C4]

		// [a c e] = Translate(e, f) * Rotate(θ) * Scale(s)
		// [b d f]
		// =>
		//   [a c] = Rotate(θ) * Scale(s)
		//   [b d]
		// =>
		//   [cosθ -sinθ][s 0] = [a c]
		//   [sinθ  cosθ][0 s] = [b d]
		// =>
		//   c = -b
		//   d = a

		// [a -b e] * [c1x] = [c3x]
		// [b  a f]   [c1y]   [c3y]
		// =>
		//    a*c1x - b*c1y + e = c3x		...1
		//    b*c1x + a*c1y + f = c3y		...2
		//    a*c2x - b*c2y + e = c4x		...3
		//    b*c2x + a*c2y + f = c4y		...4
		//
		// 1 - 3, 2 - 4 =>
		//    a(c1x - c2x) - b(c1y - c2y) = c3x - c4x
		//    b(c1x - c2x) + a(c1y - c2y) = c3y - c4y
		// =>
		//    [c1x-c2x  -(c1y-c2y)] * [a] = [c3x - c4x]
		//    [c1y-c2y    c1x-c2x ]   [b]   [c3y - c4y]

		//    [a] = [c1x-c2x  -(c1y-c2y)]^-1 * [c3x - c4x]
		//    [b]   [c1y-c2y    c1x-c2x ]      [c3y - c4y]

		//    e = c3x - a*c1x + b*c1y
		//    f = c3y - b*c1x - a*c1y

		// To understand intuitively, 
		// Scaling rate equals vector length ratio,
		// Rotation angle equals vector rotation angle.

		let c1 = fromPoints[0]
		let c2 = fromPoints[1]
		let c3 = toPoints[0]
		let c4 = toPoints[1]

		let m = new Matrix2(
			c1.x - c2.x,
			-(c1.y - c2.y),
			c1.y - c2.y,
			c1.x - c2.x
		)
		
		let v = new Vector(
			c3.x - c4.x,
			c3.y - c4.y
		)
		
		let {x: a, y: b} = m.inverseSelf().transferVector(v)

		// If matrix is't full rank, reset scaling part to 1.
		if (a === 0) {
			a = 1
		}

		let c = -b
		let d = a
		let e = c3.x - a * c1.x + b * c1.y
		let f = c3.y - b * c1.x - a * c1.y

		return new Matrix(a, b, c, d, e, f)
	}
		

	/** 
	 * Make a transform matrix which can be used to transform from two start points, to two final points.
	 * Ignore rotation transform.
	 * Used for pinch event.
	 */
	export function makeNonRotationMatrixFromPoints(fromPoints: [Point, Point], toPoints: [Point, Point]): Matrix {

		// Let it transform from C1 and C2, to C3 and C4:

		// M = Translate(x, y) * Scaling(s)
		// s = Vector(C3, C4) / Vector(C1, C2)

		// [a 0 e] = Translate(e, f) * Scaling(s)
		// [0 a f]
		// => a = s

		// Let C5, C6 is the center of the two segments:
		// M * C5 = C6
		// =>
		//    [a 0 e] * [c5x] = [c6x]
		//    [0 a f]   [c5y]   [c6y]
		// =>
		//    a*c5x + e = c6x
		//    a*c5y + f = c6y
		// =>
		//    e = c6x - a*c5x
		//    f = c6y - a*c5y

		let c1 = fromPoints[0]
		let c2 = fromPoints[1]
		let c3 = toPoints[0]
		let c4 = toPoints[1]
		let c5 = c1.mix(c2, 0.5)
		let c6 = c3.mix(c4, 0.5)
		let v1 = c2.diff(c1)
		let v2 = c4.diff(c3)
		let a = v2.getLength() / v1.getLength()
		let b = 0
		let c = 0
		let d = a
		let e = c6.x - a * c5.x
		let f = c6.y - a * c5.y

		return new Matrix(a, b, c, d, e, f)
	}
}