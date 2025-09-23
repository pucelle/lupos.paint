import {Box, IntegralLookup, MathUtils, Matrix, Point, Vector} from '@pucelle/ff'
import {CurveData, CurveType} from '../types'
import {ArcCurve, Curve, CubicBezierCurve, LineCurve, QuadraticBezierCurve, EllipseCurve} from '../curves'
import {makeSVGPathD, parseSVGPathD} from './helpers/svg-path-d'
import {CurvePathMixer} from './helpers/path-mixer'


/** 
 * Contains a list of curves that connected in sequence,
 * and keep consistent APIs of Curve.
 * All curves inside must be continuous.
 */
export class CurvePath {

	/** Make a curve path from curve data list. */
	static fromCurveData(dataList: CurveData[]): CurvePath | null {
		if (dataList.length === 0) {
			return null
		}

		if (dataList[0].type !== CurveType.MoveTo) {
			throw new Error(`Curve data must start with a "MoveTo"!`)
		}

		let path = new CurvePath()

		for (let i = 1; i < dataList.length; i++) {
			let data = dataList[i]
			path.addCurveData(data)
		}

		return path
	}

	/** Make a curve path from curve list. */
	static fromCurves(curveList: Curve[], closeIt: boolean = false): CurvePath | null {
		if (curveList.length === 0) {
			return null
		}

		let path = new CurvePath()
		path.addCurves(curveList)

		if (closeIt) {
			path.closePath()
		}

		return path
	}

