~article policy gradient ml machine learning
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
# Policy Gradient

Imagine teaching a robot to navigate a maze, not by showing it the way, but by letting it learn through trial, error, and reward. This is the essence of policy gradient methods—one of the most dynamic and adaptable approaches in reinforcement learning. Unlike traditional algorithms, these techniques empower AI to develop complex decision-making strategies from scratch, optimizing actions to achieve long-term goals. In this article, we’ll unravel the mechanics behind policy gradients, exploring how they blend mathematics and intuition to revolutionize autonomous systems, from gaming AIs to robotics. Let’s dive into the science of teaching machines to think for themselves!

One quick Google search on the keywords "policy gradient" will turn up hundreds of articles, repositories and videos describing various policy gradient methods. Many of these resources only provide a surface level explaination of how and why policy gradient methods work, or they simply regurgitate text or equations from the literature. My goal in writing this article is to share intuitions that I've built while deeply studying policy gradient methods, specifically the seminal REINFORCE algorithm.


<canvas id="policy_gradient_ex"></canvas>

<center>
<input type="radio" id="targ_left" name="target" onclick="basic.target=0"/>
<label for="targ_left">left</label>
<input type="radio" id="targ_middle" name="target" checked onclick="basic.target=1"/>
<label for="targ_middle">middle</label>
<input type="radio" id="targ_right" name="target" onclick="basic.target=2"/>
<label for="targ_right">right</label>
</center>
<center>
<button onclick="theta=randmat(1,3)">reset</button>
</center>

<script>
let theta = randmat(1, 3);
setInterval(() => {
    let T = basic.sample_trajectory(theta);
    theta = optimize(basic.pi, theta, T);

	clear("policy_gradient_ex");
	let labels = [`left: ${T.A_pr[0][0].toFixed(3)}`, `middle: ${T.A_pr[0][1].toFixed(3)}`, `right: ${T.A_pr[0][2].toFixed(3)}`];
	draw_probabilities("policy_gradient_ex", T.A_pr[0], labels, undefined, undefined, 
	(ctx, i, x, y) => {
		if (T.A[0] == i-1) {
			ctx.strokeStyle = color('LightGray');
			ctx.beginPath();
			ctx.arc(x, y, 5, 0, 2 * Math.PI);
			ctx.stroke();
		}
	});
}, 16);
/*
let theta = randmat(3, 4); // , randmat(8, 2)];
let T = [platform.sample_trajectory(theta)];
let t = 0;
let best_T = 0;
let best_R = 0;
let last_reward = 0;
let avg_len = 0;
setInterval(() => {	

	console.assert(T[best_T].X[t]);
	platform.draw("policy_gradient_ex", T[best_T].X[t]);
	let ctx = ctx_cache(document.getElementById("policy_gradient_ex"));
	let left_top = [0, 0];
	let dpr = window.devicePixelRatio || 1;
	let right_bottom = [ctx.canvas.width/dpr, ctx.canvas.height/dpr];
	let w = right_bottom[0] - left_top[0];
	let h = right_bottom[1] - left_top[1];

	ctx.font = '16px JetBrains Mono';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'bottom';
	ctx.fillText('Reward: ' + last_reward, left_top[0] + w / 2, left_top[1] + 20);
	ctx.fillText('avg_len: ' + avg_len, left_top[0] + w / 2, left_top[1] + 40);

	t++;
	if (t >= T[best_T].X.length) {
        let R = 0;
        avg_len = 0;
        const epochs = 50;

	    T = []
	    for (let e = 0; e < epochs; e++) {
	    	T.push(platform.sample_trajectory(theta));
	    	let T_r = 0;
	        for (let t = 0; t < T[e].R.length; t++) {
	            T_r += T[e].R[t];
	        }
	        if (T_r > best_R || e == 0) { best_R = T_r; best_T = e; }
	        R += T_r;
		    avg_len += T[e].R.length;
	    }
	    theta = optimize(platform.pi, theta, T, {
	    	alpha: 0.1,
	    });

        avg_len /= epochs
        last_reward = R / epochs;
        console.log("avg_len: " + avg_len);
        console.log(theta);
		t = 0;
	}
}, 16);
*/
</script>


To begin, lets explore the meaning of the words 'Policy' and 'Gradient' in this context.

### Policy
Put simply, a policy is an abstract construct which makes a decision given some context. For the purpose of this article a policy is a function. Often in literature, a policy is written as something like:

