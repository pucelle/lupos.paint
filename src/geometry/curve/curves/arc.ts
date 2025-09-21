import {Matrix, Vector, Point, MathUtils} from '@pucelle/ff'
import {pickClosestPeriodicValueInRange, pickPeriodicValuesInRange} from '../../../math'
import {Curve} from './curve'
import {calcPathArcParameter} from './helpers/arc-parameter'
import {EllipseCurve} from './ellipse'
import {CubicBezierCurve} from './cubic-bezier'
import {ArcData, CurveType} from '../types'


export class ArcCurve extends Curve {

	/** Arc radius. */
	readonly radius: number

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
		radius: number,
		largeArcFlag: 0 | 1,
		clockwiseFlag: 0 | 1
	) {
		super(start, end)

		this.radius = radius
		this.largeArcFlag = largeArcFlag
		this.clockwiseFlag = clockwiseFlag

		let parameters = calcPathArcParameter(start, end, radius, largeArcFlag, clockwiseFlag)
		this.center = parameters.center
		this.startAngle = parameters.startAngle
		this.endAngle = parameters.endAngle
	}

	getLength(): number {
		let {startAngle, endAngle} = this
		return Math.abs(endAngle - startAngle) * this.radius
	}

	getSpacedPoints(divisions: number = this.lengthDivisions): Readonly<Point>[] {
		return this.getPoints(divisions)
	}
	
	/** `u` equals `t` for arc. */
	mapU2T(u: number): number {
		return u
	}

	/** `u` equals `t` for arc. */
	mapT2U(t: number): number {
		return t
	}

	tangentAt(t: number): Vector {

		// θ = startAngle * (1 - t) + endAngle * (t)
		// P(t) = Center + radius * (cosθ, isinθ)
		// dP(t) = radius * (-sinθ, icosθ) * dθ
		// dθ = (endAngle - startAngle) * dt
		// => P'(t) = dP(t)/dt = radius * (-sinθ, icosθ) * (endAngle - startAngle)

		let {startAngle, endAngle, radius} = this
		let sita = MathUtils.mix(startAngle, endAngle, t)
		let cosSita = Math.cos(sita)
		let sinSita = Math.sin(sita)

		let radiansDiff = endAngle - startAngle
		let x = -radius * sinSita * radiansDiff
		let y = radius * cosSita * radiansDiff
		
		return new Vector(x, y)
	}

	curvatureAt(_t: number): number {
		return 1 / this.radius
	}

	getEqualCurvaturePoints(segmentCurvature: number = 0.63, scaling: number = 1): Readonly<Point>[] {
		let {startAngle, endAngle} = this
		let totalLengthCurvature = Math.abs(endAngle - startAngle)
		let divisions = Math.max(Math.floor(totalLengthCurvature / segmentCurvature * scaling), 1)

		return this.getPoints(divisions)
	}

	closestPointTo(point: Point): Readonly<Point> {
		let {startAngle, endAngle, center} = this
		let angle = Vector.fromDiff(point, center).angle()
		let sita = pickClosestPeriodicValueInRange(angle, Math.PI * 2, Math.min(startAngle, endAngle), Math.max(startAngle, endAngle))
		let t = (sita - startAngle) / (endAngle - startAngle)

		return this.pointAt(t)
	}
	
	calcTsByX(x: number): number[] {

		// P(t) = Center + radius * (cosθ, isinθ)
		// P(t)x = CenterX + radius * cosθ = x
		// θ = ±arccos(x - CenterX) / radius
		let {startAngle, endAngle, center} = this
		let cosSita = (x - center.x) / this.radius
		let sita = Math.acos(cosSita)

		if (isNaN(sita)) {
			return []
		}

		let min = Math.min(startAngle, endAngle)
		let max = Math.max(startAngle, endAngle)

		let sitaL = [
			...pickPeriodicValuesInRange(sita, Math.PI * 2, min, max),
			...pickPeriodicValuesInRange(-sita, Math.PI * 2, min, max),
		]

		return sitaL.map(s => (s - startAngle) / (endAngle - startAngle))
	}

	calcTsByY(y: number): number[] {

		// P(t) = Center + radius * (cosθ, isinθ)
		// P(t)y = CenterY + radius * sinθ = y
		// θ = ±arsin(y - CenterY) / radius
		let {startAngle, endAngle, center} = this
		let cosSita = (y - center.y) / this.radius
		let sita = Math.asin(cosSita)

		if (isNaN(sita)) {
			return []
		}

		let min = Math.min(startAngle, endAngle)
		let max = Math.max(startAngle, endAngle)

		let sitaL = [
			...pickPeriodicValuesInRange(sita, Math.PI * 2, min, max),
			...pickPeriodicValuesInRange(-sita, Math.PI * 2, min, max),
		]

		return sitaL.map(s => (s - startAngle) / (endAngle - startAngle))
	}

	protected getUnFulfilledPartOf(startT: number, endT: number): ArcCurve {
		let {startAngle, endAngle, radius} = this
		let startPoint = this.pointAt(startT)
		let endPoint = this.pointAt(endT)
		let startSita = MathUtils.mix(startAngle, endAngle, startT)
		let endSita = MathUtils.mix(startAngle, endAngle, endT)
		let largeArcFlag = ((endSita - startSita) > Math.PI ? 1 : 0) as 0 | 1

		return new ArcCurve(startPoint, endPoint, radius, largeArcFlag, this.clockwiseFlag)
	}

	protected calcExtremeTs(): number[] {
		let {startAngle, endAngle} = this
		let min = Math.min(startAngle, endAngle)
		let max = Math.max(startAngle, endAngle)

		return pickPeriodicValuesInRange(0, Math.PI / 2, min, max).map(v => MathUtils.linearStep(v, min, max))
	}

	protected calcXExtremeTs(): number[] {
		let {startAngle, endAngle} = this
		let min = Math.min(startAngle, endAngle)
		let max = Math.max(startAngle, endAngle)

		return pickPeriodicValuesInRange(0, Math.PI, min, max).map(v => MathUtils.linearStep(v, min, max))
	}

	protected calcYExtremeTs(): number[] {
		let {startAngle, endAngle} = this
		let min = Math.min(startAngle, endAngle)
		let max = Math.max(startAngle, endAngle)

		return pickPeriodicValuesInRange(Math.PI / 2, Math.PI, min, max)
	}

	pointAt(t: number): Point {

		// θ = startAngle * (1 - t) + endAngle * (t)
		// P(t) = Center + radius * (cosθ, isinθ)

		let {center, startAngle, endAngle, radius} = this
		let sita = MathUtils.mix(startAngle, endAngle, t)
		let cosSita = Math.cos(sita)
		let sinSita = Math.sin(sita)

		let x = center.x + radius * cosSita
		let y = center.y + radius * sinSita
		
		return new Point(x, y)
	}

	transform(matrix: Matrix): ArcCurve | EllipseCurve {
		let startPoint = matrix.transformPoint(this.startPoint)
		let endPoint = matrix.transformPoint(this.endPoint)
		let larArcFlag = this.largeArcFlag
		let clockwiseFlag = (matrix.isMirrored() ? 1 - this.clockwiseFlag : this.clockwiseFlag) as 0 | 1

		// Not similar transform, become an ellipsis.
		// Here will drop matrix skewing.
		if (!matrix.isSimilar()) {
			let v1 = matrix.transformVector(new Vector(this.radius, 0))
			let v2 = matrix.transformVector(new Vector(0, this.radius))
			let radius = new Vector(v1.getLength(), v2.getLength())
			let xAxisAngle = v1.angle()

			return new EllipseCurve(startPoint, endPoint, radius, xAxisAngle, larArcFlag, clockwiseFlag)
		}

		// Still be arc.
		else {
			let radius = this.radius * matrix.a
			return new ArcCurve(startPoint, endPoint, radius, larArcFlag, clockwiseFlag)
		}
	}

	toCubicBezierCurves(): CubicBezierCurve[] {

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

			// p1 = p0 + tangent0 * l
			// p2 = p3 + tangent3 * -l
			// A(0.5) = 1/8 * (p0 + 3p1 + 3p2 + p3) = 0.5 * (p0 + p3) + 3/8 * l * (tangent0 - tangent3)
			// l = (A(0.5) - 0.5 * (p0 + p3)) / (tangent0 - tangent3) * 8/3
			
			let centralPoint = this.pointAt(MathUtils.mix(startT, endT, 0.5))
			let tangentDff = tangent0.sub(tangent3)

			// l is about 1/3, +- 0.05.
			let l = Vector.fromDiff(centralPoint, p0.mix(p3, 0.5)).getLength() / tangentDff.getLength() * 8/3
			let p1 = p0.add(tangent0.multiplyScalarSelf(l))
			let p2 = p3.add(tangent3.multiplyScalarSelf(-l))

			let curve = new CubicBezierCurve(p0, p1, p2, p2)

			curves.push(curve)
		}

		return curves
	}

	equals(curve: ArcCurve): boolean {
		return this.radius === curve.radius
			&& this.largeArcFlag === curve.largeArcFlag
			&& this.clockwiseFlag === curve.clockwiseFlag
			&& this.startPoint.equals(curve.startPoint)
			&& this.endPoint.equals(curve.endPoint)
	}

	toJSON(): ArcData {
		return {
			type: CurveType.ArcTo,
			r: this.radius,
			cx: this.center.x,
			cy: this.center.y,
			x: this.endPoint.x,
			y: this.endPoint.y,
			startAngle: this.startAngle,
			endAngle: this.endAngle,
			largeArcFlag: this.largeArcFlag,
			clockwiseFlag: this.clockwiseFlag,
		}
	}
}