	/** Make a curve path from a SVG path "d" attribute. */
	static fromSVGPathD(d: string): CurvePath | null {
		let path = new CurvePath()

		for (let {command, values} of parseSVGPathD(d)) {
			if (command === 'M') {
				if (values.length !== 2) {
					throw new Error(`"M" command must have two values followed!`)
				}
				path.moveTo(values[0], values[1])
			}
			
			else if (command === 'm') {
				throw new Error(`Not support "m" command!`)
			}

			else if (command === 'Z' || command === 'z') {
				path.closePath()
			}

			else if (command === 'L') {
				if (values.length !== 2) {
					throw new Error(`"L" command must have two values followed!`)
				}
				path.lineTo(values[0], values[1])
			}

			else if (command === 'l') {
				if (values.length !== 2) {
					throw new Error(`"l" command must have two values followed!`)
				}
				path.lineBy(values[0], values[1])
			}

			else if (command === 'H') {
				if (values.length !== 1) {
					throw new Error(`"H" command must have 1 value followed!`)
				}
				path.hLineTo(values[0])
			}

			else if (command === 'h') {
				if (values.length !== 1) {
					throw new Error(`"h" command must have 1 value followed!`)
				}
				path.hLineBy(values[0])
			}

			else if (command === 'V') {
				if (values.length !== 1) {
					throw new Error(`"V" command must have 1 value followed!`)
				}
				path.vLineTo(values[0])
			}

			else if (command === 'v') {
				if (values.length !== 1) {
					throw new Error(`"v" command must have 1 value followed!`)
				}
				path.vLineBy(values[0])
			}

			else if (command === 'C') {
				if (values.length !== 6) {
					throw new Error(`"C" command must have 6 values followed!`)
				}
				path.cubicBezierTo(
					values[4],
					values[5],
					values[0],
					values[1],
					values[2],
					values[3]
				)
			}

			else if (command === 'c') {
				if (values.length !== 6) {
					throw new Error(`"c" command must have 6 values followed!`)
				}
				path.cubicBezierBy(
					values[4],
					values[5],
					values[0],
					values[1],
					values[2],
					values[3]
				)
			}

			else if (command === 'S') {
				if (values.length !== 4) {
					throw new Error(`"S" command must have 4 values followed!`)
				}

				let lastCurve = path.curves[path.curves.length - 1]
				if (!lastCurve || !(lastCurve instanceof CubicBezierCurve)) {
					throw new Error(`"S" command must follow a cubic curve!`)
				}

				let lastRelativeControlPoint2 = Vector.fromDiff(lastCurve.controlPoint2, lastCurve.endPoint)

				path.cubicBezierTo(
					values[2],
					values[3],
					values[2] - lastRelativeControlPoint2.x,
					values[3] - lastRelativeControlPoint2.y,
					values[0],
					values[1]
				)
			}

			else if (command === 's') {
				if (values.length !== 4) {
					throw new Error(`"s" command must have 4 values followed!`)
				}

				let lastCurve = path.curves[path.curves.length - 1]
				if (!lastCurve || !(lastCurve instanceof CubicBezierCurve)) {
					throw new Error(`"S" command must follow a cubic curve!`)
				}

				let lastRelativeControlPoint2 = Vector.fromDiff(lastCurve.controlPoint2, lastCurve.endPoint)

				path.cubicBezierBy(
					values[2],
					values[3],
					-lastRelativeControlPoint2.x,
					-lastRelativeControlPoint2.y,
					values[0],
					values[1]
				)
			}

			else if (command === 'Q') {
				if (values.length !== 4) {
					throw new Error(`"Q" command must have 4 values followed!`)
				}
				path.quadraticBezierTo(
					values[2],
					values[3],
					values[0],
					values[1]
				)
			}

			else if (command === 'q') {
				if (values.length !== 4) {
					throw new Error(`"q" command must have 4 values followed!`)
				}
				path.quadraticBezierBy(
					values[2],
					values[3],
					values[0],
					values[1]
				)
			}

			else if (command === 'T') {
				if (values.length !== 2) {
					throw new Error(`"T" command must have 2 values followed!`)
				}

				let lastCurve = path.curves[path.curves.length - 1]
				if (!lastCurve || !(lastCurve instanceof QuadraticBezierCurve)) {
					throw new Error(`"T" command must follow a quadratic curve!`)
				}

				let lastRelativeControlPoint = Vector.fromDiff(lastCurve.controlPoint, lastCurve.endPoint)

				path.quadraticBezierTo(
					values[0],
					values[1],
					values[0] - lastRelativeControlPoint.x,
					values[1] - lastRelativeControlPoint.y
				)
			}

			else if (command === 't') {
				if (values.length !== 2) {
					throw new Error(`"t" command must have 2 values followed!`)
				}

				let lastCurve = path.curves[path.curves.length - 1]
				if (!lastCurve || !(lastCurve instanceof QuadraticBezierCurve)) {
					throw new Error(`"t" command must follow a quadratic curve!`)
				}

				let lastRelativeControlPoint = Vector.fromDiff(lastCurve.controlPoint, lastCurve.endPoint)

				path.quadraticBezierBy(
					values[0],
					values[1],
					-lastRelativeControlPoint.x,
					-lastRelativeControlPoint.y
				)
			}

			else if (command === 'A') {
				if (values.length !== 7) {
					throw new Error(`"A" command must have 7 values followed!`)
				}

				if (values[0] === values[1]) {
					path.arcTo(
						values[5],
						values[6],
						values[0],
						values[3] as 0 | 1,
						values[4] as 0 | 1,
					)
				}
				else {
					path.ellipseTo(
						values[5],
						values[6],
						values[0],
						values[1],
						values[2],
						values[3] as 0 | 1,
						values[4] as 0 | 1,
					)
				}
			}

			else if (command === 'a') {
				if (values.length !== 7) {
					throw new Error(`"a" command must have 7 values followed!`)
				}

				if (values[0] === values[1]) {
					path.arcBy(
						values[5],
						values[6],
						values[0],
						values[3] as 0 | 1,
						values[4] as 0 | 1,
					)
				}
				else {
					path.ellipseBy(
						values[5],
						values[6],
						values[0],
						values[1],
						values[2],
						values[3] as 0 | 1,
						values[4] as 0 | 1,
					)
				}
			}

			else {
				throw new Error(`"${command}" is not a valid command!`)
			}
		}
		
		return path
	}

