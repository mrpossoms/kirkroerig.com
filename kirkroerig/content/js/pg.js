
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
			G = matadd(G, matscl(G_t, T[ti].R[t]/* * Math.pow(params.gamma, t)*/));
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
		let x_t1 = zeros(4, 1);

		x_t1[0] = x_t[0] + (a_t.idx[0] - 1) * 2;
		x_t1[1] = x_t[1] + (a_t.idx[1] - 1) * 2;
		x_t1[2] = x_t[2];
		x_t1[3] = x_t[3];

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
