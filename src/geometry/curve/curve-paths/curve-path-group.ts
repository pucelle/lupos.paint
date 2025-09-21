import {Box, Matrix, Point} from '@pucelle/ff'
import {CurveData, CurveType} from '../types'
import {CurvePath} from './curve-path'


/** 
 * Represent a group of curve paths, which may not connect head to tail.
 * This is just a convenient API for containing several not continuous curves inside one object,
 * e.g., can output them into a single svg <path>.
 */
export class CurvePathGroup {
	
	/** Make a path from curve data list. */
	static fromCurveData(dataList: CurveData[]): CurvePathGroup | null {
		if (dataList.length === 0) {
			return null
		}

		if (dataList[0].type !== CurveType.MoveTo) {
			throw new Error(`Curve data must start with a "MoveTo"!`)
		}

		let path = new CurvePathGroup()

		for (let i = 0; i < dataList.length; i++) {
			let data = dataList[i]
			path.addCurveData(data)
		}

		return path
	}

	/** Make a path from a curve path list. */
	static fromCurvePaths(curvePathList: CurvePath[], closeIt: boolean = false): CurvePathGroup | null {
		if (curvePathList.length === 0) {
			return null
		}

		let path = new CurvePathGroup()
		path.addCurvePaths(curvePathList)

		if (closeIt) {
			path.closePath()
		}

		return path
	}


	/** Curve path list. */
	readonly curvePaths: CurvePath[] = []

	/** Cached bounding rect. */
	private cachedBoundingBox: Box | null = null
	
	/** Start point. */
	get startPoint(): Readonly<Point> {
		if (this.curvePaths.length > 0) {
			return this.curvePaths[this.curvePaths.length - 1].endPoint
		}
		else {
			throw new Error(`No start point yet!`)
		}
	}

	/** End point. */
	get endPoint(): Readonly<Point> {
		if (this.curvePaths.length > 0) {
			return this.curvePaths[this.curvePaths.length - 1].endPoint
		}
		else {
			return this.startPoint
		}
	}

	private clearCache() {
		this.cachedBoundingBox = null
	}

	/** Add one curve path to the end. */
	addCurvePath(path: CurvePath) {
		this.curvePaths.push(path)
		this.clearCache()
	}

	/** Add a curve path list to the end. */
	addCurvePaths(paths: CurvePath[]) {

		// Note using `push(...list)` with list having more than 6000 elements
		// will cause Maximum call stack exceed error.
		for (let path of paths) {
			this.curvePaths.push(path)
		}

		this.clearCache()
	}

	/** Get last curve path */
	private getEndCurvePath() {
		if (this.curvePaths.length === 0) {
			throw new Error(`Must have a curve path firstly!`)
		}

		return this.curvePaths[this.curvePaths.length - 1]
	}

	/** Same as canvas API `moveTo`, but can only appear for once. */
	moveTo(x: number, y: number) {
		let path = new CurvePath()

		path.addCurveData({
			type: CurveType.MoveTo,
			x,
			y,
		})

		this.addCurvePath(path)
	}

	/** Draw a line to target position. */
	lineTo(x: number, y: number) {
		let path = this.getEndCurvePath()
		path.lineTo(x, y)
		this.clearCache()
	}

	/** Draw a line by a relative position, based on shifting current position. */
	lineBy(dx: number, dy: number) {
		let path = this.getEndCurvePath()
		path.lineBy(dx, dy)
		this.clearCache()
	}

	/** Draw a horizontal line to target position. */
	hLineTo(x: number) {
		let path = this.getEndCurvePath()
		path.hLineTo(x)
		this.clearCache()
	}

	/** Draw a horizontal line by a relative position, based on shifting current position. */
	hLineBy(dx: number) {
		let path = this.getEndCurvePath()
		path.hLineTo(dx)
		this.clearCache()
	}

	/** Draw a vertical line to target position. */
	vLineTo(y: number) {
		let path = this.getEndCurvePath()
		path.vLineTo(y)
		this.clearCache()
	}

	/** Draw a vertical line by a relative position, based on shifting current position. */
	vLineBy(dy: number) {
		let path = this.getEndCurvePath()
		path.vLineBy(dy)
		this.clearCache()
	}

	/** Draw an arc to target position. */
	arcTo(
		x: number,
		y: number,
		r: number,
		largeArcFlag: 0 | 1,
		clockwiseFlag: 0 | 1
	) {
		let path = this.getEndCurvePath()
		path.arcTo(x, y, r, largeArcFlag, clockwiseFlag)
		this.clearCache()
	}

