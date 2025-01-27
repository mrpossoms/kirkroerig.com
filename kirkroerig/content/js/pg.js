CTX = {}

// Array.prototype.rows = function() 
// {
// 	return this.length;
// }

// Array.prototype.cols = function()
// {
// 	return this[0].length;
// }
// Array.prototype.argmax = function() { return this.indexOf(Math.max(...this)); };

function when_visible(id, cb)
{
	let visible_cb = (entries, observer) => {
		entries.forEach((entry) => {
			window.when_visible_element_callbacks[entry.target.id](entry.isIntersecting);
		});
	};

	if (!window.when_visible_observer) {
		window.when_visible_observer = new IntersectionObserver(visible_cb, {
			root: null,
			rootMargin: '0px',
			threshold: 0.9,
		});
		window.when_visible_element_callbacks = {};
	}

	let ele = document.getElementById(id);
	window.when_visible_element_callbacks[id] = cb;
	window.when_visible_observer.observe(ele);
}

function animate(id, duration) {
	if (!window.animation_intervals) {
		window.animation_intervals = {};
	}

	return {
		using: function(animation) {
			return {
				when: function(condition) {
					if (condition) {
						window.animation_intervals[id] = setInterval(animation, duration);
						console.log('setInverval: ' + duration + ' for ' + id);
					} else if (window.animation_intervals[id]) {
						clearInterval(window.animation_intervals[id]);
						delete window.animation_intervals[id];
						console.log('clearInterval for ' + id);
					}
				}
			};
		}
	};
}

function animate_when_visible(params, animation_cb) {
	when_visible(params.id, (visible) => {
		animate(params.id, 1000 / params.fps).using(animation_cb)
		                                     .when(visible);
	});
}

let rows = (A) => { return A.length; }
let cols = (A) => { return A[0].length; }
let rnd = () => { return Math.random() * 2 - 1; };

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
			'LightGray': 'DarkGray',
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
	return (f(x + h) - f(x - h)) / (2 * h);
}

