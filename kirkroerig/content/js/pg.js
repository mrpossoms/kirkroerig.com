CTX = {}

Array.prototype.rows = function() 
{
	return this.length;
}

Array.prototype.cols = function()
{
	return this[0].length;
}

let zeros = (r, c) => { 
	let z = Array(r);

	for (let i = 0; i < r; i++) {
		z[i] = Array(c).fill(0);
	}

	return z;
};

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
	if (A.cols() != B.rows()) { throw "Matrix dimensions do not match"; }

	let C = [];
	for (let r = 0; r < A.rows(); r++)
	{
		C.push([]);
		for (let c = 0; c < B.cols(); c++)
		{
			let sum = 0;
			for (let k = 0; k < A.cols(); k++)
			{
				sum += A[r][k] * B[k][c];
			}
			C[r].push(sum);
		}
	}
	return C;
}

function matadd(A, B)
{
	if (A.length != B.length || A[0].length != B[0].length) { throw "Matrix dimensions do not match"; }

	let C = [];
	for (let i = 0; i < A.length; i++)
	{
		C.push([]);
		for (let j = 0; j < A[0].length; j++)
		{
			C[i].push(A[i][j] + B[i][j]);
		}
	}
	return C;
}

function matscl(A, s)
{
	let B = [];
	for (let i = 0; i < A.length; i++)
	{
		B.push([]);
		for (let j = 0; j < A[0].length; j++)
		{
			B[i].push(A[i][j] * s);
		}
	}
	return B;
}

function vecsub(a, b)
{
	if (a.length != b.length) { throw "Vector dimensions do not match"; }
	let c = [];
	for (let i = 0; i < a.length; i++)
	{
		c.push(a[i] - b[i]);
	}
	return c;
}

function vecscl(a, s)
{
	let b = [];
	for (let i = 0; i < a.length; i++)
	{
		b.push(a[i] * s);
	}
	return b;
}

function randmat(rows, cols)
{
	let A = [];
	for (let i = 0; i < rows; i++)
	{
		A.push([]);
		for (let j = 0; j < cols; j++)
		{
			A[i].push(Math.random() - 0.5);
		}
	}
	return A;
}

function softmax(z)
{
	let sum = z.reduce((acc, val) => acc + Math.exp(val), 0);
	return z.map(val => Math.exp(val) / sum);
}

function pg_test()
{
	console.log('testing');
	let pi = (theta, x) => { return softmax(matmul(theta, x)); };
	let pi_pr = (theta, x, a) => { 
		console.log('theta: ' + theta);
		let y = pi(theta, x);
		console.log('pr: ' + y);
		return y[a];
	};

	let theta = [[2],[1]];
	let x = [[1]];
	debugger	
	for (let i = 0; i < 2; i++) {
		let pr_0 = pi_pr(theta, x, 0);
		console.log('before: ' + pr_0);
		let G = policy_grad(pi_pr, theta, x, 0, 0.01);
		console.log('G: ' + G);
		theta = matadd(theta, matscl(G, 0.1));
		let pr_1 = pi_pr(theta, x, 0);
		console.log('after: ' + pr_1);

		console.assert(pr_1 > pr_0);
	}
}
// pg_test();