	/** Curve list. */
	readonly curves: Curve[] = []

	/** 
	 * Whether path closed.
	 * Readonly outside.
	 */
	closed: boolean = false
	
	/** Start point that move to. */
	private moveToPoint: Point = null as any

	/** Cached accumulative length array. */
	private cachedLengths: number[] | null = null

	/** Cached bounding rect. */
	private cachedBox: Box | null = null

	/** Cached bounding rect. */
	private cachedJson: Readonly<CurveData[]> | null = null

	/** Start point. */
	get startPoint(): Readonly<Point> {
		if (this.curves.length > 0) {
			return this.curves[0].startPoint
		}
		else {
			return this.moveToPoint!
		}
	}

	/** End point. */
	get endPoint(): Readonly<Point> {
		if (this.curves.length > 0) {
			return this.curves[this.curves.length - 1].endPoint
		}
		else {
			return this.startPoint
		}
	}

	private clearCache() {
		this.cachedLengths = null
		this.cachedBox = null
		this.cachedJson = null
	}

	/** Add one curve to the end. */
	addCurve(curve: Curve) {
		this.curves.push(curve)
	}

	/** Add a curve list to the end. */
	addCurves(curves: Curve[]) {

		// use `push(...list)` with list more than 6000 elements
		// will cause Maximum call stack exceed error.
		for (let curve of curves) {
			this.curves.push(curve)
		}

		this.clearCache()
	}

	/** Move to start point. */
	moveTo(x: number, y: number) {
		if (this.curves.length > 0) {
			throw new Error(`Doesn't support multiple "MoveTo" directive, you can only "MoveTo" at beginning!`)
		}

		this.addCurveData({
			type: CurveType.MoveTo,
			x,
			y,
		})
	}

	/** Draw a line to target position. */
	lineTo(x: number, y: number) {
		this.addCurveData({
			type: CurveType.LineTo,
			x,
			y,
		})
	}

	/** Draw a line by a relative position, based on shifting current position. */
	lineBy(dx: number, dy: number) {
		let endPoint = this.endPoint

		this.addCurveData({
			type: CurveType.LineTo,
			x: endPoint.x + dx,
			y: endPoint.y + dy,
		})
	}

	/** Draw a horizontal line to target position. */
	hLineTo(x: number) {
		let endPoint = this.endPoint

		this.addCurveData({
			type: CurveType.LineTo,
			x,
			y: endPoint.y,
		})
	}

	/** Draw a horizontal line by a relative position, based on shifting current position. */
	hLineBy(dx: number) {
		let endPoint = this.endPoint

		this.addCurveData({
			type: CurveType.LineTo,
			x: endPoint.x + dx,
			y: endPoint.y,
		})
	}

	/** Draw a vertical line to target position. */
	vLineTo(y: number) {
		let endPoint = this.endPoint

		this.addCurveData({
			type: CurveType.LineTo,
			x: endPoint.x,
			y,
		})
	}

	/** Draw a vertical line by a relative position, based on shifting current position. */
	vLineBy(dy: number) {
		let endPoint = this.endPoint

		this.addCurveData({
			type: CurveType.LineTo,
			x: endPoint.x,
			y: endPoint.y + dy,
		})
	}

	/** Draw an arc to target position. */
	arcTo(
		x: number,
		y: number,
		r: number,
		largeArcFlag: 0 | 1 = 1,
		clockwiseFlag: 0 | 1 = 1
	) {
		this.addCurveData({
			type: CurveType.ArcTo,
			x,
			y,
			r,
			largeArcFlag,
			clockwiseFlag,
		})
	}