$$
\pi(x) \rightarrow a
$$

What this expression gestures at is very simple. A policy $\pi$ is a function which accepts a state $x$ and yields an action $a$. The state and action could be anything, but in practice they are usually numerical - scalars, vectors and matices are all common.

Let's look at a simple example of what a policy function could look like. Consider a policy that accepts as its state a scalar value which is the probablity of rain for that day, and returns a scalar value which is the probability that you will bring an umbrella with you. This policy could be written as a piecewise function like this:

$$
\pi(x) =
\begin{cases}
    1, & \text{if } x \geq 0.5 \\
    0, & \text{if } x < 0
\end{cases}
$$

What this policy is saying is that if the probability of rain $x$ is greater than or equal to 0.5, then you will bring an umbrella, otherwise you will not. This is a very simple policy, but it is a policy nonetheless. Lets consider the same policy, but with a slight update to the notation:

$$
\pi(\theta, x) \rightarrow a
$$

In this notation $\theta$ are the parameters of the policy. The parameters are a set of values that the policy function uses in conjuction with the features $x$ to make its decision. This same concept can be expressed with other notational variants too, for example $\pi_{\theta}(a | x)$ states that the policy $\pi$ with parameters $\theta$ returns the action $a$ given state $x$. Lets look a what our previous policy would look like in this notation:

$$
\pi_{\theta}(x) =
\begin{cases}
	1, & \text{if } x \geq \theta \\
	0, & \text{if } x < \theta
\end{cases}
$$

Do you see what I did there? I replaced the constant 0.5 with the parameter $\theta$. This is a very simple example, but it demonstrates the concept of a parameterized policy. With this small alteration, it enables us to control the behavior of the policy by adjusting the parameter $\theta$.

I mentioned earlier that a policy could be any function, the last example is a piecewise function, but what if we were to represent the policy a bit differently:

$$
\pi_{\theta}(x) = \theta x
$$

In this example, the policy is a linear function of the state. The parameter $\theta$ is a scalar value that the state is multiplied by. This policy is a bit more flexible than the previous one, because it can represent a continuous range of behaviors depending on the value of $\theta$. Play with the slider below to see how manipulating $\theta$ changes the action $a$ for any given value of $x$.


<canvas id="rain_linear_policy"></canvas>
<script>
function rain_linear_policy(theta) {
	// let period = slider_param(event);
	clear("rain_linear_policy");
	plot("rain_linear_policy", (x, p) => { return 0; }, {'lineDash': [10, 10], 'strokeStyle': 'LightGray'});
	plot("rain_linear_policy", (x, params) => { return theta * x; }, {'label': {'text': 'a', 'x': 1}});

	// let ctx = ctx_cache(document.getElementById("rain_linear_policy"));
	// ctx.clearRect(0, 0, ctx.width, ctx.height);
	// ctx.beginPath();
	// ctx.arc(px(ctx, 0), py(ctx, 0), 3, 0, 2 * Math.PI);
	// ctx.fillStyle = color('LightGray');
	// ctx.fill();
}
rain_linear_policy()
</script>
<label for="rain_theta_slider">$\theta$</label>
<input name="rain_theta_slider" type="range" min="-1" max="1" value="0" step="any" oninput="rain_linear_policy(slider_param(event))">

Policies implemented as linear combinations of features like the example above are simple, and in many cases sufficient for solving certain problems. In practice  policies are often represented with more complex functions that have greater approximation power such as support-vector-machines or neural networks.

### Balance World

Lets move to a slightly more interesting problem, so we can design a more interesting policy. Instead of the umbrella problem, lets consider a 2D environment with a bounded platform which can pivot about its center. On the platform rests a ball which can roll on the surface. Our goal will be to keep the ball balanced in the center of the platform.

<canvas id="platform_ex"></canvas>
<script>
// let platform_ex_state = [0, 0, 0];
// function platform_ex(theta) {
// 	// let period = slider_param(event);
// 	platform_ex_state[0] = theta;
// 	platform.draw('platform_ex', platform_ex_state);
// }

// setInterval(() => {
// 	platform_ex_state = platform.update(platform_ex_state);
// 	platform.draw("platform_ex", platform_ex_state);
// }, 16);
</script>
<label for="platform_thetas">tilt</label>
<input name="platform_thetas" type="range" min="-1" max="1" value="0" step="any" oninput="platform_ex_state[0]=slider_param(event)">

