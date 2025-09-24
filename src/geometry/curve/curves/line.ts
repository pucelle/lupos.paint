import {Box, MathUtils, Matrix, Point, Vector} from '@pucelle/ff'
import {CurveType, LineData} from '../types'
import {CubicBezierCurve} from './cubic-bezier'
import {Curve} from './curve'


export class LineCurve extends Curve {

	lengthDivisions = 1

	/** `u` equals `t` for lines. */
	mapU2T(u: number): number {
		return u
	}

	/** `u` equals `t` for lines. */
	mapT2U(t: number): number {
		return t
	}

	pointAt(t: number) {
		return this.startPoint.mix(this.endPoint, t)
	}

	tangentAt(): Vector {
		return Vector.fromDiff(this.endPoint, this.startPoint)
	}

	curvatureAt(): number {
		return 0
	}

	getCurvatureAdaptiveTs(): number[] {
		return [0, 1]
	}

	getBox(): Box {
		if (this.cachedBox) {
			return this.cachedBox
		}

		let box = Box.fromCoords(this.startPoint, this.endPoint)!
		return this.cachedBox = box
	}

	/** To get a closest point to `point` from current curve. */
	closestPointTo(point: Point): Readonly<Point> {

		// Vector C = point - startPoint
		// Vector S = endPoint - startPoint
		// Get projection from C to S:
		// PV = C · Normal(S)
		// P = PV * Normal(S)
		// Get distance from point to S: D = C - P

		let s = Vector.fromDiff(this.endPoint, this.startPoint)
		let sLength = s.getLength()
		let sNormal = s.normalizeSelf()

		let c = Vector.fromDiff(point, this.startPoint)
		let pValue = c.dot(sNormal)

		if (pValue < 0) {
			return this.startPoint
		}
		else if (pValue > sLength) {
			return this.endPoint
		}
		else {
			return this.startPoint.add(sNormal.multiplyScalarSelf(pValue))
		}
	}

	calcTsByX(x: number): number[] {
		let startX = this.startPoint.x
		let endX = this.endPoint.x
		let t = MathUtils.linearInterpolate(x, startX, endX)

		if (t >= 0 && t <= 1) {
			return [t]
		}

		return []
	}

	calcTsByY(y: number): number[] {
		let startY = this.startPoint.y
		let endY = this.endPoint.y
		let t = MathUtils.linearInterpolate(y, startY, endY)

		if (t >= 0 && t <= 1) {
			return [t]
		}

		return []
	}

	protected calcExtremeTs(): number[] {
		return []
	}

	protected calcXExtremeTs(): number[] {
		return []
	}

	protected calcYExtremeTs(): number[] {
		return []
	}

	protected getUnFulfilledPartOf(startT: number, endT: number): this {
		return new LineCurve(this.pointAt(startT), this.pointAt(endT)) as this
	}

	transform(matrix: Matrix): LineCurve {
		let startPoint = matrix.transformPoint(this.startPoint)
		let endPoint = matrix.transformPoint(this.endPoint)

		return new LineCurve(startPoint, endPoint)
	}

	toCubicBezierCurves() {

		// Mix rate can also be 0 and 1, also make the line.
		// Difference is that in this scene dCurveLength / dt changes too much.

		let c1 = this.startPoint.mix(this.endPoint, 1/3)
		let c2 = this.startPoint.mix(this.endPoint, 2/3)

		return [
			new CubicBezierCurve(this.startPoint, this.endPoint, c1, c2)
		]
	}

	equals(curve: LineCurve): boolean {
		return this.startPoint.equals(curve.startPoint)
			&& this.endPoint.equals(curve.endPoint)
	}

	toJSON(): LineData {
		return {
			type: CurveType.LineTo,
			x: this.endPoint.x,
			y: this.endPoint.y,
		}
	}
}