	/** Draw an arc by a relative position, based on shifting current position. */
	arcBy(
		dx: number,
		dy: number,
		r: number,
		largeArcFlag: 0 | 1 = 1,
		clockwiseFlag: 0 | 1 = 1
	) {
		let endPoint = this.endPoint

		this.addCurveData({
			type: CurveType.ArcTo,
			x: endPoint.x + dx,
			y: endPoint.y + dy,
			r,
			largeArcFlag,
			clockwiseFlag,
		})
	}

	/** Draw an ellipse to target position. */
	ellipseTo(
		x: number,
		y: number,
		rx: number,
		ry: number,
		xAxisAngle: number = 0,
		largeArcFlag: 0 | 1 = 1,
		clockwiseFlag: 0 | 1 = 1
	) {
		this.addCurveData({
			type: CurveType.EllipseTo,
			x,
			y,
			rx,
			ry,
			xAxisAngle,
			largeArcFlag,
			clockwiseFlag,
		})
	}

	/** Draw an ellipse by a relative position, based on shifting current position. */
	ellipseBy(
		dx: number,
		dy: number,
		rx: number,
		ry: number,
		xAxisAngle: number = 0,
		largeArcFlag: 0 | 1 = 1,
		clockwiseFlag: 0 | 1 = 1
	) {
		let endPoint = this.endPoint

		this.addCurveData({
			type: CurveType.EllipseTo,
			x: endPoint.x + dx,
			y: endPoint.y + dy,
			rx,
			ry,
			xAxisAngle,
			largeArcFlag,
			clockwiseFlag,
		})
	}

	/** Draw a quadratic bezier to target position. */
	quadraticBezierTo(
		x: number,
		y: number,
		cx: number,
		cy: number
	) {
		this.addCurveData({
			type: CurveType.QuadraticBezierTo,
			x,
			y,
			cx,
			cy,
		})
	}

	/** Draw a quadratic bezier by a relative position, based on shifting current position. */
	quadraticBezierBy(
		dx: number,
		dy: number,
		dcx: number,
		dcy: number
	) {
		let endPoint = this.endPoint
		
		this.addCurveData({
			type: CurveType.QuadraticBezierTo,
			x: dx + endPoint.x,
			y: dy + endPoint.y,
			cx: dcx + endPoint.x,
			cy: dcy + endPoint.y,
		})
	}

	/** Draw a cubic bezier to target position. */
	cubicBezierTo(
		x: number,
		y: number,
		cx1: number,
		cy1: number,
		cx2: number,
		cy2: number
	) {
		this.addCurveData({
			type: CurveType.CubicBezierTo,
			x,
			y,
			cx1,
			cy1,
			cx2,
			cy2,
		})
	}

	/** Draw a cubic bezier by a relative position, based on shifting current position. */
	cubicBezierBy(
		dx: number,
		dy: number,
		dcx1: number,
		dcy1: number,
		dcx2: number,
		dcy2: number
	) {
		let endPoint = this.endPoint

		this.addCurveData({
			type: CurveType.CubicBezierTo,
			x: dx + endPoint.x,
			y: dy + endPoint.y,
			cx1: dcx1 + endPoint.x,
			cy1: dcy1 + endPoint.y,
			cx2: dcx2 + endPoint.x,
			cy2: dcy2 + endPoint.y,
		})
	}

	/** Close current path, add a line from end point to start point. */
	closePath() {
		let startPoint = this.startPoint!
		let endPoint = this.endPoint!

		if (!startPoint.equals(endPoint)) {
			this.curves.push(new LineCurve(endPoint, startPoint))
		}

		this.closed = true
	}

