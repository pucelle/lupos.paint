import {pickPeriodicValuesInRange} from '../../../math'
import {Matrix, MathUtils, Point, Vector} from '@pucelle/ff'
import {Curve} from './curve'
import {calcPathEllipseParameter} from './helpers/ellipse-parameter'
import {CubicBezierCurve} from './cubic-bezier'
import {CurveType, EllipseData} from '../types'


export class EllipseCurve extends Curve {

	/** Ellipse radius. */
	readonly radius: Vector

	/** X axis rotation in clockwise direction. */
	readonly xAxisAngle: number

	/** Large arc flag, 1 or 0. */
	readonly largeArcFlag: 0 | 1

	/** Clockwise flag, 1 or 0. */
	readonly clockwiseFlag: 0 | 1

	/** Center coordinate. */
	readonly center: Readonly<Point>

	/** Start angle in radians, betweens -2π ~ 2π. */
	readonly startAngle: number

	/** End angle in radians, betweens -2π ~ 2π. */
	readonly endAngle: number

	constructor(
		start: Point,
		end: Point,
		radius: Vector,
		xAxisAngle: number,
		largeArcFlag: 1 | 0,
		clockwiseFlag: 1 | 0
	) {
		super(start, end)

		this.radius = radius
		this.xAxisAngle = xAxisAngle
		this.largeArcFlag = largeArcFlag
		this.clockwiseFlag = clockwiseFlag

		let parameters = calcPathEllipseParameter(start, end, radius, xAxisAngle, largeArcFlag, clockwiseFlag)
		this.center = parameters.center
		this.startAngle = parameters.startAngle
		this.endAngle = parameters.endAngle
	}

	tangentAt(t: number): Vector {

		// θ = startAngle * (1 - t) + endAngle * (t)
		// P(t) = Center + (rx * cosθ, ry * isinθ) * (cosψ, isinψ)
		// dP(t) = (-rx * sinθ, ry * icosθ) * (cosψ, isinψ) * dθ
		// dθ = (endAngle - startAngle) * dt
		// => P'(t) = dP(t)/dt
		//    = (-rx * sinθ, ry * icosθ) * (cosψ, isinψ) * (endAngle - startAngle)
		//    = ((-rx * sinθcosψ - ry * cosθsinψ) + i(-rx * sinθsinψ + ry * icosθcosψ)) * (endAngle - startAngle)

		let {startAngle, endAngle, radius} = this
		let cosFi = Math.cos(this.xAxisAngle)
		let sinFi = Math.sin(this.xAxisAngle)

		let sita = MathUtils.mix(startAngle, endAngle, t)
		let cosSita = Math.cos(sita)
		let sinSita = Math.sin(sita)

		let radiansDiff = endAngle - startAngle
		let x = (-radius.x * sinSita * cosFi - radius.y * cosSita * sinFi) * radiansDiff
		let y = (-radius.x * sinSita * sinFi + radius.y * cosSita * cosFi) * radiansDiff
		
		return new Vector(x, y)
	}

	protected calcExtremeTs(): number[] {

		// P(t) = Center + (rx * cosθ, ry * isinθ) * (cosψ, isinψ)
		// P'(t) = dP(t)/dt = (-rx * sinθ, ry * icosθ) * (cosψ, isinψ) * (endAngle - startAngle)
		// Px't = (-rx * sinθcosψ - ry * cosθsinψ) * (endAngle - startAngle) = 0
		// or
		// Py't = (-rx * sinθsinψ + ry * cosθcosψ) * (endAngle - startAngle) = 0

		// Got
		// 1. tanθ = -tanψ * ry / rx, or
		// 2. tanθ = cotψ * ry / rx = tan(π/2 - ψ) * ry / rx

		// Next we add ±π to these two values repetitively, and pick those that inside startAngle and endAngle.

		return [
			...this.calcXExtremeTs(),
			...this.calcYExtremeTs(),
		].sort()
	}

	protected calcXExtremeTs(): number[] {
		let {startAngle, endAngle, xAxisAngle, radius} = this
		let v = Math.atan2(-Math.tan(xAxisAngle) * radius.y, radius.x)
		let min = Math.min(startAngle, endAngle)
		let max = Math.max(startAngle, endAngle)

		return pickPeriodicValuesInRange(v, Math.PI, min, max).map(v => MathUtils.linearStep(v, min, max))
	}

	protected calcYExtremeTs(): number[] {
		let {startAngle, endAngle, xAxisAngle, radius} = this
		let v = Math.atan2(Math.tan(Math.PI / 2 - xAxisAngle) * radius.y, radius.x)
		let min = Math.min(startAngle, endAngle)
		let max = Math.max(startAngle, endAngle)

		return pickPeriodicValuesInRange(v, Math.PI, min, max).map(v => MathUtils.linearStep(v, min, max))
	}

