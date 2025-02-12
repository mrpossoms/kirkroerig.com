CTX = {}

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
	if (typeof e == 'string') {
		e = document.getElementById(e);
	}

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

function clear(cvsId)
{
	const e = document.getElementById(cvsId);
	const ctx = ctx_cache(e);
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

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

function slider_param(event)
{
	if (!event) { event = { currentTarget: { value: 0 }}; }
	return parseFloat(event.currentTarget.value);
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