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

There's something magical about the idea of a machine that can learn to play a game, drive a car, or even walk, all on its own. Yet, exactly this is the domain of [Reinforcement Learning]().

Reinforcement learning (RL) encompasses a multitude of techniques and algorithms which can be employed to achieve goals like these. In my humble opinion, one of the most elegant RL algorithms are Policy Gradient Methods. 

Let's look at a simple example which demonstrates the core idea of Policy Gradient Methods.

<canvas id="policy_gradient_ex"></canvas>
<center>
<form autocomplete="off">
<input type="radio" id="targ_left" name="target" onclick="basic.target=0"/>
<label for="targ_left">left</label>
<input type="radio" id="targ_middle" name="target" checked="checked" onclick="basic.target=1"/>
<label for="targ_middle">middle</label>
<input type="radio" id="targ_right" name="target" onclick="basic.target=2"/>
<label for="targ_right">right</label>
</form>
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
	let labels = [`left: ${parseInt(T.A_pr[0][0]*100)}%`, 
		          `middle: ${parseInt(T.A_pr[0][1]*100)}%`, 
                  `right: ${parseInt(T.A_pr[0][2]*100)}%`];
	draw_probabilities("policy_gradient_ex", T.A_pr[0], labels, undefined, undefined, 
	(ctx, i, x, y) => {
		if (T.A[0] == i-1) {
			ctx.strokeStyle = color('LightGray');
			ctx.beginPath();
			ctx.arc(x, y, 5, 0, 2 * Math.PI);
			ctx.stroke();
		}
	});
}, 333);
</script>

In the example above we have a simple environment with three possible actions _left_, _middle_ and _right_. The corresponding buttons allow you to select which action you want to reward the policy for choosing, and what actions it is penalized for choosing. 

The number next to each action in the visualization is the probability that the policy will choose that action. A circle is drawn next to the action that is choosen by the policy for each frame.

You'll notice that the policy will start to choose the action that you reward it for more often. The core idea of Policy Gradient Methods is intuative, and boils down to just two related objectives:

* **Reduce** the probability of taking **actions** that lead to **bad** outcomes.
* **Increase** the probability of taking **actions** that lead to **good** outcomes.

We can achieve this by adjusting our policy using this guiding principle, but first we need to answer some fundamental questions:

