CTX = {}

// Array.prototype.flatten = function() {
// 	return this.reduce((acc, val) => Array.isArray(val) ? acc.concat(val.flatten()) : acc.concat(val), []);
// };

function ctx_cache(e)
{
	if (e.id in CTX == false) {
		CTX[e.id] = e.getContext('2d');
	} 

	if (e.offsetWidth != CTX[e.id].width || e.offsetHeight != CTX[e.id].height) {
		const dpr = window.devicePixelRatio || 1;
		e.width = e.offsetWidth * dpr;
		e.height = e.offsetHeight * dpr;
		CTX[e.id].width = e.offsetWidth * dpr;
		CTX[e.id].height = e.offsetHeight * dpr;
		CTX[e.id].scale(dpr, dpr);
		console.log("updated canvas size");
	}

	return CTX[e.id];
}

function matmul(A, B)
{
	if (A[0].length != B.length) { throw "Matrix dimensions do not match"; }

	let C = [];
	for (let i = 0; i < A.length; i++)
	{
		C.push([]);
		for (let j = 0; j < B[0].length; j++)
		{
			let sum = 0;
			for (let k = 0; k < A[0].length; k++)
			{
				sum += A[i][k] * B[k][j];
			}
			C[i].push(sum);
		}
	}
	return C;
}

function randmat(rows, cols)
{
	let A = [];
	for (let i = 0; i < rows; i++)
	{
		A.push([]);
		for (let j = 0; j < cols; j++)
		{
			A[i].push(Math.random());
		}
	}
	return A;
}

function softmax(z)
{
	let sum = z.reduce((acc, val) => acc + Math.exp(val), 0);
	return z.map(val => Math.exp(val) / sum);
}

function sample_multinomial(p)
{
	let r = Math.random();
	let sum = 0;
	for (let i = 0; i < p.length; i++)
	{
		sum += p[i];
		if (r < sum) { return i; }
	}
}

function clear(cvsId)
{
	const e = document.getElementById(cvsId);
	const ctx = ctx_cache(e);
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function plot(cvsId, fn, params)
{
	const e = document.getElementById(cvsId);
	const ctx = ctx_cache(e);
	let w = ctx.canvas.width;
	let h = ctx.canvas.height;
	let pixels_per_unit = h / 2;

	if (params) {
		ctx.strokeStyle = 'strokeStyle' in params ? params.strokeStyle : 'black';
		ctx.lineWidth = 'lineWidth' in params ? params.lineWidth : 2;
		if ('lineDash' in params) { ctx.setLineDash(params.lineDash); }
		else { ctx.setLineDash([]); }
	}
	else {
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 2;
		ctx.setLineDash([]);
	}

	let px = (x) => x * pixels_per_unit + w / 2;
	let py = (y) => -y * pixels_per_unit + h / 2;

	let trace = new Path2D();
	for (let x = -(w/2) / pixels_per_unit; x < w / pixels_per_unit; x += 0.01)
	{
		let y = fn(x, params);
		if (x == -(w/2) / pixels_per_unit) { trace.moveTo(px(x), py(y)); }
		else { trace.lineTo(px(x), py(y)); }
	}

	if (params && 'label' in params) {
		ctx.font = '16px JetBrains Mono';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		let y = fn(params.label.x, params);
	
		let padding = params.label.padding ? params.label.padding : -10;
		let textMetrics = ctx.measureText(params.label.text);
		let top = py(y) + padding - textMetrics.actualBoundingBoxAscent;
		let bottom = py(y) + padding + textMetrics.actualBoundingBoxDescent;
		console.log(top);
		if (top < 0 || bottom > h) {
			ctx.textBaseline = y > 0 ? 'top' : 'bottom';
			padding = -padding;
		}
		ctx.fillText(params.label.text, px(params.label.x), py(y) + padding);
	}

	ctx.stroke(trace);
}

function slider_param(event)
{
	if (!event) { event = { currentTarget: { value: 0 }}; }
	return parseFloat(event.currentTarget.value);
}

let platform = {
	update: function(state)
	{
		let theta = Math.max(Math.min(1, state[0]), -1); // angle of the platform
		let x = state[1]; // x position of the ball on the platform
		let dx = state[2]; // x velocity of the ball on the platform

		let g = 1; // gravity
		let ax = g * Math.sin(theta);

		x += dx;
		if (x > 50) { x = 50; dx = 0; }
		if (x < -50) { x = -50; dx = 0; }

		return [theta, x + dx, dx + ax];
	},

	draw: function(cvsId, state, left_top, right_bottom)
	{
		const e = document.getElementById(cvsId);
		const ctx = ctx_cache(e);

		if (!left_top) { left_top = [0, 0]; }
		if (!right_bottom) { right_bottom = [ctx.canvas.width, ctx.canvas.height]; }

		let w = right_bottom[0] - left_top[0];
		let h = right_bottom[1] - left_top[1];

		let px = (x) => x * pixels_per_unit + w / 2;
		let py = (y) => -y * pixels_per_unit + h / 2;

		let theta = state[0];
		let x = state[1];

		let fulcrum = { x: w / 2, y: h / 2 };

		ctx.clearRect(left_top[0], left_top[1], w, h);

		// draw platform
		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.moveTo(left_top[0] + fulcrum.x + 50 * Math.cos(theta), left_top[1] + fulcrum.y + 50 * Math.sin(theta));
		ctx.lineTo(left_top[0] + fulcrum.x + 50 * -Math.cos(theta), left_top[1] + fulcrum.y + 50 * -Math.sin(theta));
		ctx.stroke();

		// draw ball
		ctx.beginPath();
		let ball = {
			x: left_top[0] + fulcrum.x + x * Math.cos(theta),
			y: left_top[1] + fulcrum.y + x * Math.sin(theta)
		}
		ctx.arc(ball.x - Math.sin(-theta) * 10, ball.y - Math.cos(-theta) * 10, 10, 0, 2 * Math.PI);
		ctx.fill();
	},

	draw_probabilities: function(cvsId, p, names, left_top, right_bottom)
	{
		const e = document.getElementById(cvsId);
		const ctx = ctx_cache(e);

		let w = right_bottom[0] - left_top[0];
		let h = right_bottom[1] - left_top[1];

		// clear with partial opacity
		// ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';

		let path = new Path2D();
		path.moveTo(left_top[0], right_bottom[1]);

		p = [].concat([0], p)

		for (let i = 0; i < p.length; i++)
		{
			let x = left_top[0] + w * i / p.length;
			let y = right_bottom[1] - h * p[i];
			if (i > 0 && i < p.length) {
				ctx.fillText(names[i-1], x, y - 10);
			}
			path.lineTo(x, y);
		}
		path.lineTo(right_bottom[0], right_bottom[1]);
		ctx.stroke(path);
	}
};