	/** Draw an arc by a relative position, based on shifting current position. */
	arcBy(
		dx: number,
		dy: number,
		r: number,
		largeArcFlag: 0 | 1,
		clockwiseFlag: 0 | 1
	) {
		let path = this.getEndCurvePath()
		path.arcTo(dx, dy, r, largeArcFlag, clockwiseFlag)
		this.clearCache()
	}

	/** Draw an ellipse to target position. */
	ellipseTo(
		x: number,
		y: number,
		rx: number,
		ry: number,
		xAxisAngle: number,
		largeArcFlag: 0 | 1,
		clockwiseFlag: 0 | 1
	) {
		let path = this.getEndCurvePath()
		path.ellipseTo(x, y, rx, ry, xAxisAngle, largeArcFlag, clockwiseFlag)
		this.clearCache()
	}

	/** Draw an ellipse by a relative position, based on shifting current position. */
	ellipseBy(
		dx: number,
		dy: number,
		rx: number,
		ry: number,
		xAxisAngle: number,
		largeArcFlag: 0 | 1,
		clockwiseFlag: 0 | 1
	) {
		let path = this.getEndCurvePath()
		path.ellipseBy(dx, dy, rx, ry, xAxisAngle, largeArcFlag, clockwiseFlag)
		this.clearCache()
	}

	/** Draw a quadratic bezier to target position. */
	quadraticBezierTo(
		x: number,
		y: number,
		cx: number,
		cy: number
	) {
		let path = this.getEndCurvePath()
		path.quadraticBezierTo(x, y, cx, cy)
		this.clearCache()
	}

	/** Draw a quadratic bezier by a relative position, based on shifting current position. */
	quadraticBezierBy(
		dx: number,
		dy: number,
		dcx: number,
		dcy: number
	) {
		let path = this.getEndCurvePath()
		path.quadraticBezierTo(dx, dy, dcx, dcy)
		this.clearCache()
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
		let path = this.getEndCurvePath()
		path.cubicBezierTo(x, y, cx1, cy1, cx2, cy2)
		this.clearCache()
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
		let path = this.getEndCurvePath()
		path.cubicBezierBy(dx, dy, dcx1, dcy1, dcx2, dcy2)
		this.clearCache()
	}

	/** Close current path, add a line from end point to start point. */
	closePath() {
		let path = this.getEndCurvePath()
		path.closePath()
	}

	/** Add a curve data item.  */
	addCurveData(data: CurveData) {
		let path = this.getEndCurvePath()
		path.addCurveData(data)
		this.clearCache()
	}

	/** Add a list of curve data. */
	addCurveDataList(dataList: CurveData[]) {
		let path = this.getEndCurvePath()
		path.addCurveDataList(dataList)
		this.clearCache()
	}

	/** Get bounding rect of the curve - a rect box. */
	getBoundingBox(): Box | null {
		if (this.cachedBoundingBox) {
			return this.cachedBoundingBox
		}

		if (this.curvePaths.length === 0) {
			return null
		}

		let box = Box.empty()

		for (let i = 1; i < this.curvePaths.length; i++) {
			let path = this.curvePaths[i]
			box.unionSelf(path.getBox()!)
		}

		return this.cachedBoundingBox = box!
	}

	/** Execute a transform and get a new path. */
	transform(matrix: Matrix): CurvePathGroup | null {
		let paths = this.curvePaths.map(c => c.transform(matrix))
		let path = new CurvePathGroup()
		path.addCurvePaths(paths)

		return path
	}

	/** Export as standardized JSON data. */
	toJSON(): CurveData[] {
		let pathData: CurveData[] = []

		for (let path of this.curvePaths) {
			pathData.push(...path.toJSON())
		}

		return pathData
	}

	/** 
	 * Check whether a point inside current path group.
	 * Default value of `fillRule` is `nonzero`.
	 */
	isPointInside(point: Point, fillRule: 'nonzero' | 'evenodd' = 'nonzero'): boolean {
		for (let path of this.curvePaths) {
			if (path.isPointInside(point, fillRule)) {
				return true
			}
		}

		return false
	}

	/** 
	 * Check whether a point inside the stroke.
	 * Note it ignores stroke cap or stroke line join style.
	 */
	isPointInStroke(point: Point, strokeWidth: number): boolean {
		for (let path of this.curvePaths) {
			if (path.isPointInStroke(point, strokeWidth)) {
				return true
			}
		}

		return false
	}
}