	/** Add a curve data item.  */
	addCurveData(data: CurveData) {
		if (data.type === CurveType.MoveTo) {
			let {x, y} = data
			this.moveToPoint = new Point(x, y)
		}

		else if (data.type === CurveType.LineTo) {
			let {x, y} = data

			this.addCurve(new LineCurve(
				this.endPoint,
				new Point(x, y)
			))
		}

		else if (data.type === CurveType.ArcTo) {
			let {x, y, r, largeArcFlag, clockwiseFlag} = data

			this.addCurve(new ArcCurve(
				this.endPoint,
				new Point(x, y),
				r,
				largeArcFlag,
				clockwiseFlag
			))
		}

		else if (data.type === CurveType.EllipseTo) {
			let {x, y, rx, ry, xAxisAngle, largeArcFlag, clockwiseFlag} = data

			this.addCurve(new EllipseCurve(
				this.endPoint,
				new Point(x, y),
				new Vector(rx, ry),
				xAxisAngle,
				largeArcFlag,
				clockwiseFlag
			))
		}

		else if (data.type === CurveType.QuadraticBezierTo) {
			let {cx, cy, x, y} = data

			this.addCurve(new QuadraticBezierCurve(
				this.endPoint,
				new Point(x, y),
				new Point(cx, cy),
			))
		}

		else if (data.type === CurveType.CubicBezierTo) {
			let {cx1, cy1, cx2, cy2, x, y} = data

			this.addCurve(new CubicBezierCurve(
				this.endPoint,
				new Point(x, y),
				new Point(cx1, cy1),
				new Point(cx2, cy2)
			))
		}

		this.clearCache()
	}

	/** Add a list of curve data. */
	addCurveDataList(dataList: CurveData[]) {

		// use `push(...list)` with list more than 6000 elements
		// will cause Maximum call stack exceed error.
		for (let data of dataList) {
			this.addCurveData(data)
		}

		this.clearCache()
	}

	/**
	 * Get an accumulated arc length list.
	 * It's list length is `curves.length` and is cacheable.
	 */
	getLengths(): number[] {
		if (this.cachedLengths) {
			return this.cachedLengths
		}

		let lengths: number[] = []
		let currentLength = 0

		for (let curve of this.curves) {
			currentLength += curve.getLength()
			lengths.push(currentLength)
		}

		return this.cachedLengths = lengths
	}

	/** 
	 * Get total curve arc length.
	 * This is not a accurate result, but normally no hurt. 
	 */
	getLength(): number {
		let lengths = this.getLengths()
		return lengths[lengths.length - 1]
	}

	/** Map it's global arc length rate parameter `u` to global generating parameter `t`. */
	mapU2T(globalU: number): number {
		let {i, l: t} = this.mapGlobalToLocal(globalU)
		return (i + t) / this.curves.length
	}

	/** 
	 * Map a global parameter `u/t` to curve index and a local `u/t` parameter,
	 * according to comparing curve arc length.
	 */
	mapGlobalToLocal(globalV: number): {i: number, l: number} {
		let il = IntegralLookup.lookupXRateByYRate(globalV, this.getLengths()) * this.curves.length
		let i = Math.min(Math.floor(il), this.curves.length - 1)
		let l = il - i

		return {i, l}
	}

	/** 
	 * Map a curve index and associated local parameter `u/t`
	 * to global `u/t` parameter, according to comparing curve arc length.
	 */
	mapLocalToGlobal(curveIndex: number, curveT: number): number {
		let lengths = this.getLengths()
		let startLength = curveIndex === 0 ? 0 : lengths[curveIndex - 1]
		let endLength = lengths[curveIndex]

		return MathUtils.mix(startLength, endLength, curveT) / this.getLength()
	}
	
	/** Get point by global generating parameter `t` betweens 0~1. */
	pointAt(globalT: number): Point {
		let {i, l: t} = this.mapGlobalToLocal(globalT)
		return this.curves[i].pointAt(t)
	}

	/** Get point at arc length percentage, `u` betweens 0~1. */
	spacedPointAt(globalU: number): Point {
		let {i, l: u} = this.mapGlobalToLocal(globalU)
		return this.curves[i].spacedPointAt(u)
	}