	protected getUnFulfilledPartOf(startT: number, endT: number) {
		let {startAngle, endAngle, radius} = this
		let startPoint = this.pointAt(startT)
		let endPoint = this.pointAt(endT)
		let startSita = MathUtils.mix(startAngle, endAngle, startT)
		let endSita = MathUtils.mix(startAngle, endAngle, endT)
		let largeArcFlag = (endSita - startSita) > Math.PI ? 1 : 0 as 0 | 1

		return new EllipseCurve(startPoint, endPoint, radius, this.xAxisAngle, largeArcFlag, this.clockwiseFlag)
	}

	pointAt(t: number) {

		// θ = startAngle * (1 - t) + endAngle * (t)
		// P(t) = Center + (rx * cosθ, ry * isinθ) * (cosψ, isinψ)
		let {center, startAngle, endAngle, radius} = this
		let cosFi = Math.cos(this.xAxisAngle)
		let sinFi = Math.sin(this.xAxisAngle)
		let sita = MathUtils.mix(startAngle, endAngle, t)
		let cosSita = Math.cos(sita)
		let sinSita = Math.sin(sita)

		let x = center.x + radius.x * cosFi * cosSita - radius.y * sinFi * sinSita
		let y = center.y + radius.x * sinFi * cosSita + radius.y * cosFi * sinSita
		
		return new Point(x, y)
	}

	transform(matrix: Matrix): EllipseCurve {
		let startPoint = matrix.transformPoint(this.startPoint)
		let endPoint = matrix.transformPoint(this.endPoint)
		let larArcFlag = this.largeArcFlag
		let clockwiseFlag = (matrix.isMirrored() ? 1 - this.clockwiseFlag : this.clockwiseFlag) as 0 | 1

		// Matrix from an unit circle to final.
		let finalM = Matrix.i()
		finalM.scaleSelf(this.radius.x, this.radius.y)
		finalM.rotateSelf(this.xAxisAngle)
		finalM.preMultiplySelf(matrix)

		// Here will drop matrix skewing.
		let v1 = matrix.transformVector(new Vector(this.radius.x, 0))
		let v2 = matrix.transformVector(new Vector(0, this.radius.y))
		let radius = new Vector(v1.getLength(), v2.getLength())
		let xAxisAngle = v1.angle()

		return new EllipseCurve(startPoint, endPoint, radius, xAxisAngle, larArcFlag, clockwiseFlag)
	}
	
	toCubicBezierCurves() {

		// 1. A(0.5) = C(0.5)
		// 2. Direction of A'(0) = C'(0) && Direction of A'(1) = C'(1)

		// P(0.5) = 1/8 * (p0 + 3p1 + 3p2 + p3)
		// At most 120° for each piece.

		let {startAngle, endAngle} = this
		let pieceCount = Math.ceil(Math.abs(startAngle - endAngle) / (Math.PI * 2 / 3))
		let curves: CubicBezierCurve[] = []

		for (let i = 0; i < pieceCount; i++) {
			let startT = i / pieceCount
			let endT = (i + 1) / pieceCount
			let p0 = this.pointAt(startT)
			let p3 = this.pointAt(endT)
			let tangent0 = this.tangentAt(startT)
			let tangent3 = this.tangentAt(endT)

			// p1 = p0 + tangent0 * l0
			// p2 = p3 + tangent3 * -l3
			// A(0.5) = 1/8 * (p0 + 3p1 + 3p2 + p3) = 0.5 * (p0 + p3) + 3/8 * (l0 * tangent0 - l3 * tangent3)

			// Note the difference to `arc`:
			// tangent0 ≠ tangent3, and tangent direction will change after projected from an arc.
			
			let centralPoint = this.pointAt(MathUtils.mix(startT, endT, 0.5))
			let lv = Vector.fromDiff(centralPoint, p0.mix(p3, 0.5)).multiplyScalarSelf(8/3)
			let {x: l0, y: l3} = Matrix.decompressFactor(lv, tangent0, tangent3.negativeSelf())
			let p1 = p0.add(tangent0.multiplyScalarSelf(l0))
			let p2 = p3.add(tangent3.multiplyScalarSelf(l3))

			let curve = new CubicBezierCurve(p0, p1, p2, p2)

			curves.push(curve)
		}

		return curves
	}

	equals(curve: EllipseCurve): boolean {
		return this.radius === curve.radius
			&& this.xAxisAngle === curve.xAxisAngle
			&& this.largeArcFlag === curve.largeArcFlag
			&& this.clockwiseFlag === curve.clockwiseFlag
			&& this.startPoint.equals(curve.startPoint)
			&& this.endPoint.equals(curve.endPoint)
	}

	toJSON(): EllipseData {
		return {
			type: CurveType.EllipseTo,
			rx: this.radius.x,
			ry: this.radius.y,
			cx: this.center.x,
			cy: this.center.y,
			x: this.endPoint.x,
			y: this.endPoint.y,
			startAngle: this.startAngle,
			endAngle: this.endAngle,
			xAxisAngle: this.xAxisAngle,
			largeArcFlag: this.largeArcFlag,
			clockwiseFlag: this.clockwiseFlag,
		}
	}
}
