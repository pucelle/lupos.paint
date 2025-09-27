import {LineIntersection, Point, RadialLine, Vector} from '@pucelle/ff'


interface LineSegmentsConnectResult {
	radial1: RadialLine
	radial2: RadialLine
	indexRange1: [number, number] | null
	indexRange2: [number, number] | null
	point: Point
	outerIntersected: boolean
}


/** 
 * Have two line segments, make them connect from tail to head.
 * This is a progressive optimality algorithm, complexity is O(m+n),
 * not global intersection query.
 * Will modify both segments.
 */
export function connectTwoLineSegments(segments1: Point[], segments2: Point[]): LineSegmentsConnectResult | null {
	let radial1 = makeRadial(segments1, segments1.length - 1, 1)
	let radial2 = makeRadial(segments2, 0, -1)
	let intersection = radial1.intersect(radial2)
	
	// Parallel.
	if (!intersection) {
		return null
	}

	// Have intersected after extended both.
	if (intersection.intersected) {
		return {
			radial1,
			radial2,
			indexRange1: null,
			indexRange2: null,
			point: intersection.point,
			outerIntersected: true,
		}
	}

	// Have intersection, but need to shrink.
	return progressiveQueryIntersection(segments1, segments2, radial1, radial2, intersection)
}


/** 
 * Make radial line from point at index, and it's neighbor.
 * direction decided the vector direction, `-1` means from lower to upper.
 * Radial vector has been normalized.
 */
export function makeRadial(points: Point[], index: number, direction: 1 | -1): RadialLine {
	let tangent = makeNormalTangent(points, index, direction)
	let point = points[index]

	return new RadialLine(point, tangent)
}


/** 
 * Make tangent vector from point at index, and it's neighbor.
 * direction decided the vector direction, `-1` means from lower to upper .
 */
export function makeNormalTangent(points: Point[], index: number, direction: 1 | -1): Vector {
	let tangent: Vector

	if (direction === 1) {
		if (index + 1 < points.length) {
			tangent = Vector.fromDiff(points[index + 1], points[index])
		}
		else {
			tangent = Vector.fromDiff(points[index], points[index - 1])
		}
	}
	else {
		if (index > 0) {
			tangent = Vector.fromDiff(points[index - 1], points[index])
		}
		else {
			tangent = Vector.fromDiff(points[index], points[index + 1])
		}
	}

	return tangent.normalizeSelf()
}


/** 
 * For two line segment list, compare their points and tangents.
 * If pop points from `segments1`, and shift points from `segments2` can make the rest segments intersected,
 * Then do this, and combine rest points and the intersected point to a new segments.
 */
function progressiveQueryIntersection(
	segments1: Point[],
	segments2: Point[],
	radial1: RadialLine,
	radial2: RadialLine,
	intersection: LineIntersection
): LineSegmentsConnectResult {
	let index1 = segments1.length - 1
	let index2 = 0
	let intersectedPoint = intersection.point

	while (true) {

		// Move first backward.
		if (intersection.miu < 0) {
			index1--
			radial1 = makeRadial(segments1, index1, 1)
		}

		// Move second forward.
		if (intersection.niu < 0) {
			index2++
			radial2 = makeRadial(segments2, index2, -1)
		}

		let nextIntersection = radial1.intersect(radial2)

		// parallel.
		if (!nextIntersection) {
			break
		}

		if (nextIntersection.intersected) {
			intersectedPoint = nextIntersection.point
			break
		}
		
		intersection = nextIntersection
	}

	let indexRange1: [number, number] | null = index1 < segments1.length - 2 ? [0, index1 + 2] : null
	let indexRange2: [number, number] | null = index2 > 1 ? [0, index2 - 1] : null

	return {
		radial1,
		radial2,
		indexRange1,
		indexRange2,
		point: intersectedPoint,
		outerIntersected: false,
	}
}