	/** Get generating parameter `t` at specified arc length. */
	tAtLength(length: number): number {
		let totalLength = this.getLength()
		let u = length / totalLength

		return this.mapU2T(u)
	}

	/** Get point at specified arc length. */
	pointAtLength(length: number): Point {
		let totalLength = this.getLength()
		let u = length / totalLength

		return this.spacedPointAt(u)
	}

	/** 
	 * Get a sequence of points based on divisions of equal-distanced `t`.
	 * Note when `divisions` specified, it returns the default values from `getPoints`.
	 * Otherwise it returns points by a global division.
	 */
	getPoints(divisions?: number): Readonly<Point>[] {
		let points: Point[] = []
		
		if (divisions) {
			for (let d = 0; d <= divisions; d++) {
				points.push(this.pointAt(d / divisions))
			}
		}
		else {
			for (let curve of this.curves) {
				points.push(...curve.getPoints())
			}
		}

		return points
	}

	/** 
	 * Get a sequence of points based on divisions of equal-arc length `u`.
	 * Note when `divisions` specified, it returns the default values from `getPoints`.
	 * Otherwise it returns points by a global division.
	 */
	getSpacedPoints(divisions?: number): Readonly<Point>[] {
		let points: Point[] = []
		
		if (divisions) {
			for (let d = 0; d <= divisions; d++) {
				points.push(this.spacedPointAt(d / divisions))
			}
		}
		else {
			for (let curve of this.curves) {
				points.push(...curve.getSpacedPoints())
			}
		}

		return points
	}

	/** 
	 * Get a sequence of points based on divisions of equal-curvature value `e`.
	 * The bigger the curvature is, the more divisions to make.
	 */
	getEqualCurvaturePoints(segmentLengthCurvature?: number, scaling?: number): Readonly<Point>[] {
		if (this.curves.length === 0) {
			return []
		}

		let points: Point[] = this.curves[0].getCurvatureAdaptivePoints(segmentLengthCurvature, scaling)

		for (let i = 1; i < this.curves.length; i++) {
			let curve = this.curves[i]
			let curvePoints = curve.getCurvatureAdaptivePoints(segmentLengthCurvature, scaling)

			for (let j = 0; i < curvePoints.length; j++) {
				let p = curvePoints[j]

				// Skip first point.
				if (j === 0) {
					continue
				}

				points.push(p)
			}
		}

		return points
	}

	/** 
	 * Get tangent vector by generating parameter `t`.
	 * The returned vector length also represent the changing speed of curve point based on t.
	 */
	tangentAt(globalT: number): Vector {
		let {i, l: t} = this.mapGlobalToLocal(globalT)
		return this.curves[i].tangentAt(t)
	}

	/** 
	 * Get unit normal vector by generating parameter `t`.
	 * Normal vector direction is always equals tangent vector rotate 90° clockwise.
	 */
	normalAt(globalT: number, clockwiseFlag: 0 | 1): Vector {
		let {i, l: t} = this.mapGlobalToLocal(globalT)
		return this.curves[i].normalAt(t, clockwiseFlag)
	}

	/** Get curvature, which means `1 / Curvature Radius`. */
	curvatureAt(globalT: number) {
		let {i, l: t} = this.mapGlobalToLocal(globalT)
		return this.curves[i].curvatureAt(t)
	}

	/** 
	 * Get bounding rect of the curve - a rect box.
	 * Note its not affected by outer transform and stroking width.
	 */
	getBox(): Readonly<Box> | null {
		if (this.cachedBox) {
			return this.cachedBox
		}

		if (this.curves.length === 0) {
			return null
		}

		let box = Box.empty()

		for (let i = 0; i < this.curves.length; i++) {
			let curve = this.curves[i]
			box.unionSelf(curve.getBox())
		}

		return this.cachedBox = box!
	}

