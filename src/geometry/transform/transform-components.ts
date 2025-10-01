import {Matrix2} from '../../math'
import {TransformComponentData} from './types'
import {MathUtils, Matrix, Point} from '@pucelle/ff'


/** 
 * Provides simpler way of manipulation transform by applying each transform
 * properties independently.
 */
export namespace TransformComponents {

	/** Make a 2d matrix from transform component properties. */
	export function toMatrix(data: TransformComponentData): Matrix {

		// Based on top-left coordinate system.
		let {origin, translate, scale, rotate, skewAxis, skew} = data
		let m = Matrix.i()

		// Changes coordinate system to origin based.
		if (origin) {
			m.translateSelf(-origin[0], -origin[1])
		}

		// Skew based on an axis.
		if (skew) {
			if (skewAxis) {
				m.rotateInDegreeSelf(skewAxis)
			}

			m.skewInDegreeSelf(0, skew)

			if (skewAxis) {
				m.rotateInDegreeSelf(-skewAxis)
			}
		}

		// Scaling.
		if (scale) {
			m.scaleSelf(...scale)
		}

		// Rotation.
		if (rotate) {
			m.rotateInDegreeSelf(rotate)
		}

		// Apply translate.
		if (translate) {
			m.translateSelf(...translate)
		}

		// Restore from origin to world coordinate system.
		// Note the difference with After Effects:
		// After Effects `anchorPoint` has no need to be restored,
		// but for it's should-be-restored part will be added to `position`,
		if (origin) {
			m.translateSelf(origin[0], origin[1])
		}

		return m
	}


	/** Try to get transform component data from a matrix. */
	export function fromMatrix(matrix: Matrix, origin: [number, number] | undefined): TransformComponentData {

		// O * Translate(e, f) * Rotate(θ) * Scale(x, y) * SkewY(s) * O^-1 * C = M * C
		// Translate(e, f) * Rotate(θ) * Scale(x, y) * SkewY(s) = O^-1 * M * O
		// [a c e] = Translate(e, f) * Rotate(θ) * Scale(x, y) * SkewY(s)
		// [b d f]
		// =>
		//   [a c] = Rotate(θ) * Scale(x, y) * SkewY(s)
		//   [b d]

		// If prefer skew in X axis:
		// =>
		//   [cosθ -sinθ][Sx  0][1 s] = [a c]
		//   [sinθ  cosθ][ 0 Sy][0 1] = [b d]
		// =>
		//   Sxcosθ = a
		//   Sxsinθ = b
		//   sa - Sysinθ = c
		//   sb + Sycosθ = d
		// =>
		//   Sx = ±(a^2 + b^2)^0.5
		//   sinθ = b/Sy
		//   cosθ = a/Sy
		//   [-sinθ a][Sy] = [c]
		//   [ cosθ b][s ]   [d]

		// If prefer skew in Y axis:
		// =>
		//   [cosθ -sinθ][Sx  0][1 0] = [a c]
		//   [sinθ  cosθ][ 0 Sy][s 1] = [b d]
		// =>
		//   Sxcosθ + sc = a
		//   Sxsinθ + sd = b
		//  -Sysinθ = c
		//   Sycosθ = d
		// =>
		//   Sy = ±(c^2 + d^2)^0.5
		//   sinθ = -c/Sy
		//   cosθ = d/Sy
		//   [cosθ c][Sx] = [a]
		//   [sinθ d][s ]   [b]

		let m = matrix.clone()

		if (origin) {
			m.multiplySelf(Matrix.i().translateSelf(origin[0], origin[1]))
			m.translateSelf(-origin[0], -origin[1])
		}

		let {a, b, c, d, e, f} = m
		let sy = Math.sqrt(c * c + d * d)
		let sinS = -c / sy
		let cosS = d / sy
		let sita = Math.atan2(-c, d)
		let r = new Matrix2(cosS, sinS, c, d).inverseSelf()
		let {x: sx, y: s} = r.transferPoint(new Point(a, b))

		let data: TransformComponentData = {
			origin,
			translate: [e, f],
			scale: [sx, sy],
			rotate: MathUtils.radiansToDegree(sita),
			skew: MathUtils.radiansToDegree(Math.atan(s)),
			skewAxis: 0,
		}

		return data
	}
}