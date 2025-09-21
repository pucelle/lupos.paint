import {Matrix, Point, Vector} from '@pucelle/ff'
import {CurveType, QuadraticBezierData} from '../types'
import {CubicBezierCurve} from './cubic-bezier'
import {Curve} from './curve'


/** Nearly same as cubic bezier, except two control points collapse. */
export class QuadraticBezierCurve extends Curve {

	/** Control point. */
	readonly controlPoint: Point

	constructor(start: Point, end: Point, control: Point) {
		super(start, end)
		this.controlPoint = control
	}

	tangentAt(t: number): Vector {

		// P'(t, ν) = -2νP0 + 2(ν - t)P1 + 2tP2

		let v  = 1.0 - t
		let f0 = -2 * v
		let f1 = 2 * (v - t)
		let f2 = 2 * t

		let {x, y} = this.interpolatePoints(f0, f1, f2)

		return new Vector(x, y)
	}

	/** Interpolation betweens 3 points. */
	private interpolatePoints(f0: number, f1: number, f2: number): Coord {
		let p0 = this.startPoint
		let p1 = this.controlPoint
		let p2 = this.endPoint

		return {
			x: p0.x * f0 + p1.x * f1 + p2.x * f2,
			y: p0.y * f0 + p1.y * f1 + p2.y * f2,
		}
	}

	protected calcExtremeTs(): number[] {
		return [
			...this.calcXExtremeTs(),
			...this.calcYExtremeTs(),
		].sort()
	}

	protected calcXExtremeTs(): number[] {
		return this.calcXOrYExtremeTs(this.startPoint.x, this.controlPoint.x, this.endPoint.x)
	}

	protected calcYExtremeTs(): number[] {
		return this.calcXOrYExtremeTs(this.startPoint.y, this.controlPoint.y, this.endPoint.y)
	}

	protected calcXOrYExtremeTs(p0: number, p1: number, p2: number): number[] {

		// P(t) = (1-t)^2 * P0 + 2t(1-t) * P1 + t^2 * P3

		// P'(t) = [t 1 0] ×  [ 2 -4  2] × [P0]
		//                    [-2  2  0]   [P1]
		//                    [ 0  0  0]   [P2]


		// Px'(t) = (2P0x - 4P1x + 2P2)t + (-2P0x + 2P1x) = 0
		// or Py'(t) = ... = 0

		let a =  2 * p0 - 4 * p1 + 2 * p2
		let b = -2 * p0 + 2 * p1
		let t = -b / a

		if (t > 0 && t < 1) {
			return [t]
		}

		return []
	}

	protected getUnFulfilledPartOf(startT: number, endT: number) {
		let startPoint = this.pointAt(startT)
		let endPoint = this.pointAt(endT)

		// P(t) = (1-t)^2 * P0 + 2t(1-t) * P1 + t^2 * P2
		// P(t)' = -2(1-t) * P0 + (2 - 4t) * P1 + 2t * P2
		// P(0)' = 2(P1 - P0)
		// P(1)' = 2(P2 - P1)
		// Equivalent to if keep speed and direction at P0,
		// will reach P1 when t=1/2 -- P1 = P0 + P(0)' / 2.

		let startTangent = this.tangentAt(startT)
		let control = startPoint.add(startTangent.multiplyScalar(0.5))
		
		return new QuadraticBezierCurve(startPoint, endPoint, control)
	}
	
	pointAt(t: number) {

		// P'(t, ν) = -2νP0 + 2(ν - t)P1 + 2tP2

		let v  = 1.0 - t
		let f0 = -2 * v
		let f1 = 2 * (v - t)
		let f2 = 2 * t

		let {x, y} = this.interpolatePoints(f0, f1, f2)

		return new Point(x, y)
	}

	transform(matrix: Matrix): QuadraticBezierCurve {
		let startPoint = matrix.transformPoint(this.startPoint)
		let endPoint = matrix.transformPoint(this.endPoint)
		let controlPoint = matrix.transformPoint(this.controlPoint)

		return new QuadraticBezierCurve(startPoint, endPoint, controlPoint)
	}

	toCubicBezierCurves() {

		// Q(0.5) = q0/4 + q1/2 + q2/4
		// C(0.5) = c0/8 + 3c1/8 + 3c2/8 + c3/8

		// Make 3c1/8 = q0/8 + q1/4
		//   => c1 = q0 / 3 + 2 * q1 / 3

		let c1 = this.startPoint.mix(this.controlPoint, 2/3)
		let c2 = this.endPoint.mix(this.controlPoint, 2/3)

		return [
			new CubicBezierCurve(this.startPoint, this.endPoint, c1, c2)
		]
	}

	equals(curve: QuadraticBezierCurve): boolean {
		return this.startPoint.equals(curve.startPoint)
			&& this.endPoint.equals(curve.endPoint)
			&& this.controlPoint.equals(curve.controlPoint)
	}

	toJSON(): QuadraticBezierData {
		return {
			type: CurveType.QuadraticBezierTo,
			x: this.endPoint.x,
			y: this.endPoint.y,
			cx: this.controlPoint.x,
			cy: this.controlPoint.y,
		}
	}
	
	/** Mix with another cubic bezier curve. */
	mix(curve: QuadraticBezierCurve, rate: number) {
		return new QuadraticBezierCurve(
			this.startPoint.mix(curve.startPoint, rate),
			this.endPoint.mix(curve.endPoint, rate),
			this.controlPoint.mix(curve.controlPoint, rate)
		)
	}
}