function policy_grad(pi_pr, theta, x, a, h)
{
	let G = zeros(theta.rows(), theta.cols());

	for (let r = 0; r < theta.rows(); r++) {
		for (let c = 0; c < theta.cols(); c++) {
			let theta_plus = theta.map((row, i) => row.map((val, j) => {
				return i == r && j == c ? val + h : val;
			}));

			let theta_minus = theta.map((row, i) => row.map((val, j) => {
				return i == r && j == c ? val - h : val;
			}));

			//console.log(theta_minus);
			//console.log(theta_plus);

			let pi_plus = pi_pr(theta_plus, x, a);
			let pi_minus = pi_pr(theta_minus, x, a);

			let grad = (pi_plus - pi_minus)  / (2 * h);
			
			if (isNaN(grad)) {
				throw "NaN gradient element value"; 
			}
			G[r][c] = grad;
		}
	}

	return G;
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
	pi: function(theta, x) {
		let z = matmul([[x[0], x[1], x[2], Math.pow(x[2], 2), Math.pow(x[2], 3), x[3]]], theta);
		let p = softmax(z[0]);
		let a_idx = sample_multinomial(p);

		if (isNaN(p[0])) {
			throw "NaN probability value"; 
		}

		return { pr: p, idx: a_idx };
	},

	update: function(state)
	{
		let theta = Math.max(Math.min(1, state[0]), -1); // angle of the platform
		let x = state[1]; // x position of the ball on the platform
		let dx = state[2]; // x velocity of the ball on the platform

		let g = 0.1; // gravity
		let ax = g * Math.sin(theta);

		x += dx;
		if (x > 50) { throw "episode terminated"; }
		if (x < -50) { throw "episode terminated"; }

		return [theta, x + dx, dx + ax, 1];
	},

	step: function(T, x_t, a_t, gamma)
	{
		let d_theta = 0;

		switch (a_t.idx) {
			case 0: d_theta = -0.1; break;
			// case 1: d_theta = -0.05; break;
			// case 2: d_theta = 0.0; break;
			// case 3: d_theta = 0.05; break;
			case 1: d_theta = 0.1; break;
		}

		x_t[0] += d_theta;

		let x_t1 = platform.update(x_t);

		// Approaching x = 0 is a positive reward, otherwise negative
		let r_t = Math.abs(x_t[1]) - Math.abs(x_t1[1]);

		// if (Math.abs(x_t1[1]) == 50) { r_t -= 10; }
		// if (Math.abs(x_t1[1]) < 5) { r_t += 10; }

		T.X.push(x_t1);
		T.R.push(r_t);
		T.A_pr.push(a_t.pr);
		T.A.push(a_t.idx);
	},

	sample_trajectory: function(theta)
	{
		let rnd = () => { return Math.random() * 2 - 1; };

		let x_t = [rnd(), rnd() * 25, rnd() * 0.0, 1];
		let T = { X: [], A_pr: [], A: [], R: []};

		try {
			for (let t = 0; t < 500; t++)
			{
				let a_t = platform.pi(theta, x_t);
				let r_t = platform.step(T, x_t, a_t, 0.99);
				x_t = T.X[t];
			}
		}
		catch (e) {
			console.log(e);
		}

		return T;
	},

	optimize: function(theta, T)
	{
		let alpha = 0.1;
		let gamma = 1;//0.99;
		let G = zeros(theta.rows(), theta.cols());

		let pi_pr = (theta, x, a) => { return platform.pi(theta, x).pr[a]; };

		const p = 1 / T.X.length;
		for (let t = 0; t < T.X.length; t++) {
			let G_t = matscl(policy_grad(pi_pr, theta, T.X[t], T.A[t], 0.001), p);
			G = matadd(G, matscl(G_t, T.R[t] * Math.pow(gamma, t)));
		}

		// console.log('G: ' + G);

		return matadd(theta, matscl(G, alpha * (1/T.X.length)));
	},

	draw: function(cvsId, state, left_top, right_bottom)
	{
		const e = document.getElementById(cvsId);
		const ctx = ctx_cache(e);
		const dpr = window.devicePixelRatio || 1;
	
		if (!left_top) { left_top = [0, 0]; }
		if (!right_bottom) { right_bottom = [ctx.canvas.width/dpr, ctx.canvas.height/dpr]; }

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

	if (ctx.gradient_image == undefined || ctx.gradient_image.theme != detectSystemTheme()) {
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
				ctx.gradient_image.data[i + 3] = high * val + low * (1 - val);
			}
		}

		ctx.gradient_image.theme = detectSystemTheme();
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
