import {MathUtils, Point, Vector} from '@pucelle/ff'
import {CurvePath, CurvePathGroup} from '../curve-paths'
import {LineCurve, Curve} from '../curves'
import {DashArrayGenerator} from './helpers/dash-array'
import {calcMiterLineJoinBevelPoints, calcRoundLineJoinBezierCurve} from './helpers/line-join'
import {connectTwoLineSegments, makeRadial} from './helpers/line-segments'
import {calcRoundLineCapBezierCurves} from './helpers/line-cap'


/** When dash array set, cut to several parts. */
interface DashPart {
	path: CurvePath
	startLength: number
}


/** 
 * Make a filled path from a curve path stroking,
 * which can stroke by gradient stroking widths.
 */
export class GradientWidthStroker {

	private curvePath: CurvePath

	/** Affects curve division. */
	private viewScaling: number

	private curveIndexRange: [number, number] | undefined
	private startWidth: number
	private endWidth: number
	private power: number

	private lineCap: 'butt' | 'round' | 'square'
	private lineJoin: 'bevel' | 'round' | 'miter'
	private miterLimit: number
	private dashArrayGenerator: DashArrayGenerator | null
	
	private gradientLength: number = 0
	private lengthBeforeGradient: number = 0

	constructor(
		curvePath: CurvePath,
		viewScaling: number = 1,
		curveIndexRange: [number, number] | undefined,
		startWidth: number,
		endWidth: number,
		power: number = 1,
		lineCap: 'butt' | 'round' | 'square' = 'butt',
		lineJoin: 'bevel' | 'round' | 'miter' = 'miter',
		miterLimit: number = 10,
		dashArray: number[] | null = null,
		dashOffset: number = 0,
	) {
		this.curvePath = curvePath
		this.viewScaling = viewScaling
		this.curveIndexRange = curveIndexRange
		this.startWidth = startWidth
		this.endWidth = endWidth
		this.power = power
		this.lineCap = lineCap
		this.lineJoin = lineJoin
		this.miterLimit = miterLimit

		this.dashArrayGenerator = dashArray ? new DashArrayGenerator(dashArray, dashOffset) : null
		this.initGradientLengths()
	}

	/** Make the length of the part that should do gradient stroke. */
	private initGradientLengths() {
		if (this.curveIndexRange) {
			let startRange = Math.min(this.curveIndexRange[0], this.curvePath.curves.length)
			let endRange = Math.min(this.curveIndexRange[1], this.curvePath.curves.length)
		
			for (let i = 0; i < startRange; i++) {
				this.lengthBeforeGradient += this.curvePath.curves[i].getLength()
			}

			for (let i = startRange; i < endRange; i++) {
				this.gradientLength += this.curvePath.curves[i].getLength()
			}
		}
		else {
			this.gradientLength = this.curvePath.getLength()
		}
	}

	/** Get gradient rate by current arc length. */
	private getGradientRateAtLength(length: number): number {
		if (this.curveIndexRange) {
			if (length < this.lengthBeforeGradient) {
				return 0
			}

			return MathUtils.linearStep(length - this.lengthBeforeGradient, 0, this.gradientLength)
		}
		else {
			return length / this.curvePath.getLength()
		}
	}

	/** Get gradient rate by current arc length. */
	private getStrokeWidthAtLength(length: number): number {
		let rate = this.getGradientRateAtLength(length)
		return MathUtils.mix(this.startWidth, this.endWidth,  Math.pow(rate, this.power))
	}

	/** Generate a new filled curve path, or a dashed curve path group. */
	generate(): CurvePath | CurvePathGroup {
		if (this.dashArrayGenerator) {
			return this.generateDashParts()
		}
		else {
			return this.generateOne(this.curvePath, 0)
		}
	}

	/** Generate a multi curve path when dash array set. */
	private generateDashParts(): CurvePathGroup {
		let parts = this.cutToDashParts()
		let paths = parts.map(part => this.generateOne(part.path, part.startLength))

		return CurvePathGroup.fromCurvePaths(paths)!
	}

