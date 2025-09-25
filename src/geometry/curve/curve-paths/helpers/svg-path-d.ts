import {NumberUtils} from '@pucelle/ff'
import {CurveData, CurveType} from '../../types'


export interface SVGPathDItem {
	command: string
	values: number[]
}


/** Parse a SVG path "d" attribute. */
export function *parseSVGPathD(d: string): Iterable<SVGPathDItem> {
	let re = /[a-zA-Z]|-?\d+(?:\.\d+)?/g
	let match: RegExpExecArray | null = null
	let item: SVGPathDItem | null = null

	while (match = re.exec(d)) {
		let chars = match[0]

		if (/^[a-zA-Z]/.test(chars)) {
			if (item) {
				yield item
			}

			item = {command: chars, values: []}
		}
		else if (item) {
			item.values.push(Number(chars))
		}
	}
	
	if (item) {
		yield item
	}
}



/** Make svg <path> "d" attribute. */
export function makeSVGPathD(curveData: Readonly<CurveData[]>): string {
	let d: string = ''

	for (let piece of curveData) {
		d += makeSVGPathPiece(piece)
	}

	return d
}


function makeSVGPathPiece(piece: CurveData): string {
	if (piece.type === CurveType.MoveTo) {
		let x = NumberUtils.toDecimal(piece.x, 4)
		let y = NumberUtils.toDecimal(piece.y, 4)

		return `M${x} ${y}`
	}
	else if (piece.type === CurveType.ArcTo) {
		let {r, largeArcFlag, clockwiseFlag} = piece
		let x = NumberUtils.toDecimal(piece.x, 4)
		let y = NumberUtils.toDecimal(piece.y, 4)

		return `A${r} ${r} 0 ${largeArcFlag} ${clockwiseFlag} ${x} ${y}`
	}
	else if (piece.type === CurveType.EllipseTo) {
		let {rx, ry, largeArcFlag, clockwiseFlag} = piece
		let x = NumberUtils.toDecimal(piece.x, 4)
		let y = NumberUtils.toDecimal(piece.y, 4)

		return `A${rx} ${ry} 0 ${largeArcFlag} ${clockwiseFlag} ${x} ${y}`
	}
	else if (piece.type === CurveType.CubicBezierTo) {
		let cx1 = NumberUtils.toDecimal(piece.cx1, 4)
		let cy1 = NumberUtils.toDecimal(piece.cy1, 4)
		let cx2 = NumberUtils.toDecimal(piece.cx2, 4)
		let cy2 = NumberUtils.toDecimal(piece.cy2, 4)
		let x = NumberUtils.toDecimal(piece.x, 4)
		let y = NumberUtils.toDecimal(piece.y, 4)

		return `C${cx1} ${cy1} ${cx2} ${cy2} ${x} ${y}`
	}
	else if (piece.type === CurveType.LineTo) {
		let x = NumberUtils.toDecimal(piece.x, 4)
		let y = NumberUtils.toDecimal(piece.y, 4)

		return `L${x} ${y}`
	}
	else if (piece.type === CurveType.QuadraticBezierTo) {
		let cx = NumberUtils.toDecimal(piece.cx, 4)
		let cy = NumberUtils.toDecimal(piece.cy, 4)
		let x = NumberUtils.toDecimal(piece.x, 4)
		let y = NumberUtils.toDecimal(piece.y, 4)

		return `Q${cx} ${cy} ${x} ${y}`
	}
	else {
		return `Z`
	}
}