We will represent the state of this system as the following vector in a continuous state space.

$$
x = \begin{bmatrix}
\theta & x & \delta{x}
\end{bmatrix}^T
$$

Where $\theta$ is the angle of the platform, $x$ is the position of the ball on the platform relative to the fulcrum point and $\delta{x}$ is the velocity of the ball along the $x$ axis. The action space is also continuous. The policy will choose to adjust the platform angle by some $\delta{\theta}$ in each time-step.

#### Actions
A natural fit for a continuous action space would be to generate a continuous action, but for the purpose of illustration lets first consider how a policy might be implemented that uses a _discrete action space_. We will give the policy three possible choices in each time-step. These choices will be:

* Tilt left
* Do nothing
* Tilt right

To do this, we will have the policy return a vector which describes the probability of taking any one of these actions given the current state. This means that $a \in {\rm I\!R}^3$, and our policy will be some function mapping $x \in {\rm I\!R}^3 \rightarrow a \in {\rm I\!R}^3$. To keep it simple we will again use a linear combination of features, like our parameterized umbrella example. Matrix multiplication is a convinient way to represent this linear combination of features. This time our parameters will be a 4x3 matrix $\Theta$. The last column stores the biases for our linear model which will allow the policy to make decisions even when the state is 0. For the biases to contribute, we will need to augment our state with a 1 which also makes the shapes compatible (1x4 and 4x3). The policy function will look like this:

$$
\pi_{\Theta}(a | x) = softmax([x; 1] \Theta)
$$

We wrap the output of the linear combination in a softmax function to ensure that the output is a probability distribution. Namely ensuring that the sum of the probabilities is 1. 

These probabilities will be used as parameters for a multinomial distribution. We can sample from the distribution as long as we can generate a uniform random number. This can be done by incrementally computing the cumulative sum of the probabilities and checking if the random number is less than the cumulative sum.

```javascript
function sample_multinomial(p) {
	let r = Math.random();
	let c = 0;
	for (let i = 0; i < p.length; i++) {
		c += p[i];
		if (r < c) {
			return i;
		}
	}
}
```

Choosing an action randomly, but not too randomly is a good way to explore the environment and learn about the consequences of actions this will be crucial later for learning a good policy.

Here's an example of what this policy with randomized parameters looks like in action:

<canvas id="platform_random_policy"></canvas>
<script>
let platform_random_policy_x = [0, 0, 0];
let random_W = randmat(6, 3)

// setInterval(() => {
// 	platform_random_policy_x = [0, 0, Math.random()-0.5];
// }, 3000);

// setInterval(() => {
// 	platform_random_policy_x = platform.update(platform_random_policy_x);
// 	// platform_random_policy_x.push(1) // augment with a 1 so that bias parameters can contribute

// 	let a = platform.pi(random_W, platform_random_policy_x);

// 	switch(a.idx) {
// 		case 0: platform_random_policy_x[0] -= 0.01; break;
// 		case 1: break;
// 		case 2: platform_random_policy_x[0] += 0.01; break;
// 		default:
// 			break;
// 	}

// 	const e = document.getElementById("platform_random_policy");
// 	const ctx = ctx_cache(e);

// 	platform.draw("platform_random_policy", platform_random_policy_x, [ctx.width / 2, 0], [ctx.width, ctx.height]);
// 	ctx.clearRect(0, 0, ctx.width / 2, ctx.height);
// 	platform.draw_probabilities("platform_random_policy", a.pr, ['left', 'none', 'right'], [10, 20], [ctx.width / 2, ctx.height]);
// }, 16);
</script>

It's clear that choosing random parameters like we have done above doesn't get us very close to our goal of balancing the ball. So how can we choose better parameters? One possible solution is just ahead, but first lets examine the core of that solution, _graidents_.

### Gradient

Fundementally, the gradient is a multi-dimensional generalization of the derivative and is synonomous with the idea of the slope of a function. Before we dive into the details of how the gradient is used in policy gradient methods, lets take a moment to review derivatives.

