CTX = {}

function detectSystemTheme() {
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark';
	} else {
		return 'light';
	}
}

function color(name) 
{
	return {
		'dark': {
			'LightGray': 'LightGray',
			'black': 'white'
		},
		'light': {
			'LightGray': 'LightGray',
			'black': 'black'
		}
	}[detectSystemTheme()][name];
}

function ctx_cache(e)
{
	let just_added = false;
	if (e.id in CTX == false) {
		CTX[e.id] = e.getContext('2d');
		just_added = true;
	} 

	if (just_added || e.offsetWidth != CTX[e.id].width || e.offsetHeight != CTX[e.id].height) {
		const dpr = window.devicePixelRatio || 1;
		const rect = e.getBoundingClientRect();
		e.width = rect.width * dpr;
		e.height = rect.height * dpr;
		CTX[e.id].scale(dpr, dpr);
		e.style.width = `${rect.width}px`;
		e.style.height = `${rect.height}px`;
		// These are just to check for size changes and have no other impact
		CTX[e.id].width = e.offsetWidth;
		CTX[e.id].height = e.offsetHeight;
		console.log("updated canvas size");
	}

	return CTX[e.id];
}

function fin_diff(f, x, h)
{
	// return (f(x + h) - f(x - h)) / (2 * h);
	return (f(x + h) - f(x)) / h;
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

let px = (ctx, x) => {
	let w = ctx.canvas.width;
	let h = ctx.canvas.height;
	let pixels_per_unit = h / 2;
	return x * pixels_per_unit + w / 2;
};

let py = (ctx, y) => {
	let w = ctx.canvas.width;
	let h = ctx.canvas.height;
	let pixels_per_unit = h / 2;
	return -y * pixels_per_unit + h / 2;
};

function plot(cvsId, fn, params)
{
	const e = document.getElementById(cvsId);
	const ctx = ctx_cache(e);
	let w = ctx.canvas.width;
	let h = ctx.canvas.height;
	let pixels_per_unit = h / 2;

	if (params) {
		ctx.strokeStyle = 'strokeStyle' in params ? params.strokeStyle : color('black');
		ctx.lineWidth = 'lineWidth' in params ? params.lineWidth : 2;
		if ('lineDash' in params) { ctx.setLineDash(params.lineDash); }
		else { ctx.setLineDash([]); }
	}
	else {
		ctx.strokeStyle = color('black');
		ctx.lineWidth = 2;
		ctx.setLineDash([]);
	}



	let trace = new Path2D();
	for (let x = -(w/2) / pixels_per_unit; x < w / pixels_per_unit; x += 0.01)
	{
		let y = fn(x, params);
		if (x == -(w/2) / pixels_per_unit) { trace.moveTo(px(ctx, x), py(ctx, y)); }
		else { trace.lineTo(px(ctx, x), py(ctx, y)); }
	}

	if (params && 'label' in params) {
		ctx.font = '16px JetBrains Mono';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		let y = fn(params.label.x, params);
	
		let padding = params.label.padding ? params.label.padding : -10;
		let textMetrics = ctx.measureText(params.label.text);
		let top = py(ctx, y) + padding - textMetrics.actualBoundingBoxAscent;
		let bottom = py(ctx, y) + padding + textMetrics.actualBoundingBoxDescent;
		console.log(top);
		if (top < 0 || bottom > h) {
			ctx.textBaseline = y > 0 ? 'top' : 'bottom';
			padding = -padding;
		}
		ctx.fillText(params.label.text, px(ctx, params.label.x), py(ctx, y) + padding);
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

		let theta = state[0];
		let x = state[1];

		let fulcrum = { x: w / 2, y: h / 2 };

		ctx.clearRect(left_top[0], left_top[1], w, h);

		ctx.fillStyle = color('black');
		ctx.strokeStyle = color('black');

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

		ctx.fillStyle = color('black');
		ctx.strokeStyle = color('black');

		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';

		let path = new Path2D();
		path.moveTo(left_top[0], right_bottom[1]);
		p = [].concat([0], p)
		for (let i = 0; i < p.length; i++)
		{
			let x = left_top[0] + w * i / p.length;
			let y = right_bottom[1] - h * p[i];
			path.lineTo(x, y);
		}
		path.lineTo(right_bottom[0], right_bottom[1]);
		ctx.stroke(path);

		for (let i = 0; i < p.length; i++)
		{
			let x = left_top[0] + w * i / p.length;
			let y = right_bottom[1] - h * p[i];
			if (i > 0 && i < p.length) {
				let text_metrics = ctx.measureText(names[i-1]);
				let th = text_metrics.height / 2;
				let tw = text_metrics.width;
				ctx.fillStyle = 'red';
				ctx.fillRect(x - (10 + tw / 2), y - (10 + th / 2), text_metrics.width + (20 + tw), text_metrics.height + (20 + th));
				ctx.fillStyle = color('black');
				ctx.fillText(names[i-1], x, y - 10);
			}
		}
	}
};

function gradient_example(event, show_vectors)
{
	const dpr = window.devicePixelRatio || 1;
	const ctx = ctx_cache(event.currentTarget);

	let w = ctx.canvas.width;
	let h = ctx.canvas.height;
	let hw = w / 2;
	let hh = h / 2;

	let gaussian = (x) => {
		let sig = 0.3;
		return Math.exp(-Math.pow(x, 2) / sig);
	};

	let f = (x, y) => {
		return gaussian(x) * gaussian(y);
	};

	let mx = event.offsetX * dpr, my = event.offsetY * dpr;
	
	let draw_vector = (px, py, params) => {
		let x = (px - hw)/hh;
		let y = (py - hh)/hh;
		let f0 = f(x, y);
		let f_dx = (f(x + 0.01, y) - f0) / 0.01;
		let f_dy = (f(x, y + 0.01) - f0) / 0.01;

		if (!params) {
			params = { 
				len_scale: 20,
				origin_radius: 2
			};
		}

		ctx.beginPath();
		ctx.globalCompositeOperation = 'difference';
		ctx.fillStyle = 'white';
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 1;
		ctx.arc(px/dpr, py/dpr, params.origin_radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(px/dpr, py/dpr);
		ctx.lineTo(px/dpr + f_dx * params.len_scale, py/dpr + f_dy * params.len_scale);
		ctx.stroke();
		ctx.globalCompositeOperation = 'source-over';	
	};

	if (ctx.gradient_image == undefined) {
		ctx.gradient_image = ctx.createImageData(w, h);

		let low = 0;
		let high = 255;

		if (detectSystemTheme() == 'light') {
			low = 255;
			high = 0;
		}

		for (let py = 0; py < h; py++) {
			for (let px = 0; px < w; px++) {
				let x = (px - hw) / hh;
				let y = (py - hh) / hh;
				let val = f(x, y);
				let i = 4 * (px + py * w);

				for (let j = 0; j < 3; j++) {
					ctx.gradient_image.data[i + j] = high * val + low * (1 - val);
				}
				ctx.gradient_image.data[i + 3] = 255;
			}
		}
	}

	ctx.clearRect(0, 0, w, h);
	ctx.putImageData(ctx.gradient_image, 0, 0);

	draw_vector(mx, my);

	if (show_vectors)
	for (let x = 0; x < w; x += 11) {
		for (let y = 0; y < h; y += 11) {
			draw_vector(x, y, {
				len_scale: 5,
				origin_radius: 0.5
			});
		}
	}
}