	/** Cut to several parts when setting dash array. */
	private cutToDashParts() {
		let totalLength = this.curvePath.getLength()
		let currentLength = 0
		let parts: DashPart[] = []

		for (let dashItem of this.dashArrayGenerator!.iterate()) {
			let strokeWidth = this.getStrokeWidthAtLength(currentLength)
			let startLength = currentLength + dashItem.empty * strokeWidth
			let endLength = currentLength + (dashItem.empty + dashItem.solid) * strokeWidth
			let startU = startLength / totalLength

			if (startU >= 1) {
				break
			}

			let endU = Math.min(endLength / totalLength, 1)
			let startT = this.curvePath.mapU2T(startU)
			let endT = this.curvePath.mapU2T(endU)
			let curvePart = this.curvePath.partOf(startT, endT)
	
			// Here we make the parts have lower lengthDivisions.
			// This can be achieved by testing local index and generating parameter t.
			// By multiply 12 and striped t, then ceil can get a reduced lengthDivisions.
			let startIT = this.curvePath.mapGlobalT2Local(startT)
			let endIT = this.curvePath.mapGlobalT2Local(endT)
			let strippedT = (endIT.i - startIT.i - 1) + endIT.t + (1 - startIT.t)
			let lengthDivisions = Math.min(Math.ceil(strippedT * 12), 12)

			for (let curve of curvePart.curves) {
				curve.lengthDivisions = lengthDivisions
			}

			parts.push({
				path: curvePart,
				startLength,
			})

			if (endT >= 1) {
				break
			}

			currentLength = endLength
		}

		return parts
	}

	/** Generate a new filled path. */
	private generateOne(path: CurvePath, pathStartLength: number): CurvePath {
		let curves: Curve[] = []
		let {leftList, rightList} = this.doCurvePathSampling(path, pathStartLength)

		// Connect left.
		for (let i = 0; i < leftList.length; i++) {
			this.connectSegments(leftList[i], i === leftList.length - 1 ? undefined : leftList[i + 1], curves)
		}

		// Connect left end to right start.
		this.connectSides(leftList[leftList.length - 1], rightList[0], curves)

		// Connect right.
		for (let i = 0; i < rightList.length; i++) {
			this.connectSegments(rightList[i], i === rightList.length - 1 ? undefined : rightList[i + 1], curves)
		}

		// Connect right end to left start.
		this.connectSides(rightList[rightList.length - 1], leftList[0], curves)

		return CurvePath.fromCurves(curves, true)!
	}

	/** Sampling curve path for points, and make left and right stroke curve points. */
	private doCurvePathSampling(path: CurvePath, pathStartLength: number) {
		let currentLength = 0

		// Assume a vector going down, `left` is where the vector pointed after anti-clockwise rotation 90°.
		let leftList: Point[][] = []
		let rightList: Point[][] = []

		for (let i = 0; i < path.curves.length; i++) {
			let curve = path.curves[i]
			let {left, right} = this.doCurveSampling(curve, pathStartLength + currentLength)

			leftList.push(left)
			rightList.push(right)

			currentLength += curve.getLength()
		}

		rightList.reverse()

		return {
			leftList,
			rightList,
		}
	}

	/** Sampling one curve points, and make left and right stroke curve points. */
	private doCurveSampling(curve: Curve, startLength: number): {left: Point[], right: Point[]} {
		let left: Point[] = []
		let right: Point[] = []
		let ts: number[] = curve.getCurvatureAdaptiveTs(undefined, this.viewScaling)

		for (let t of ts) {
			let normal = curve.tangentAt(t).normalizeSelf()
			normal.rotateSelf(Math.PI / 2)

			let point = curve.pointAt(t)
			let u = curve.mapT2U(t)
			let strokeWidth = this.getStrokeWidthAtLength(startLength + u * curve.getLength())
			let halfWidth = strokeWidth / 2
			
			normal.multiplyScalarSelf(-halfWidth)

			// Left points connect in anti-clockwise order.
			let leftPoint = point.add(normal)
			let rightPoint = point.add(normal.negativeSelf())

			left.push(leftPoint)
			right.push(rightPoint)
		}

		right.reverse()

		return {
			left,
			right,
		}
	}

