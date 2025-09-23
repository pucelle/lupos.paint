import {LineIntersection, Point, RadialLine, Vector} from '@pucelle/ff'


/** 
 * Have two line segments, make them connect from tail to head.
 * This is a progressive optimality algorithm, complexity is O(m+n),
 * not global intersection query.
 */
export function connectTwoLineSegments(segments1: Point[], segments2: Point[]) {
	let radial1 = makeRadial(segments1, segments1.length - 1, 1)
	let radial2 = makeRadial(segments2, 0, -1)

	// Intersected.
	let intersection = radial1.intersect(radial2)
	if (intersection && intersection.intersected) {
		return {
			list1: segments1,
			list2: segments2,
			point: intersection.point,
		}
	}

	// parallel.
	if (!intersection) {
		return {
			list1: segments1,
			list2: segments2,
			point: null,
		}
	}

	let {index1, index2, point: intersectedPoint} = progressiveQueryIntersection(segments1, segments2, radial1, radial2, intersection)
	if (intersectedPoint) {
		return {
			list1: segments1.slice(0, index1 + 1),
			list2: segments2.slice(index2),
			point: intersectedPoint,
		}
	}
	else {
		return {
			list1: segments1.slice(0, index1 + 1),
			list2: segments2.slice(index2),
			point: null,
		}
	}
}


/** 
 * Make radial line from point at index, and it's neighbor.
 * direction decided the vector direction, `-1` means from lower to upper .
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
) {
	let index1 = segments1.length - 1
	let index2 = 0
	let intersectedPoint: Point | null = null

	while (true) {

		// Move first backward.
		if (intersection.miu < intersection.niu) {
			index1--

			if (index1 === 0) {
				break
			}

			radial1 = makeRadial(segments1, index1, 1)
		}

		// Move second forward.
		else {
			index2++

			if (index2 === segments2.length - 1) {
				break
			}

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

	return {
		index1,
		index2,
		point: intersectedPoint,
	}
}


/**
 * Because of not enough curvature radius,
 * line segments may intersect with itself.
 * Here we tie these points into one by removing the intersected part.
 */
export function tieEdgeMessesKnot(sidePoints: Point[], centralPoints: Point[]): Point[] {
	let startCropIndex = getTieEdgeMessesKnotIndex(sidePoints, centralPoints, 1)
	let endCropIndex = getTieEdgeMessesKnotIndex(sidePoints, centralPoints, -1)

	if (startCropIndex === 0 && endCropIndex === 0) {
		return sidePoints
	}
	else {
		return sidePoints.slice(startCropIndex, -endCropIndex)
	}
}


/** The result index is `0` if not cropping. */
function getTieEdgeMessesKnotIndex(sidePoints: Point[], centralPoints: Point[], direction: 1 | -1): number {
	let cropIndex = 0

	for (let i = 0; i < sidePoints.length; i++) {
		let index = direction === 1 ? i : sidePoints.length - 1 - i
		let sideTangent = makeNormalTangent(sidePoints, index, direction)
		let tangent = makeNormalTangent(centralPoints, index, direction)
		
		// Two tangents have different direction.
		if (sideTangent.dot(tangent) < 0) {
			cropIndex = i + 1
			break
		}
		else {
			break
		}
	}

	return cropIndex
}