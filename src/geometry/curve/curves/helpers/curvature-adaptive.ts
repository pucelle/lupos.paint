export function getCurvatureAdaptiveDivisions(averageCurvatureSqrt: number, length: number, maxPixelDiff: number, scaling: number) {
	// Let R be radius, C = 1/R, Arc is Arc Length after subdivision
	// MaxPixelDiff
	// 		= R * (1 - cos(Arc / R / 2))
	// 		≈ R * (Arc / R / 2)^2 / 2
	// 		= Arc^2 / 8R

	// Normally we want it < MaxPixelDiff, so:
	// Arc^2 / 8R < MaxPixelDiff
	// Arc < (MaxPixelDiff * 8R)^0.5

	// TotalArcLength = ∫dArc
	// 		= ∫(MaxPixelDiff * 8R)^0.5
	// 		= (8 * MaxPixelDiff)^0.5 * Average(R^0.5) * DivisionCount

	// DivisionCount = TotalArcLength / Average((MaxPixelDiff * 8R)^0.5)
	// 		≈ TotalArcLength / (MaxPixelDiff * 8)^0.5) * Average(C^0.5)
	// Which also means when scaling for S, DivisionCount increased by S^0.5

	return length / Math.sqrt(8 * maxPixelDiff) * averageCurvatureSqrt * Math.sqrt(scaling)
}