function matmul(A, B)
{
	if (cols(A) != rows(B)) { throw "Matrix dimensions do not match"; }

	let C = [];
	for (let r = 0; r < rows(A); r++)
	{
		C.push([]);
		for (let c = 0; c < cols(B); c++)
		{
			let sum = 0;
			for (let k = 0; k < cols(A); k++)
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
	if (rows(A) != rows(B) || cols(A) != B[0].length) { throw "Matrix dimensions do not match"; }

	let C = [];
	for (let i = 0; i < rows(A); i++)
	{
		C.push([]);
		for (let j = 0; j < cols(A); j++)
		{
			C[i].push(A[i][j] + B[i][j]);
		}
	}
	return C;
}

function matscl(A, s)
{
	let B = [];
	for (let i = 0; i < rows(A); i++)
	{
		B.push([]);
		for (let j = 0; j < cols(A); j++)
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

function softermax(z)
{
	let y = softmax(z);
	let max_idx = y.argmax();
	if (y[max_idx] > 0.9) {
		let rem = y[max_idx] - 0.9;
		y[max_idx] = 0.9;
		let b = 0;
		for (let i = 0; i < y.length; i++) { if (i != max_idx) { b += y[i]; } }
		for (let i = 0; i < y.length; i++) {
			if (i == max_idx) continue;
			y[i] += (y[i]/b) * rem;
		}
	}

	return y;
}

function leaky_relu(z)
{
	return z.map(row => row.map(val => val > 0 ? val : 0.01 * val));
}

function dist(p0, p1)
{
	return Math.sqrt(Math.pow(p0[0] - p1[0], 2) + Math.pow(p0[1] - p1[1], 2));
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
	// TODO: make this operate on theta which is a tensor instead of a matrix
	let G = zeros(rows(theta), cols(theta));

	for (let r = 0; r < rows(theta); r++) {
		for (let c = 0; c < cols(theta); c++) {
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

function text(ctx_cvs_or_id, message, point, params)
{
	let ctx = ctx_cvs_or_id;
	if (typeof ctx_cvs_or_id == 'string') {
		ctx = ctx_cache(document.getElementById(ctx_cvs_or_id));
	}
	else if (ctx_cvs_or_id instanceof HTMLCanvasElement) {
		ctx = ctx_cache(ctx_cvs_or_id);
	}

	params = params || {};
	ctx.textAlign = params.textAlign || 'center';
	ctx.textBaseline = params.textBaseline || 'bottom';
	ctx.font = params.font || '16px JetBrains Mono';
	ctx.fillStyle = params.fillStyle || color('black');

	if ('angle' in params) {
		ctx.save();
		ctx.translate(point[0], point[1]);
		ctx.rotate(params.angle);
		point = [0, 0];
	}

    ctx.fillText(message, point[0], point[1]);

	if ('angle' in params) {
		ctx.restore();
	}
}

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

		text(ctx, params.label.text, [px(ctx, params.label.x), py(ctx, y) + padding]);
	}

	ctx.stroke(trace);
}

function slider_param(event)
{
	if (!event) { event = { currentTarget: { value: 0 }}; }
	return parseFloat(event.currentTarget.value);
}


function optimize(pi, theta, T, params)
{
	params = params || {};	
	params.alpha = params.alpha == undefined ? 0.1 : params.alpha;
	params.gamma = params.gamma || 0.99;

	if (!(T instanceof Array)) { T = [T]; }

	let G = zeros(rows(theta), cols(theta));//theta.map(theta_i => zeros(theta_i.rows(), theta_i.cols()));

	let pi_pr = params.pi_pr || ((theta, x, a) => { return pi(theta, x).pr[a]; });

	for (let ti = 0; ti < T.length; ti++) {
		const p = 1 / T[ti].X.length;

		for (let t = 0; t < T[ti].X.length; t++) {
			let G_t = matscl(policy_grad(pi_pr, theta, T[ti].X[t], T[ti].A[t], 0.001), p);
			G = matadd(G, matscl(G_t, T[ti].R[t] * Math.pow(params.gamma, t)));
		}

		G = matscl(G, 1 / T.length);
	}

	return matadd(theta, matscl(G, params.alpha));
}


function draw_probabilities(cvsId, p, names, left_top, right_bottom, annotator)
{
	const e = document.getElementById(cvsId);
	const dpr = window.devicePixelRatio || 1;
	const ctx = ctx_cache(e);

	left_top = left_top || [0, 0];
	right_bottom = right_bottom || [ctx.canvas.width / dpr, ctx.canvas.height / dpr];
	annotator = annotator || function(ctx, i, x, y) {};

	let w = right_bottom[0] - left_top[0];
	let h = right_bottom[1] - left_top[1];

	ctx.fillStyle = color('black');
	ctx.strokeStyle = color('black');

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
		let x = (left_top[0] + w * i / p.length);
		let y = right_bottom[1] - h * p[i];
		annotator(ctx, i, x, y);
		if (i > 0 && i < p.length) {
			let text_metrics = ctx.measureText(names[i-1]);
			let th = text_metrics.height / 2;
			let tw = text_metrics.width;
			ctx.fillStyle = 'red';
			ctx.fillRect(x - (10 + tw / 2), y - (10 + th / 2), text_metrics.width + (20 + tw), text_metrics.height + (20 + th));
			let y_offset = y > 30 ? -10 : 20;
			text(ctx, names[i-1], [x, y + y_offset]);
		}
	}
}

function draw_reward_plot(cvsId, R, left_top, right_bottom)
{
	const e = document.getElementById(cvsId);
	const ctx = ctx_cache(e);
	const dpr = window.devicePixelRatio || 1;

	left_top = left_top || [0, 0];
	right_bottom = right_bottom || [ctx.canvas.width / dpr, ctx.canvas.height / dpr];

	let w = right_bottom[0] - left_top[0];
	let h = right_bottom[1] - left_top[1];

	let min = Math.min(Math.min(...R),-1);
	let max = Math.max(Math.max(...R),1);
	let range = max - min;

	let py = (y) => (y - min) / range;
	let y = (p) => (right_bottom[1] * (1 - p)) + left_top[1] * p;
	ctx.beginPath();
	ctx.moveTo(left_top[0], y(py(0)));
	ctx.lineTo(right_bottom[0], y(py(0)));
	ctx.setLineDash([5, 15]);
	ctx.strokeStyle = color('LightGray');
	ctx.stroke();
	ctx.setLineDash([]);

	let path = new Path2D();
	for (let i = 0; i < R.length; i++)
	{
		let x = left_top[0] + w * i / R.length;
		let p = py(R[i]);
		if (i == 0) {
			path.moveTo(x, y(p));
		} else {
			path.lineTo(x, y(p));		
		}

		if (i == R.length - 1) {
			let str = parseInt(R[i]).toString();
			let text_metrics = ctx.measureText(str);
			let th = text_metrics.height / 2;
			let tw = text_metrics.width;
			ctx.font = '16px JetBrains Mono';
			ctx.fillStyle = color('black');
			let x_off = x + tw > w ? -tw : 0;
			ctx.fillText(str, x + x_off, y(p) + 16);
		}
	}
	ctx.strokeStyle = color('black');
	ctx.stroke(path);
}

let basic = {
	target: 1,
	pi: function(theta, x) {
		let z = matmul([x], theta);
		let p = softmax(z[0]);
		let a_idx = sample_multinomial(p);

		return { pr: p, idx: a_idx };
	},
	sample_trajectory: function(theta, for_visualization) {
		let x_t = [1];
		let T = { X: [], A_pr: [], A: [], R: []};

		for (let t = 0; t < 1; t++) {
			let a_t = basic.pi(theta, x_t);
			let r_t = basic.step(T, x_t, a_t, 0.99);
		}

		return T;
	},
	step: function(T, x_t, a_t, gamma)
	{
		let x_t1 = platform.update(x_t);

		let r_t = a_t.idx == basic.target ? 1 : -1;

		T.X.push(x_t);
		T.R.push(r_t);
		T.A_pr.push(a_t.pr);
		T.A.push(a_t.idx);
	},
}

let puck = {
	w: 100,
	h: 100,
	pi: function(theta, x) {
		// 1x2 * 2x6 -> 1x6
		let dx = x[2] - x[0];
		let dy = x[3] - x[1];
		let mag = Math.sqrt(dx * dx + dy * dy) + 0.1;
		let _x = [dx/mag, dy/mag];
		// _x.push(1);
		let z = matmul([_x], theta)[0];
		let z_x = z.slice(0, 3);
		let z_y = z.slice(3, 6);
		let pr_x = softmax(z_x);
		let pr_y = softmax(z_y);
		let a_x_idx = sample_multinomial(pr_x);
		let a_y_idx = sample_multinomial(pr_y);

		return { pr: [pr_x, pr_y], idx: [a_x_idx, a_y_idx] };
	},
	dist_to_target: function(x) {
		return dist([x[0],x[1]], [x[2], x[3]]);
	},
	initial_state: function(left_top, right_bottom, randomize_target) {
		left_top = left_top || [0, 0];
		right_bottom = right_bottom || [500, 500];
		let r = Math.random;
		let w = right_bottom[0] - left_top[0];
		let h = right_bottom[1] - left_top[1];
		let o_x = left_top[0], o_y = left_top[1];
		// in the background, trajectories could be sampled this way so there isn't an axial bias built into
		// the optimized policy. But for visualization purposes, the puck and targets could be spawned anywhere
		let targ_x = randomize_target ? r() * w : w / 2;
		let targ_y = randomize_target ? r() * h : h / 2; 
		let x_0 = [o_x + r() * w, o_y + r() * h, o_x + targ_x, o_y + targ_y];

		while(puck.dist_to_target(x_0) <= 10) {
			x_0 = [o_x + r() * w, o_y + r() * h, o_x + targ_x, o_y + targ_y];
		}

		return x_0;
	},
	sample_trajectory: function(theta, left_top, right_bottom, randomize_target) {
		let x_t = puck.initial_state(left_top, right_bottom, randomize_target);

		let T = { X: [], A_pr: [], A: [], R: []};

		for (let t = 0; t < 5 * 60; t++) {
			let a_t = puck.pi(theta, x_t);
			let r_t = puck.step(T, x_t, a_t, 0.99);
			if (r_t == null) {
				break;
			}
			x_t = T.X[t];

		}

		return T;
	},
	reward: function(x_t, x_t1)
	{
		let d0 = puck.dist_to_target(x_t);
		let d1 = puck.dist_to_target(x_t1);
		return d0 - d1;
	},
	step: function(T, x_t, a_t, gamma)
	{
		// let d0 = puck.dist_to_target(x_t);
		let x_t1 = zeros(4, 1);
		// x_t1[0] = x_t[0] + (a_t.idx[0] * 2 - 1) * 2;
		// x_t1[1] = x_t[1] + (a_t.idx[1] * 2 - 1) * 2;
		x_t1[0] = x_t[0] + (a_t.idx[0] - 1) * 2;
		x_t1[1] = x_t[1] + (a_t.idx[1] - 1) * 2;
		x_t1[2] = x_t[2];
		x_t1[3] = x_t[3];

		// // keep puck in bounds
		// if (x_t1[0] < 5) { x_t1[0] = 5; }
		// if (x_t1[0] > puck.w-5) { x_t1[0] = puck.w-5; }
		// if (x_t1[1] < 5) { x_t1[1] = 5; }
		// if (x_t1[1] > puck.h-5) { x_t1[1] = puck.h-5; }

		let d1 = puck.dist_to_target(x_t1);

		let r_t = puck.reward(x_t, x_t1);
		if (d1 < 5) { return null; }

		T.X.push(x_t1);
		T.R.push(r_t);
		T.A_pr.push(a_t.pr);
		T.A.push(a_t.idx);
		return r_t;
	},
	draw: function(cvsId, time, trajectory, left_top, right_bottom)
	{
		const e = document.getElementById(cvsId);
		const ctx = ctx_cache(e);
		const dpr = window.devicePixelRatio || 1;

		let state = trajectory.X[time];

		if (!left_top) { left_top = [0, 0]; }
		if (!right_bottom) { right_bottom = [ctx.canvas.width/dpr, ctx.canvas.height/dpr]; }

		puck.w = right_bottom[0] - left_top[0];
		puck.h = right_bottom[1] - left_top[1];

		if (state == undefined) {
			debugger;
		}

		// draw target
		ctx.beginPath();
		ctx.strokeStyle = color('black');
		ctx.moveTo(state[2] - 5, state[3] - 5);
		ctx.lineTo(state[2] + 5, state[3] + 5);
		ctx.moveTo(state[2] - 5, state[3] + 5);
		ctx.lineTo(state[2] + 5, state[3] - 5);
		ctx.stroke();

		// draw path
		ctx.beginPath();
		ctx.setLineDash([5, 15]);
		ctx.strokeStyle = color('LightGray');
		let x = trajectory.X[0];
		ctx.moveTo(x[0], x[1]);
		for (let t = 1; t < time; t++) {
			x = trajectory.X[t];
			ctx.lineTo(x[0], x[1]);
		}
		ctx.setLineDash([]);
		ctx.stroke();

		// draw puck
		ctx.beginPath();
		ctx.strokeStyle = color('black');
		ctx.beginPath();
		ctx.arc(state[0], state[1], 4, 0, 2 * Math.PI);
		ctx.stroke();
	}
}

let platform = {
	pi: function(theta, x) {
		let _x = [[x[0], x[1], x[2]]]
		let z = matmul(_x, theta);
		// z = leaky_relu(z);
		// z = matmul(z, theta[1]);
		let p = softmax(z[0]);
		let a_idx = sample_multinomial(p);

		if (isNaN(p[0])) {
			throw "NaN probability value"; 
		}

		return { pr: p, idx: a_idx };
	},

	update: function(state)
	{
		let angle = Math.max(Math.min(1, state[0]), -1); // angle of the platform
		let x = state[1]; // x position of the ball on the platform
		let dx = state[2]; // x velocity of the ball on the platform

		let g = 10; // gravity
		let ax = g * Math.sin(angle);

		// x += ax;
		if (x > 50) { throw "episode terminated"; }
		if (x < -50) { throw "episode terminated"; }

		return [angle, x + ax, dx, 1];
	},

	step: function(T, x_t, a_t, gamma)
	{
		let d_angle = 0;

		switch (a_t.idx) {
			case 0: d_angle = -0.1; break;
			case 1: d_angle = -0.01; break;
			// case 2: d_angle = 0.0; break;
			case 2: d_angle = 0.01; break;
			case 3: d_angle = 0.1; break;
		}

		x_t[0] += d_angle;

		let x_t1 = platform.update(x_t);

		// Approaching x = 0 is a positive reward, otherwise negative
		let r_t = Math.abs(x_t[1]) - Math.abs(x_t1[1]);

		// if (Math.abs(x_t1[1]) == 50) { r_t -= 10; }
		if (Math.abs(x_t1[1]) < 4) { r_t += 0.1; }

		T.X.push(x_t1);
		T.R.push(r_t);
		T.A_pr.push(a_t.pr);
		T.A.push(a_t.idx);
	},

	sample_trajectory: function(theta)
	{
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

module.exports = {
	softermax: softermax,
	puck: puck,
	optimize: optimize,
	randmat: randmat
};