	/** Connect two adjacent line segments. */
	private connectSegments(segments1: Point[], segments2: Point[] | undefined, curves: Curve[]) {
		if (!segments2) {
			for (let i = 0; i < segments1.length - 1; i++) {
				curves.push(new LineCurve(segments1[i], segments1[i+1]))
			}
			return
		}

		let connectResult = connectTwoLineSegments(segments1, segments2)
		if (connectResult) {
			if (connectResult.indexRange1) {
				segments1 = segments1.slice(connectResult.indexRange1[0], connectResult.indexRange1[1])
			}

			if (connectResult.indexRange2) {
				segments2 = segments2.slice(connectResult.indexRange2[0], connectResult.indexRange2[1])
			}
		}

		// Not push last line.
		for (let i = 0; i < segments1.length - 2; i++) {
			curves.push(new LineCurve(segments1[i], segments1[i+1]))
		}

		if (connectResult) {
			if (connectResult.outerIntersected) {
				if (this.lineJoin === 'round') {
					let radial1 = connectResult.radial1
					let radial2 = connectResult.radial2
					curves.push(new LineCurve(segments1[segments1.length - 2], segments1[segments1.length - 1]))
					curves.push(calcRoundLineJoinBezierCurve(radial1, radial2))
				}

				else if (this.lineJoin === 'bevel') {
					curves.push(new LineCurve(segments1[segments1.length - 1], segments2[0]))
				}

				else if (this.lineJoin === 'miter') {
					let radial1 = connectResult.radial1
					let radial2 = connectResult.radial2
					let miterLimit = this.miterLimit
					let bevelPoints = calcMiterLineJoinBevelPoints(radial1, radial2, miterLimit)

					if (bevelPoints) {
						curves.push(new LineCurve(segments1[segments1.length - 2], bevelPoints[0]))
						curves.push(new LineCurve(bevelPoints[0], bevelPoints[1]))
						segments2[0] = bevelPoints[1]
					}
					else {
						curves.push(new LineCurve(segments1[segments1.length - 2], connectResult.point))
						segments2[0] = connectResult.point
					}
				}
			}
			else {
				curves.push(new LineCurve(segments1[segments1.length - 2], connectResult.point))
				segments2[0] = connectResult.point
			}
		}
	}

	/** Connect left and right sides in clockwise. */
	private connectSides(segments1: Point[], segments2: Point[], curves: Curve[]) {
		if (this.lineCap === 'round') {
			let radial1 = makeRadial(segments1, segments1.length - 1, 1)
			let radial2 = makeRadial(segments2, 0, -1)

			curves.push(...calcRoundLineCapBezierCurves(radial1, radial2))
		}
		else if (this.lineCap === 'square') {
			let radial1 = makeRadial(segments1, segments1.length - 1, 1)
			let radial2 = makeRadial(segments2, 0, -1)
			let pointDiffLengthHalf = Vector.fromDiff(radial1.point, radial2.point).getLength() / 2
			let point1 = radial1.point.add(radial1.vector.multiplyScalar(pointDiffLengthHalf))
			let point2 = radial2.point.add(radial2.vector.multiplyScalar(pointDiffLengthHalf))

			curves.push(
				new LineCurve(
					radial1.point,
					point1,
				),
				new LineCurve(
					point1,
					point2,
				),
				new LineCurve(
					point2,
					radial2.point,
				)
			)
		}
		else if (this.lineCap === 'butt') {
			curves.push(
				new LineCurve(
					segments1[segments1.length - 1],
					segments2[0]
				)
			)
		}
	}
}
