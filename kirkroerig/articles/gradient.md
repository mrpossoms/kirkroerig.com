~article,math,gradient
<script src="/js/pg.js"></script>

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
# Gradient

A gradient is like a [derivative](/article/derivative), but for functions with more than one input. While a derivative gives the slope of a single-variable function, a gradient tells us the direction and rate of the steepest increase for a function with multiple variables.

Lets study an example graident of a fuction with 2 inputs.

$$
f(x, y) = e^{-x^2} * e^{-y^2}
$$

This function is composed of two [gaussians](https://en.wikipedia.org/wiki/Gaussian_function) multiplied together where each takes an independent input, $x$ and $y$ respectively. The result can be visualized by using the resulting value to assign a shade to every pixel for each position in an image $x$ and $y$. You can think of this shade value as the height of a hill, the stronger the shade the taller. This exact situation is rendered below:
 
<input type="checkbox" onchange="show_vectors^=1;gradient_example({currentTarget: document.getElementById('gradient')}, show_vectors)">show vectors</input>
<canvas id="gradient" onpointermove='gradient_example(event, show_vectors)' onmousemove='gradient_example(event, show_vectors)'></canvas>
<script>
let show_vectors = false;
gradient_example({currentTarget: document.getElementById('gradient')}, show_vectors);
</script>

When you interact with the image, you'll notice a line originating at your cursor and pointing to the brightest region of the image. This vector $\nabla f$ is the _gradient_ approximated with finite differencing. 

The vector is compose of two values, how much $f$'s value changes with a small change in $x$ and a small change in $y$. These are each written as $\frac{\partial f}{\partial x}$ and $\frac{\partial f}{\partial y}$ respectively. This notation indicates that each of these quantities are _partial derivatives_, which means that they each only tell _part_ of the gradient's story.
$$
\nabla f =
\nabla f(x, y) =
\begin{bmatrix}
\frac{df}{dx} \\
\frac{df}{dy}
\end{bmatrix} \approx 
\begin{bmatrix}
\lim_{\Delta x \to 0} \frac{f(x + \Delta x, y) - f(x, y)}{\Delta x} \\
\lim_{\Delta y \to 0} \frac{f(x, y + \Delta x) - f(x, y)}{\Delta y}
\end{bmatrix}
$$

More generally, a gradient of a function $f(x_1, x_2, \dots, x_n)$ is a vector made up of all the partial derivatives of $f$ with respect to its inputs:

$$
\nabla f = \nabla f(x_1, x_2, \dots, x_n) = \left( \frac{\partial f}{\partial x_1}, \frac{\partial f}{\partial x_2}, \dots, \frac{\partial f}{\partial x_n} \right)
$$

Each partial derivative, $\frac{\partial f}{\partial x_i}$, measures how $f$ changes when only $x_i$ changes, keeping all the other variables fixed.

Numerical gradients can be computed using a method similar to finite differencing. To approximate the gradient with respect to a variable $x_i$, we calculate the value of the function $f(x_1, \dots, x_n)$ at two points: one at $x_i$ and one at $x_i + \Delta x$, while keeping all other variables constant. The partial derivative is then the ratio of the change in $f$ over the change in $x_i$:

$$
\frac{\partial f}{\partial x_i} \approx \frac{f(x_1, \dots, x_i + \Delta x, \dots, x_n) - f(x_1, \dots, x_i, \dots, x_n)}{\Delta x}
$$

<!-- ### What Does the Gradient Mean?

The gradient points in the direction where the function $f$ increases the fastest. Its size, or magnitude, tells us how steep that increase is. For example, if $f(x, y)$ represents the height of a hill, the gradient at any point $(x, y)$ shows the direction of the steepest slope and how steep it is. 

Another way to think about it is that the gradient is always perpendicular to the "level curves" of the function. These are the curves where $f(x, y)$ is constant, like contour lines on a map. 
 -->