#### Derivatives

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

	
	let f = (x) => { return Math.sin(x); }//{ return Math.pow(x, 2) - 1; };
	let slope = fin_diff(f, derivative_x, derivative_dx);
	let df = (x) => { return slope * (x-derivative_x) + f(derivative_x); };

	plot("derivative", (x, p) => { return 0; }, {'lineDash': [10, 10], 'strokeStyle': color('LightGray')});
	plot("derivative", (x, p) => { return f(x); }, {});
	plot("derivative", (x, p) => { return df(x); }, {'strokeStyle': color('LightGray')});

	let ctx = ctx_cache(document.getElementById("derivative"));

	ctx.beginPath();
	ctx.setLineDash([10, 10]);
	ctx.moveTo(px(ctx,derivative_x+derivative_dx), py(ctx,f(derivative_x+derivative_dx)));
	ctx.lineTo(px(ctx,derivative_x+derivative_dx), py(ctx,0));
	ctx.strokeStyle = color('LightGray');
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(px(ctx,derivative_x), py(ctx,f(derivative_x)), 3, 0, 2 * Math.PI);
	ctx.fillStyle = color('LightGray');
	ctx.fill();
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

#### Gradients

A gradient is like a derivative, but for functions with more than one input. While a derivative gives the slope of a single-variable function, a gradient tells us the direction and rate of the steepest increase for a function with multiple variables.

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

The vector is compose of two values, how much the function's value changes with a small change in $x$ and a small change in $y$. These are each written as $\frac{\partial f}{\partial x}$ and $\frac{\partial f}{\partial y}$ respectively. This notation indicates that each of these quantities are _partial derivatives_, which means that they each only tell _part_ of the gradient's story.
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
### Policy Gradient

Right, so lets get into the meat of the article, the REINFORCE algorithm. Lets enumerate the crucial ideas that enable this algorithm to work.

#### Reward

A ubiquitous concept in reinforcement learning is the idea of a reward. A reward is a scalar value that is used to evaluate the goodness of an action taken by an agent. The agent's goal is to maximize the total reward it receives over time. In the context of the platform example, a reward could be the negative distance between the ball and the center of the platform. The agent would then seek to minimize this distance by adjusting the platform angle.

<textarea>
function reward(x) {
	return -Math.abs(x[1]);
}
</textarea>

#### Monte Carlo Methods

[Monte Carlo methods](https://en.wikipedia.org/wiki/Monte_Carlo_method) are a class of algorithms that rely on random sampling to obtain numerical results. For the REINFORCE algorithm, this manifests as repeating experiements with a randomized initial state. We sample actions from the policy and observe the rewards that result from those actions. 

#### Probability of Actions

A fundemental part of the REINFORCE algorithm is our ability to compute the probability of any action chosen by the policy. The difficulty of doing this varies depending on the action space. A discrete action space is trivial. For example, let's say for a state at time $t$, $x_t$ our policy computes

$$
\pi_\Theta(x_t) \rightarrow a_t
$$

and the probabilities of each action the following probabilities for each action class in $a_t$ are:


| Action | Probability |
|--------|-------------|
| left   | 0.2         |
| none   | 0.6         |
| right  | 0.2         |


The action our policy chose at time $t$ was 'none'. The probability of this action having been taken is exactly the probability of the action class 'none' which is 0.6. Straight forward!

But what if the action space was continuous? In this case, we would need to compute the probability of the action taken by the policy. This can be done by evaluating the probability density function of the action taken by the policy. This is a bit more complex, but can be done with the [probability density function](https://en.wikipedia.org/wiki/Probability_density_function) of the action space.


#### More of the Good, Less of the Bad



<!-- #### Policy Gradient Theorem

The policy gradient theorem is a fundamental result in reinforcement learning that provides a way to compute the gradient of the expected reward with respect to the policy parameters. The theorem is a cornerstone of policy gradient methods, enabling us to optimize the policy by following the gradient of the expected reward.

The theorem states that the gradient of the expected reward with respect to the policy parameters is the expected value of the gradient of the reward with respect to the policy parameters:

$$
\nabla_{\theta} J(\theta) = \mathbb{E}_{\tau \sim p_{\theta}(\tau)} \left[ \nabla_{\theta} \log p_{\theta}(\tau) R(\tau) \right]
$$

Where:
* $\nabla_{\theta} J(\theta)$ is the gradient of the expected reward with respect to the policy parameters.
* $\mathbb{E}_{\tau \sim p_{\theta}(\tau)}$ is the expected value over trajectories sampled from the policy.
* $\nabla_{\theta} \log p_{\theta}(\tau)$ is the gradient of the log probability of the trajectory with respect to the policy parameters.
* $R(\tau)$ is the reward of the trajectory. -->




