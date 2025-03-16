~article,math,derivative
<script src="/js/ui.js"></script>
<script src="/js/math.js"></script>

<style>
canvas {
	width: 100%;
	height: 10em;
    touch-action: none;
}

.math * {
	margin: 0;
}
</style>

# Derivative

A derivative is a function which returns the slope of another function with respect to its input. A good way to build an intiution for derivatives is to think of them as the slope of a function at a given point. There are two ways to compute a derivative, analytically and numerically. The analytical method is the most common and is the one that you probably learned in school. The numerical method is an approximation of the analytical method and is often used when the analytical method is too difficult to compute. In this article focus on the numerical method because it may be more intuative for the un-initiated.

Numerical derivatives can be computed using a method known as _finite differencing_ where you calculate the value of the function $f(x)$ at some point $x$ and then again at a point $x + \Delta x$. The derivative is then the ratio of the change in the function over the change in $x$. Take a look at the example below, and play with the sliders to see how this works.

<canvas id="derivative"></canvas>
<script>
let derivative_x = 0;
let derivative_dx = 2;
function derivative(event) {
	if (event)
	if (typeof(event) == 'number') {
		derivative_x = event;
	}

	clear("derivative");

	let f = (x) => { return Math.sin(x); }
	let slope = (f(derivative_x + derivative_dx) - f(derivative_x)) / derivative_dx;
	let df = (x) => { return slope * (x - derivative_x) + f(derivative_x); };

	plot("derivative", (x, p) => { return 0; }, {'lineDash': [10, 10], 'strokeStyle': color('LightGray')});
	plot("derivative", (x, p) => { return f(x); }, {});
	plot("derivative", (x, p) => { return df(x); }, {'strokeStyle': color('LightGray')});

	let ctx = ctx_cache(document.getElementById("derivative"));

	let vertical_dash = (x) => {
		ctx.beginPath();
		ctx.setLineDash([10, 10]);
		ctx.moveTo(px(ctx,x), py(ctx,f(x)));
		ctx.lineTo(px(ctx,x), py(ctx,0));
		ctx.strokeStyle = color('LightGray');
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(px(ctx,x), py(ctx,f(x)), 3, 0, 2 * Math.PI);
		ctx.fillStyle = color('LightGray');
		ctx.fill();
	};

	vertical_dash(derivative_x);
	vertical_dash(derivative_x + derivative_dx);
}
derivative();
</script>
<label for="x_slider">$x$</label>
<input name="x_slider" type="range" min="-4" max="4" value="0" step="any" oninput="derivative(slider_param(event))">
<label for="dx_slider">$\Delta x$</label>
<input name="x_slider" type="range" min="0.001" max="4" value="2" step="any" oninput="derivative_dx=slider_param(event);derivative()">

You may have noticed something when you were playing with the $\Delta x$ slider. As you make $\Delta x$ smaller, the slope of the tangent line (the numerical derivative) got closer and closer to matching the slope of the function at point $x$. This is exactly the idea as something we will explore next, which is the definition of the derivative as the _limit_.

$$
\frac{df(x)}{dx} = \lim_{\Delta x \to 0} \frac{f(x + \Delta x) - f(x)}{\Delta x}
$$

The right side of this expression does exactly what the interactive example is doing. It computes the value of the function we are differentiating $f$ at two points $x$ and $x + \Delta x$. Lets call this difference $\Delta f(x)$ or rather:

$$
\Delta f(x) = f(x + \Delta x) - f(x)
$$

The difference, $\Delta f(x)$ is then _divided_ by the size of the step we took. The resulting value happens to be the slope of the line traced from $f(x)$ to $f(x + \Delta x)$, which approximates the slope of the equation $f$ at value $x$! The notation takes it one step farther however, by asking you to imagine what happens as $\Delta x$ gets smaller and smaller. As $\Delta x$ approaches 0 the value of the limit approaches the value of the derivative. This is the idea of the limit, and it is the foundation of calculus.