	/** Get partial curve by start and end generating parameters `t`. */
	partOf(startT: number, endT: number): CurvePath {
		let start = this.mapGlobalToLocal(startT)
		let end = this.mapGlobalToLocal(endT)
		let willClose = startT <= 0 && endT >= 1 && this.closed
		let path = new CurvePath()

		if (start.i === end.i) {
			path.addCurve(this.curves[start.i].partOf(start.l, end.l))
		}
		else {
			path.addCurve(this.curves[start.i].partOf(start.l, 1))
		}

		for (let i = start.i + 1; i < end.i; i++) {
			path.addCurve(this.curves[i])
		}

		if (start.i != end.i) {
			path.addCurve(this.curves[end.i].partOf(0, end.l))
		}

		if (willClose) {
			path.closePath()
		}

		return path
	}

	/** Execute a transform and get a new curve path. */
	transform(matrix: Matrix): CurvePath {
		let curves = this.curves.map(c => c.transform(matrix))
		let path = new CurvePath()
		path.addCurves(curves)

		return path
	}

	/** Convert all curves to cubic bezier curves. */
	toCubicBezierCurvePath(): CurvePath {
		let curves = this.curves.map(curve => curve.toCubicBezierCurves()).flat()
		return CurvePath.fromCurves(curves, this.closed)!
	}

	/** Whether equals another curve path. */
	equals(curvePath: CurvePath): boolean {
		if (this.curves.length !== curvePath.curves.length) {
			return false
		}

		for (let i = 0; i < this.curves.length; i++) {

			// Must be same type curves.
			if (this.curves[i].constructor !== curvePath.curves[i].constructor) {
				return false
			}

			if (!this.curves[i].equals(curvePath.curves[i])) {
				return false
			}
		}

		return true
	}

	/** Make a mixer to mix from current curve to target. */
	makeMixer(to: CurvePath): (rate: number) => CurvePath {
		let mixer = new CurvePathMixer(this, to)

		return function(rate: number) {
			return mixer.mix(rate)
		}
	}

	/** Export as standardized JSON data. */
	toJSON(): Readonly<CurveData[]> {
		if (this.cachedJson) {
			return this.cachedJson
		}

		let pathData: CurveData[] = []
		let startPoint = this.startPoint

		if (!startPoint) {
			return pathData
		}

		pathData.push({
			type: CurveType.MoveTo,
			x: startPoint.x,
			y: startPoint.y,
		})

		for (let curve of this.curves) {
			pathData.push(curve.toJSON())
		}

		if (this.closed) {
			pathData.push({
				type: CurveType.Close,
			})
		}

		return this.cachedJson = pathData
	}

	/** Get the closest point in the curve path, to specified point. */
	closestPointTo(point: Point): Point {
		let distance = Infinity
		let closestPoint: Point

		for (let curve of this.curves) {
			let curveClosestPoint = curve.closestPointTo(point)
			let pointDistance = Vector.fromDiff(curveClosestPoint, point).getLength()

			if (pointDistance < distance) {
				distance = pointDistance
				closestPoint = curveClosestPoint
			}
		}

		return closestPoint!
	}

	/** Know X value, calc generating parameter `t`. */
	calcTsByX(x: number): number[] {
		let ts: number[] = []

		for (let i = 0; i < this.curves.length; i++) {
			let curve = this.curves[i]
			let curveTs = curve.calcTsByX(x)

			ts.push(...curveTs.map(t => this.mapLocalToGlobal(i, t)))
		}

		return ts
	}

	/** Know Y value, calc generating parameter `t`. */
	calcTsByY(y: number): number[] {
		let ts: number[] = []

		for (let i = 0; i < this.curves.length; i++) {
			let curve = this.curves[i]
			let curveTs = curve.calcTsByY(y)
			
			ts.push(...curveTs.map(t => this.mapLocalToGlobal(i, t)))
		}

		return ts
	}