* [What is a **policy**?](#policy)
* [How do we measure the **goodness** or **badness** of an outcome?](#reward)
* [How do we calculate the **probability** of an outcome?](#action-probability)
* [How do we **adjust** our policy to maximize the **goodness** of its actions?](#optimization)

--------------------------------------------------------------------------------

## What is a **policy**? <a name="policy"/>

Put simply, a policy is a function which makes a decision given some context (or state). Often in literature, a policy is written as something like:

$$
\pi(x) \rightarrow a
$$

What this expression gestures at is very simple. A policy $\pi$ is a function which accepts a state $x$ and yields an action $a$. The state and action could be anything, but in practice they are usually numerical - scalars, vectors and matices are all common.

Let's consider the interactive example. How is that policy defined, and how does it work? Let's write it out mathematically.

$$
\pi_{\Theta}(a | x) = softmax(x \Theta)
$$

You probably noticed that the notation changed a bit. So let's break each part of it down to understand what it means.

$$
\pi_{\Theta}
$$

The policy function now includes a little $\Theta$ subscript. This indicates that the policy is _parameterized_ by the variable $\Theta$. Essentially, this means that the policy function depends on some parameters which we can adjust to change the policy's behavior. Specifically, the definition of $\Theta$ for our example above is:

$$
\Theta = \begin{bmatrix}
\theta_0 & \theta_1 & \theta_2
\end{bmatrix}
$$

Where each of the $\theta_i$ are the parameters of the policy. Because this is a very simple example our input state $x$ is always 1, and as a result these parameters represent the _relative_ probabilities of each action.

$$
a | x
$$

This should be read as _$a$ given $x$_, and it means that the policy is a conditional probability distribution. This is a fancy way of saying that the policy is a function that returns the probability of each of the possible actions given a state.

$$
softmax(x \Theta)
$$

Now this part of the expression contains the actual guts of our policy. It shows that the state $x$ is multiplied by the parameters $\Theta$ and are passed through a [softmax](https://en.wikipedia.org/wiki/Softmax_function) function. The softmax function is a way of transforming a vector of numbers into a probability distribution. It does this by exponentiating each element of the vector and then normalizing the result. The softmax function is

$$
softmax(z) = \frac{e^{z}}{\sum_{i} e^{z_i}}
$$

Great, so this enables us to calculate the probability distribution for all actions given a state $x$ and our policy parameters $\Theta$, but how do we actually choose which action to take?

We can sample from the distribution as long as we can generate a uniform random number on the interval $[0, 1)$. This can be done by incrementally computing the cumulative sum of the probabilities and checking if the random number is less than sum.


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

Bringing all of this together, the JS implementation of our policy looks something like this:

```javascript
function pi(theta, x) {
	let z = matmul([x], theta);
	let p = softmax(z[0]);             // vector of action probabilities
	let a_idx = sample_multinomial(p); // randomly sample an action from the distribution p

	return { pr: p, idx: a_idx };
}
```
--------------------------------------------------------------------------------

## How do we measure the *goodness* or *badness* of an outcome? <a name="reward"/>

Now that we understand what a policy is, and how it can choose actions, we need to understand how we can measure the goodness or badness of an outcome.

This is where the **reward function** comes in. The reward function is a function that takes as input the state and action and returns a scalar value which represents the goodness or badness of the outcome. This scalar value is called the **reward**.

In our example, the reward is 1 when the policy chooses the target action and -1 when it chooses the other actions. Put more formally:

$$
R(a) =
\begin{cases}
	+1, & \text{if } a = a_{target} \\
	-1, & \text{otherwise}
\end{cases}
$$

Defining the reward function with both positive and negative rewards allows us to guide the policy towards actions that lead to good outcomes more quickly, we will explore why this is the case later.

--------------------------------------------------------------------------------

## How do we calculate the probability of an outcome? <a name="action-probability"/>

We've already seen how the policy can calculate the probability distribution over its actions given a state. But how do we calculate the probability of a specific action being taken? Take for example a probability distribution returned by our policy:

$$
pr_t = [ 0.1, 0.6, 0.3]
$$

With an action it chose:

$$
a_t = 0
$$

What is the probability of the action $a_t$ being taken? In the case of our example, it's very simple. The probability of an action being taken is exactly the action's probability in the distribution calculated by the policy, 0.1 or 10%.

This is the case because all of our actions in this distribution (_left_, _middle_, and _right_) are mutually exclusive. You can not have an action that combinds _left_ and _middle_.

But what if you had an action space that was not mutually exclusive? Say instead we are controlling a robot in a 2D space, and the actions are the robot's direction along the x **AND** y axis. Where are options along the x axis are _left_, _none_, and _right_, and along the y axis are _up_, _none_, and _down_. 


$$
pr_{t_x} = [ 0.1, 0.6, 0.3 ]
$$

$$
pr_{t_y} = [ 0.2, 0.3, 0.5 ]
$$

Now say it chose an action:

$$
a_t = \begin{bmatrix} 
a_{t_x} = 0 \\
a_{t_y} = 1 \\
\end{bmatrix}
$$

What is the probability of the action $a_t$ being taken? This is a bit more complex, but can be done by evaluating the probability density function of the action space. This amounts to multiplying the probabilities of each action class in $a_t$:

$$
pr_t = pr_{t_x}[a_{t_x}] * pr_{t_y}[a_{t_y}]
$$

In this case the probability of the action taken by the policy is $0.1 * 0.3 = 0.03$ or 3%. This can be generalized to any number of actions and action spaces by multiplying the probabilities of each action class in the action space:

$$
pr_t = \prod_{i} pr_{t_i}[a_{t_i}]
$$

While this is mathematically correct. A trick you can use to make this easier to compute is to take the log of the probabilities and sum them. This is because the log of a product is the sum of the logs of the factors.

$$
\log pr_t = \sum_{i} \log pr_{t_i}[a_{t_i}]
$$

You will often see this trick used in practice because it is more numerically stable than simply multiplying probabilities together.

--------------------------------------------------------------------------------

## How do we adjust our policy to maximize the **goodness** of its actions? <a name="optimization"/>


### Policy Gradient

Right, so lets get into the meat of the article, the REINFORCE algorithm. Lets enumerate the crucial ideas that enable this algorithm to work.

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




