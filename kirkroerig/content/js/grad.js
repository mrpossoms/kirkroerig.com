
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