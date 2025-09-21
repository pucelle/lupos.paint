
/** Data of single curve segment, several segments compose a path. */
export type CurveData = MoveData | LineData | ArcData | EllipseData | QuadraticBezierData | CubicBezierData | CloseData

/** Path segment type. */
export enum CurveType {
	MoveTo = 0,
	LineTo = 1,
	ArcTo = 2,
	EllipseTo = 3,
	QuadraticBezierTo = 4,
	CubicBezierTo = 5,
	Close = 6,
}

export interface MoveData {
	type: CurveType.MoveTo
	x: number
	y: number
}

export interface LineData {
	type: CurveType.LineTo
	x: number
	y: number
}

export interface ArcData {
	type: CurveType.ArcTo
	
	/** Radius. */
	r: number

	/** 
	 * Coord of center point.
	 * Available in output JSON data.
	 */
	cx?: number
	cy?: number

	/** Coord of end point. */
	x: number
	y: number

	/** 
	 * Start and end angle.
	 * Available in output JSON data.
	 */
	startAngle?: number
	endAngle?: number

	/** Whether draw a large arc with angle > 180. */
	largeArcFlag: 0 | 1

	/** Whether connect start and end points in clockwise direction. */
	clockwiseFlag: 0 | 1
}

export interface EllipseData {
	type: CurveType.EllipseTo

	/** Coord of end point. */
	x: number
	y: number
	
	/** 
	 * Coord of center point.
	 * Available in output JSON data.
	 */
	cx?: number
	cy?: number

	/** Coord of ellipse center. */
	rx: number
	ry: number
	
	/** 
	 * Start and end angle.
	 * Available in output JSON data.
	 */
	startAngle?: number
	endAngle?: number

	/** Means x axis rotation in clockwise direction. */
	xAxisAngle: number

	/** Whether draw a large arc with angle > 180. */
	largeArcFlag: 0 | 1

	/** Whether connect start and end points in clockwise direction. */
	clockwiseFlag: 0 | 1
}

export interface QuadraticBezierData {
	type: CurveType.QuadraticBezierTo

	/** Coord of end point. */
	x: number
	y: number

	/** Coord of control point. */
	cx: number
	cy: number
}

export interface CubicBezierData {
	type: CurveType.CubicBezierTo

	/** Coord of end point. */
	x: number
	y: number

	/** Coord of control point 1. */
	cx1: number
	cy1: number

	/** Coord of control point 2. */
	cx2: number
	cy2: number
}

export interface CloseData {
	type: CurveType.Close
}
