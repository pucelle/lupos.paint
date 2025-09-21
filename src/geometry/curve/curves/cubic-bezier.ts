import {solveOneVariableQuadraticEquation} from '../../../math'
import {Matrix, Point, Vector} from '@pucelle/ff'
import {CubicBezierData, CurveType} from '../types'
import {Curve} from './curve'


export class CubicBezierCurve extends Curve {

	/** Control point 1. */
	readonly controlPoint1: Point

	/** Control point 2. */
	readonly controlPoint2: Point

	constructor(start: Point, end: Point, control1: Point, control2: Point) {
		super(start, end)

		this.controlPoint1 = control1
		this.controlPoint2 = control2
	}

	/** Interpolation betweens 4 points, with 4 factors. */
	private interpolatePoints(f0: number, f1: number, f2: number, f3: number): Coord {
		let p0 = this.startPoint
		let p1 = this.controlPoint1
		let p2 = this.controlPoint2
		let p3 = this.endPoint

		return { 
			x: p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3,
			y: p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3,
		}
	}

	tangentAt(t: number): Vector {
		
		// v = 1 - t
		// P'(t, ν) = -3ν^2P0 + 3(ν^2 - 2tν)P1 + 3(-t^2 + 2tν)P2 + 3t^2P3

		let v = 1 - t
		let f0 = -3 * v * v
		let f1 =  3 * v * v - 6 * t * v
		let f2 = -3 * t * t + 6 * t * v
		let f3 =  3 * t * t

		let {x, y} = this.interpolatePoints(f0, f1, f2, f3)

		return new Vector(x, y)
	}

	protected calcExtremeTs(): number[] {
		return [
			...this.calcXExtremeTs(),
			...this.calcYExtremeTs(),
		].sort()
	}

	protected calcXExtremeTs(): number[] {
		return this.calcXOrYExtremeTs(this.startPoint.x, this.controlPoint1.x, this.controlPoint1.x, this.endPoint.x)
	}

	protected calcYExtremeTs(): number[] {
		return this.calcXOrYExtremeTs(this.startPoint.y, this.controlPoint1.y, this.controlPoint1.y, this.endPoint.y)
	}

	protected calcXOrYExtremeTs(p0: number, p1: number, p2: number, p3: number): number[] {

		// P(t) = (1-t)^3 * P0 + 3t(1-t)^2 * P1 + 3t^2(1-t) * P2 + t^3 * P3

		// P'(t) = [t^2 t 1 0] ×  [-3   9 -9 3] × [P0]
		//                        [ 6 -12  6 0]   [P1]
		//                        [-3   3  0 0]   [P2]
		//                        [ 1   0  0 0]   [P3]

		// Px'(t) = (-3P0x + 9P1x - 9P2x + 3P3x)t^2 + (6P0x - 12P1x + 6P2x)t + (-3P0x + 3P1x) = 0
		// or Py'(t) = ... = 0

		// Cubic bezier is a interpolation between 4 points,
		// If want only a rough bounding box,
		// making from 4 points would be enough.

		let a = -3 * p0 +  9 * p1 - 9 * p2 + 3 * p3
		let b =  6 * p0 - 12 * p1 + 6 * p2
		let c = -3 * p0 +  3 * p1

		let r = solveOneVariableQuadraticEquation(a, b, c)

		if (r) {
			return r.filter(r => r > 0 && r < 1)
		}

		return []
	}

	protected getUnFulfilledPartOf(startT: number, endT: number) {
		let startPoint = this.pointAt(startT)
		let endPoint = this.pointAt(endT)

		// P(t) = (1-t)^3 * P0 + 3t(1-t)^2 * P1 + 3t^2(1-t) * P2 + t^3 * P3

		// P'(t) = [t^2 t 1 0] ×  [-3   9 -9 3] × [P0]
		//                        [ 6 -12  6 0]   [P1]
		//                        [-3   3  0 0]   [P2]
		//                        [ 1   0  0 0]   [P3]

		// P(0)' = 3(P1 - P0)
		// P(1)' = 3(P3 - P2)
		// Equivalent to if keep speed and direction at P0,
		// will reach P1 when t=1/3 -- P1 = P0 + P(0)' / 3.

		let startTangent = this.tangentAt(startT)
		let endTangent = this.tangentAt(endT)

		let control1 = startPoint.add(startTangent.multiplyScalarSelf(1/3))
		let control2 = endPoint.add(endTangent.multiplyScalarSelf(-1/3))

		return new CubicBezierCurve(startPoint, endPoint, control1, control2)
	}
	
	pointAt(t: number): Point {

		// v = 1 - t
		// P(t, ν) = ν^3P0 + 3tν^2P1 + 3t^2νP2 + t^3P3

		let v = 1.0 - t
		let f0 = v * v * v
		let f1 = v * v * t * 3
		let f2 = v * t * t * 3
		let f3 = t * t * t

		let {x, y} = this.interpolatePoints(f0, f1, f2, f3)

		return new Point(x, y)
	}
	
	transform(matrix: Matrix): CubicBezierCurve {
		let startPoint = matrix.transformPoint(this.startPoint)
		let endPoint = matrix.transformPoint(this.endPoint)
		let controlPoint1 = matrix.transformPoint(this.controlPoint1)
		let controlPoint2 = matrix.transformPoint(this.controlPoint2)

		return new CubicBezierCurve(startPoint, endPoint, controlPoint1, controlPoint2)
	}

	toCubicBezierCurves() {
		return [this]
	}

	equals(curve: CubicBezierCurve): boolean {
		return this.startPoint.equals(curve.startPoint)
			&& this.endPoint.equals(curve.endPoint)
			&& this.controlPoint1.equals(curve.controlPoint1)
			&& this.controlPoint2.equals(curve.controlPoint2)
	}

	toJSON(): CubicBezierData {
		return {
			type: CurveType.CubicBezierTo,
			x: this.endPoint.x,
			y: this.endPoint.y,
			cx1: this.controlPoint1.x,
			cy1: this.controlPoint1.y,
			cx2: this.controlPoint2.x,
			cy2: this.controlPoint2.y,
		}
	}
	
	/** 
	 * Mix with another cubic bezier curve.
	 * Only `CubicBezierCurve` can mix.
	 */
	mix(curve: CubicBezierCurve, rate: number) {
		return new CubicBezierCurve(
			this.startPoint.mix(curve.startPoint, rate),
			this.endPoint.mix(curve.endPoint, rate),
			this.controlPoint1.mix(curve.controlPoint1, rate),
			this.controlPoint2.mix(curve.controlPoint2, rate)
		)
	}
}