# lupos.paint - still under design

**lupos.paint** is a component-based 2d paint system, it provides easy way to build large, scalable, interactive SVG / canvas / WebGL / WebGPU apps, like mind map, flow diagram.


## How to use

1. Defines a component:

```ts
class Lines extends PaintComponent {
	x: number
	y: number
	width: number
	height: number
	render() {...}
}
```

2. Then modify `render` method, returns a template to render a line and a rect:

```html
return paint`
	<line
		.x1=${this.x}
		.y1=${this.y}
		.x2=${...}
		.y2=${...}
	/>
	<rect
		.x=${this.x}
		.y=${this.y}
		.width=${this.width}
		.height=${this.height}
	/>
`
```

3. Initialize a renderer, and insert to body.

```ts
let paper = new PaintPaper()
paper.append(new Lines())

let renderer = new SVGRenderer({
	width: 800,
	height: 800,
	pixelRatio: 1,
})

paper.mainRenderer = renderer
renderer.appendTo(document.body)
```


## Build by **lupos**

Your project must be built by `luc` command of [lupos](https://github.com/pucelle/lupos), it's a wrapper for typescript, and provides:

- **Data change tracking**: **lupos** will analysis which object should be tracked and then add statements besides like `trackGet` and `trackSet`.
- **Template compiling**: **lupos** will compile `paint` template to vanilla codes, and hoist codes to optimize.



## Renders

**lupos.paint** plans to support **SVG**, **Canvas**, **WebGL**, **WebGPU** renderers.

**SVG** renderer will be supported firstly, then **Canvas** renderer.


## License

MIT