
(() => {


	const canvas : HTMLCanvasElement = document.getElementById("mainCanvas")! as HTMLCanvasElement;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	



	const ctx = canvas.getContext("2d")!;
	
	enum State
	{
		STATE_BEGIN = 0,
		STATE_ADD_POINT = 1,
		STATE_VIEW = 2,
		STATE_DRAG_POINT = 3,
	}

	class Pos
	{
		x: number;
		y: number;

		constructor(x: number, y: number)
		{
			this.x = x;
			this.y = y;
		}

		getDist(other: Pos)
		{
			const dx = this.x - other.x;
			const dy = this.y - other.y;
			return Math.sqrt(dx*dx + dy*dy);
		}
		getVecTo(other: Pos)
		{
			return new Vec(other.x - this.x, other.y - this.y);
		}
		getMidPoint(other: Pos)
		{
			return new Pos((this.x + other.x) / 2, (this.y + other.y) / 2);
		}
		getAddVector(v: Vec)
		{
			return new Pos(this.x + v.x, this.y + v.y);
		}

	}

	class Vec
	{
		x: number;
		y: number;

		constructor(x: number, y: number)
		{
			this.x = x;
			this.y = y;
		}

		getCrossProduct()
		{
			return new Vec(this.y, -this.x);
		}
		getLength()
		{
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}
		getNormal()
		{
			return this.getMult(1 / this.getLength());
		}
		getMult(l: number)
		{
			return new Vec(this.x * l, this.y * l);
		}

	}
	
	class Point
	{
		pos: Pos;
		colour: string;
		border: string;

		constructor(pos: Pos, colour = 'red', border = 'black')
		{
			this.pos = pos;
			this.colour = colour;
			this.border = border;
		}
	}
	
	const points : Point[] = [];
	let selected : Point | null = null;
	
	const getClosestPoint = (pos: Pos) =>
	{
		if(points.length == 0)
			return null;
		
		return points.reduce((a: Point, b: Point) => {
			const aDist = pos.getDist(a.pos);
			const bDist = pos.getDist(b.pos);
			return aDist < bDist ? a : b;
		})

	}
	
	
	canvas.onmousedown = e => {
		
		const mousePos = new Pos(e.offsetX, e.offsetY);

		console.info(`Canvas click [${mousePos.x} : ${mousePos.y}] Button: ${e.button}`);

		if(e.button == 0) // On left click
		{
			const closest = getClosestPoint(mousePos);
	
			if(closest && closest.pos.getDist(mousePos) < 7)
			{
				if(e.ctrlKey)
				{
					selected = new Point(mousePos);
					// ctrl makes a copy of the current point
					const index = points.indexOf(closest);
					points.splice(index+1, 0, selected);
				}
				else
				{
					selected = closest;
				}
			}
			else
			{
				selected = new Point(mousePos);
				points.push(selected);
				console.info(`Points ${points.map(p => `[${p.pos.x} : ${p.pos.y}]`).join(", ")}`);
			}
		}
		else if(e.button == 2)
		{
			const closest = getClosestPoint(mousePos);
			if(closest && closest.pos.getDist(mousePos) < 7)
			{
				const index = points.indexOf(closest);
				points.splice(index, 1);
			}
		}

		e.preventDefault();

		
	};

	canvas.onmousemove = e => {
		const mousePos = new Pos(e.offsetX, e.offsetY);
		if(selected)
		{
			selected.pos = mousePos;
		}
	}

	canvas.onmouseup = e => {
		selected = null;
	}

	canvas.oncontextmenu = e => {
		return false;
	}
	

	let running = true;
	window.onkeydown = (e: KeyboardEvent) => {
		console.log(e.key);
		if(e.key == 'Escape')
		{
			running = false;
		}


	}

	const render = () => {
		if(running)
			window.requestAnimationFrame(render);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const toRads = (d: number) => {
			return d / 180 * Math.PI;
		}

		const drawLineQueue : {start: Pos, end: Pos, col: string, thickness : number}[] = [];
		const drawPointsQueue : Point[] = [];

		const drawLine = (start: Pos, end: Pos, col: string = 'black', thickness = 1) =>
		{
			drawLineQueue.push({
				start, end, col, thickness
			});
		}

		const drawPoint = (p: Point) =>
		{
			drawPointsQueue.push(p);
		}

		for(let i = 0; i < points.length; i++)
		{
			const currPoint = points[i];
			const nextPoint = points[(i+1) % points.length];
			drawLine(currPoint.pos, nextPoint.pos, 'red', 3);
			
		}

		points.forEach(drawPoint);

		let lastLayer = [...points];

		const grads = ['#bbbbbb', '#999999', '#777777', '#555555'];

		const pointsCols = ['#ff0000', '#ff7f00', '#ffff00', '#7fff00', '#00ff7f', '#00ffff', '#007fff', '#0000ff', '#7f00ff', '#ff00ff', '#ff007f'];


		for(let i = 0; i < points.length - 2; i++)
		{
			const angle = (360 / points.length) * (i + 1);
			let currentLayer : Point[] = [];

			for(let j = 0; j < points.length; j++)
			{

				const currPoint = lastLayer[j];
				const nextPoint = lastLayer[(j+1) % points.length];
				const midPoint = currPoint.pos.getMidPoint(nextPoint.pos);
				const vecTo = currPoint.pos.getVecTo(nextPoint.pos);
				const tanA = Math.tan(toRads(angle) / 2);
				

				const len = (vecTo.getLength() / 2 / tanA);
				const cross = vecTo.getCrossProduct();

				const crossNorm = cross.getNormal();
				const crossMult = crossNorm.getMult(-len);

				const newPos = midPoint.getAddVector(crossMult);
				const newPoint = new Point(newPos, pointsCols[i+1]);
				drawPoint(newPoint);
				
				currentLayer.push(newPoint);
				drawLine(currPoint.pos, newPos, grads[i]);
				drawLine(nextPoint.pos, newPos, grads[i]);


				
			}
			for(let j = 0; j < points.length; j++)
			{
				const currPoint = currentLayer[j];
				const nextPoint = currentLayer[(j+1) % points.length];
				drawLine(currPoint.pos, nextPoint.pos, pointsCols[i+1], 3);

			}
			console.log(`Last: [${lastLayer.map(p => `{${p.pos.x} , ${p.pos.y}}`).join(", ")}]`)
			console.log(`Curr: [${currentLayer.map(p => `{${p.pos.x} , ${p.pos.y}}`).join(", ")}]`)
			lastLayer = currentLayer;


			
		}

		drawLineQueue.reverse().forEach(({start, end, col, thickness}) => {
			
			ctx.strokeStyle = col;
			ctx.lineWidth = thickness;
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		});
		drawPointsQueue.reverse().forEach(p => {
			ctx.beginPath();
			ctx.arc(p.pos.x, p.pos.y, 5, 0, 2 * Math.PI);
			ctx.fillStyle = p.colour;
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = p.border;
			ctx.stroke();

		});


	}
	render();
	
	
	
	
	
	
	
})();