	/** 
	 * Check whether a point inside the shape consist of points.
	 * Default value of `fillRule` is `nonzero`.
	 */
	isPointInside(point: Point, fillRule: 'nonzero' | 'evenodd' = 'nonzero'): boolean {
		if (!this.closed) {
			return false
		}

		if (!this.getBox()?.containsPoint(point)) {
			return false
		}

		let intersectionCount = this.getRadialLineIntersectionCount(point)
		return this.getInsideFromIntersectionCount(intersectionCount, fillRule)
	}

	/** Check the intersection count that a radial line point to right with current curve path. */
	private getRadialLineIntersectionCount(point: Point): number {

		// Make a radial line point to right, record it's intersection count with line segments.
		let radialLineIntersectionCount = 0

		for (let curve of this.curves) {
			let box = curve.getBox()

			// Not intersected after project to Y axis.
			if (box.y > point.y || box.bottom < point.y) {
				continue
			}

			let ts = curve.calcTsByY(point.y)

			for (let t of ts) {
				if (curve.pointAt(t).x >= point.x) {
					radialLineIntersectionCount++
				}
			}
		}

		return radialLineIntersectionCount
	}

	/** Get whether inside curve path by radial line intersection count. */
	private getInsideFromIntersectionCount(intersectionCount: number, fillRule: 'nonzero' | 'evenodd'): boolean {
		if (fillRule === 'nonzero') {
			return intersectionCount > 0
		}
		else {
			return intersectionCount % 2 === 1
		}
	}

	/** 
	 * Check whether a point inside the stroke.
	 * Note it ignores stroke cap or stroke line join style,
	 * equals always choose rounded line cap/join style.
	 */
	isPointInStroke(point: Point, strokeWidth: number): boolean {
		let halfStrokeWidth = strokeWidth / 2

		if (!this.getBox()?.containsPointAfterExpanded(point, halfStrokeWidth)) {
			return false
		}

		for (let curve of this.curves) {
			if (!curve.getBox()?.containsPointAfterExpanded(point, halfStrokeWidth)) {
				continue
			}

			let closestPoint = curve.closestPointTo(point)
			if (Vector.fromDiff(closestPoint, point).getLength() <= halfStrokeWidth) {
				return true
			}
		}

		return false
	}

	/** 
	 * Get the distance from a point to curve path.
	 * Returns negative value if point inside fill area of curve path.
	 */
	getDistance(point: Point, strokeWidth: number, filled: boolean, fillRule: 'nonzero' | 'evenodd' = 'nonzero'): number {
		let willFill = this.closed && filled
		let willStroke = strokeWidth > 0
		let halfStrokeWidth = strokeWidth / 2
		let distance = Infinity
		let intersectionCount = willFill ? this.getRadialLineIntersectionCount(point) : 0
		let inside = willFill ? this.getInsideFromIntersectionCount(intersectionCount, fillRule) : false
		let intersectionFlag = intersectionCount % 2 === 0 ? -1 : 1

		for (let curve of this.curves) {
			if (!curve.getBox()?.containsPointAfterExpanded(point, halfStrokeWidth)) {
				continue
			}

			let closestPoint = curve.closestPointTo(point)
			let pointDistance = Vector.fromDiff(closestPoint, point).getLength()

			// Compare with outer stroke edge.
			if (willFill) {
				let distanceToOuterStrokeEdge = pointDistance + halfStrokeWidth * intersectionFlag
				distance = Math.min(distance, Math.abs(distanceToOuterStrokeEdge))
			}

			// Compare with stroke edge center.
			if (willStroke) {
				let distanceToStrokeEdge = pointDistance - halfStrokeWidth
				inside = inside || distanceToStrokeEdge < 0
				distance = Math.min(distance, Math.abs(distanceToStrokeEdge))
			}
		}

		return inside ? -distance : distance
	}

	/** Convert to svg path d property. */
	toSVGPathD(): string {
		return makeSVGPathD(this.toJSON())
	}
}