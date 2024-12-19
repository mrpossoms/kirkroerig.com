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
### TODO
1. Policy jargon shouldn't be frontloaded in the intro
2. Glossary of key terms up front
3. Summary at end
4. Probably remove the log probability thing, maybe save this for a follow-up
5. Interactive term definitions

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
when_visible("policy_gradient_ex", (visible) => {
	animate("policy_gradient_ex", 100)
	.using(() => {    
	let T = basic.sample_trajectory(theta);

    if (T.A_pr[0][basic.target] < 0.9) {
        theta = optimize(basic.pi, theta, T);
    }

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
    })

})
	.when(visible);
});
/*
setInterval(() => {
    let T = basic.sample_trajectory(theta);

    if (T.A_pr[0][basic.target] < 0.9) {
        theta = optimize(basic.pi, theta, T);
    }

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
}, 100);
*/
</script>

In the example above we have a simple environment with three possible actions _left_, _middle_ and _right_. The corresponding buttons allow you to select which action you want to reward the policy for choosing, and what actions it is penalized for choosing. 

The number next to each action in the visualization is the probability that the policy will choose that action. A circle is drawn next to the action that is choosen by the policy for each frame.

You'll notice that the policy will start to choose the action that you reward it for more often. The core idea of Policy Gradient Methods is intuative, and boils down to just one objective:

* **Adjust** the **policy** to **Increase** the **probability** of **actions** that lead to **good** outcomes.

We can achieve this by adjusting our policy using this guiding principle, but first we need to answer some fundamental questions:

* [What is a **policy**?](#policy)
* [How do we measure the **goodness** or **badness** of an action?](#reward)
* [How do we calculate the **probability** of an **action**?](#action-probability)
* [How do we **adjust** our policy to maximize the **goodness** of its actions?](#optimization)

--------------------------------------------------------------------------------

## What is a **policy**? <a name="policy"/>

Put simply, a policy is a function which makes a decision (action $a$) given some context (or state $x$). Often in literature, a policy is written as something like:

$$
\pi(x) \rightarrow a
$$

What this expression gestures at is very simple. A policy $\pi$ is a function which accepts a state $x$ and yields an action $a$. The state and action could be anything, but in practice they are usually numerical - [scalars](https://en.wikipedia.org/wiki/Scalar_(mathematics)), [vectors](https://en.wikipedia.org/wiki/Vector_(mathematics_and_physics)) and [matrices](https://en.wikipedia.org/wiki/Matrix_(mathematics)) are all common.

Let's consider the interactive example. How is that policy defined, and how does it work? Let's write it out mathematically.

$$
\pi_{\Theta}(a | x) = softmax(x \Theta)
$$

You probably noticed that the notation changed a bit. So let's break each part of it down to understand what it means.

$$
\pi_{\Theta}
$$

The policy function now includes a little $\Theta$ subscript. This indicates that the policy is _parameterized_ by the variable $\Theta$. Essentially, this means that the policy function, in addition to the state $x$, accepts some parameters $\Theta$ which we can adjust to change the policy's behavior. We could have written this as $\pi(\Theta, x)$, but that notation is not as common. Concretely, the definition of $\Theta$ for our example above is:

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

Now this part of the expression contains the actual guts of our policy. It shows that the state $x$ is multiplied by the parameters $\Theta$ and are passed through a [softmax](https://en.wikipedia.org/wiki/Softmax_function) function (again, $x$ is 1 in our example, so this simplifies to just $\Theta$). The softmax function is a way of transforming a vector of numbers into a probability distribution. It does this by exponentiating each element of the vector and then normalizing the result. The softmax function is

$$
softmax(z) = \frac{e^{z}}{\sum_{i} e^{z_i}}
$$

You could expect the softmax function to return a vector of probabilities that sum to 1. This is because the exponential function is always positive, and the sum of the exponentials in the denominator normalizes the probabilities to sum to 1. One of these vectors may very well look like this:

$$
pr_t = [ 0.1, 0.6, 0.3]
$$



_TODO: add a toy that gives a feel for how the softmax function reacts to inputs_

Great, so this enables us to calculate the probability distribution for all actions given a state $x$ and our policy parameters $\Theta$, but how do we actually choose which action to take?

We can sample from the distribution as long as we can generate a uniform random number on the interval $[0, 1)$. This can be done by incrementally computing the cumulative sum of the probabilities and checking if the random number is less than sum.


```javascript
function sample_multinomial(p) {
    let r = Math.random(); // real number between 0 and 1
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

## How do we measure the *goodness* or *badness* of an action? <a name="reward"/>

Now that we understand what a policy is, and how it can choose actions, we need to understand how we can measure the goodness or badness of an action.

This is where the **reward function** comes in. The reward function is a function that takes as input the state and action and returns a scalar value which represents the goodness or badness of the action. This scalar value is called the **reward**.

The reward function could be defined to theoretically score _any_ behavior. Be it driving a car, or playing a game. Actually games are a great example to illustrate this point. In a game, the **reward function** could be the scoring system, or the number of enemies killed, or the number of coins collected.

In our example, the state is always 1 so we ignore it. The reward is 1 when the policy chooses the target action and -1 when it chooses the other actions. Put more formally:

$$
R(x_t, a_t) =
\begin{cases}
    +1, & \text{if } a_t = a_{target} \\
    -1, & \text{otherwise}
\end{cases}
$$

Defining the reward function with both positive and negative rewards allows us to guide the policy towards actions that lead to good outcomes more quickly, we will explore why this is the case later.

_TODO: actually explain this point in the optimization section_

--------------------------------------------------------------------------------

## How do we calculate the probability of an action? <a name="action-probability"/>

We've already seen how the policy can calculate the probability distribution over its actions given a state. But how do we calculate the probability of a specific action being taken? Take for example a probability distribution returned by our policy:

$$
pr_t = [ 0.1, 0.6, 0.3]
$$

With an action it chose:

$$
a_t = 0
$$

What is the probability of the action $a_t$ being taken? In the case of our example, it's very simple. The probability of an action being taken is exactly the action's probability in the distribution calculated by the policy, 0.1 or 10%.

This is the case because all of our actions in this distribution (_left_, _middle_, and _right_) are mutually exclusive. You can not have an action that combines _left_ and _middle_.

### Probability of independent actions <a name="independent-action-probability"/>

But what if you had an action space that was not mutually exclusive? Say instead we are controlling a robot in a 2D space, and the actions are the robot's direction along the x **AND** y axis. Where the options along the x axis are _left_, _none_, and _right_, and along the y axis are _up_, _none_, and _down_. 


$$
pr_{x_t} = [ 0.1, 0.6, 0.3 ]
$$

$$
pr_{y_t} = [ 0.2, 0.3, 0.5 ]
$$

Now say it chose an action:

$$
a_t = \begin{bmatrix} 
a_{x_t} = 0 \\
a_{y_t} = 1 \\
\end{bmatrix}
$$

What is the probability of the action $a_t$ being taken? This is a bit more complex, but can be done by evaluating the probability density function of the action space. This amounts to multiplying the probabilities of each action class in $a_t$:

$$
pr_t = pr_{x_t}[a_{x_t}] * pr_{y_t}[a_{y_t}]
$$

In this case the probability of the action taken by the policy is $0.1 * 0.3 = 0.03$ or 3%. This can be generalized to any number of actions and action spaces by multiplying the probabilities of each action class in the action space:

$$
Pr_a(pr_t, a_t) = \prod_{i} pr_{t_i}[a_{t_i}]
$$

While this is mathematically correct. A trick you can use to make this easier to compute is to take the log of the probabilities and sum them. This is because the log of a product is the sum of the logs of the factors.

$$
\log pr_t = \sum_{i} \log pr_{t_i}[a_{t_i}]
$$

You will often see this trick used in practice because it is more numerically stable than simply multiplying probabilities together.

--------------------------------------------------------------------------------

## How do we adjust our policy to maximize the **goodness** of its actions? <a name="optimization"/>

We've gotten all the prerequisites out of the way, now we can finally get to the meat of the Policy Gradient Methods. To restate, what we want to do is adjust the policy to increase the probability of actions that lead to good outcomes.

To do this, we will compute the [_**gradient**_](/article/gradient) of the probability of the policy's chosen action $a_t$ with-respect-to the policy's parameters $\Theta$. 

$$
\nabla_{\Theta} = {\Large \begin{bmatrix}
\frac{\partial pr_{a_t}}{\partial \theta_0} & \frac{\partial pr_{a_t}}{\partial \theta_1} & \frac{\partial pr_{a_t}}{\partial \theta_2} \\
\end{bmatrix}}
$$

where

$$
pr_t = \pi_{\Theta}(x)
$$

$$
a_t = \text{argmax}(pr_t)
$$

$$
pr_{a_t} = Pr_a(pr_t, a_t)
$$


Each of the partial derivatives could be computed analytically using the chain rule, but in our example we will use a numerical approximation to the gradient using finite differencing. Finite differencing is a method of approximating the derivative of a function by evaluating the function at two points and taking the ratio of the change in the function over the change in the input.

$$
\frac{\partial pr_{a_t}}{\partial \theta_i} \approx \frac{pr_{a_t}(\Theta + \Delta \theta_i) - pr_{a_t}(\Theta)}{\Delta \theta_i}
$$

Where $\Delta \theta_i$ is a small perturbation to the parameter $\theta_i$. We will repeat this computation for each of the parameters in $\Theta$ to get the full approximated gradient $\nabla_{\Theta}$.

With the gradient in hand, we can finally adjust the policy's parameters to increase the probability of actions that lead to good outcomes. This is done by taking a step in the direction of the gradient using a technique called _gradient ascent_.

$$
{\Large \Theta' \leftarrow \Theta + \alpha (\nabla_{\Theta} * R(x_t, a_t))}
$$


In essence that's it! We just repeat this sequence until our policy's actions converge to what we want. 

1. Evaluate the policy to get the probability distribution of actions.
2. Sample an action from the distribution.
3. Compute the reward of the action.
4. Compute the gradient of the action's probability with respect to the policy's parameters.
5. Adjust the policy's parameters to increase the probability of the action.
6. Repeat!

This example and article are akin to a "hello world!" of Policy Gradient Methods. In practice, there are many more considerations and optimizations that need to be made to make the algorithm work well with complex problems. But this should give you a good starting intuition to understand the core ideas of Policy Gradient Methods.

# A More Interesting Example

Now you should have a reasonable understanding of the core ideas of Policy Gradient Methods. Let's look at a more interesting example to see how these ideas can be applied to a more complex problem. We will draw on the example alluded to in the [How do we calculate the probability of an action?](#action-probability) section, and consider a 2D robot that can move in any direction. What changes do we need to make to our policy and reward function to handle this problem? Lets find out!

## Environment

To begin, let's describe the environment. The environment will consist of a target 'x' at the center of the screen. The robot 'o' will be spawned at a random location and will be able to move in any direction. The robot's objective will be to reach the target 'x'.

## Action Space

Like the example we examined earlier in ['Probability of independent actions'](#independent-action-probability), the robot will be able to vertically and horizontally. The action space will be defined as:

* vertical: _up_, _none_, _down_
* horizontal: _left_, _none_, _right_

Vertical and horizontal will be _independent random variables_ and will not influence each other. This means that the robot can move in any direction at any time.

## State Space

The state space will consist of the robot's current position and the target's position. The state space will be defined as:

$$
x_t = \begin{bmatrix} 
x_{robot} \\
y_{robot} \\
x_{target} \\
y_{target} \\
\end{bmatrix}
$$

## Policy

Like the policy in the 'hello world!' style example, this policy will be a simple linear map. The input to the policy will not directly be the state space, instead it will be a feature vector derived from the state space. The feature vector will be defined as:

$$
\Delta{x} = x_{robot} - x_{target}
$$
$$
\Delta{y} = y_{robot} - y_{target}
$$
$$
\phi(x_t) = \begin{bmatrix} 
\Delta{x} / \sqrt{\Delta{x}^2 + \Delta{y}^2}\\
\Delta{y} / \sqrt{\Delta{x}^2 + \Delta{y}^2}\\
\end{bmatrix}
$$

The vector $\phi(x_t)$ will be our _feature vector_, the input to the policy. This feature vector is simply the direction from the robot to the target normalized to a unit vector. Normalizing the vector ensures that the policy is invariant to the distance between the robot and target.

With our feature vector in place we can define the 2x6 matrix $\Theta$ which will map our feature vector to the probability distribution of actions:

$$
\Theta = \begin{bmatrix}
\theta_{00} & \theta_{01} & \theta_{02} & \theta_{03} & \theta_{04} & \theta_{05} \\
\theta_{10} & \theta_{11} & \theta_{12} & \theta_{13} & \theta_{14} & \theta_{15} \\
\end{bmatrix}
$$

Our policy will mulitply the feature vector by the policy parameters. The resulting vector will be sliced into two vectors, one for the vertical actions and one for the horizontal actions. Each of these vectors will be passed through a softmax function to get the probability distribution of actions.

$$
\pi_{\Theta}(x_t) = \begin{bmatrix}
softmax([z_0, z_1, z_2]) \\
softmax([z_3, z_4, z_5] \\
\end{bmatrix}
$$
where
$$
z = \phi(x_t) \Theta
$$

This policy will return two probability distributions, one for the vertical actions and one for the horizontal actions. Just like the last example, we will sample from each of these to determine what horizontal and vertical actions the robot will take.

## Reward Function

The reward function is simple. The reward and pentalty will be exactly how much closer or further away the robot moves from the target in a given step. We can implement this as:

$$
R(x_{t-1}, x_t) = dist(x_{{t-1}_{robot}}, x_{{t-1}_{target}}) - dist(x_{{t}_{robot}}, x_{{t}_{target}})
$$
where
$$
dist(a, b) = \sqrt{(a_x - b_x)^2 + (a_y - b_y)^2}
$$

## Optimization

Here things are a little different from the simple example. In that example the policy computes a single action for which we give some reward or penalty, then immediately adjust the policy parameters. In this example we will sample a _trajectory_. Each trajectory begins from a random initial state (a randomized starting position for the robot). Sampling a trajectory involves the following steps.

<canvas id="policy_gradient_montecarlo"></canvas>
<script>
let rand_theta = randmat(2, 6);
let mc_trajectories = [];
let mc_t = 0;
for (let i = 0; i < 20; i++) {
    mc_trajectories.push(puck.sample_trajectory(rand_theta, false));
}
when_visible("policy_gradient_montecarlo", (visible) => {

    animate("policy_gradient_montecarlo", 100)
    .using(() => {
        clear("policy_gradient_montecarlo");
        let T = mc_trajectories;
        for (let i = 0; i < T.length; i++) {
            puck.draw("policy_gradient_montecarlo", mc_t % T[i].X.length, T[i]);
        }
        mc_t++;
    })
    .when(visible);
});
</script>

<!--
1. Generate a random inital state $x_0$, $0 \rightarrow t$
2. Pass state $x_t$ to policy, compute an action $a$
3. Pass $a$ to environment, record returned reward $r$ and updated state $x_{t+1}$
4. Increment $t+1 \rightarrow t$
4. If $t < \text{max time}$, goto 2
5. return trajectory
-->

This technique of random sampling considered a [_Monte Carlo Method_](https://en.wikipedia.org/wiki/Monte_Carlo_method) and is a common method for training policies in reinforcement learning.


<canvas id="policy_gradient_ex2"></canvas>
<canvas id="policy_gradient_ex2_reward"></canvas>
<script>
let t = 0;
let puck_theta = [
  [
    -0.06344286448017344,
    -0.013060742152890104,
    0.3612000714595811,
    -0.265469954891274,
    -0.25405646928285,
    -0.2317468792603885
  ],
  [
    -0.32516165515685724,
    -0.03432296246933131,
    0.383052435694907,
    0.2915076462546815,
    0.046673970000944864,
    -0.17635189577351218
  ]
]; // since rng seeding isn't possible, we start intentionally with a bad policy

let T = puck.sample_trajectory(puck_theta, true);
let R = []

when_visible("policy_gradient_ex2", (visible) => {
	animate("policy_gradient_ex2", 16)
	.using(() => {
	    clear("policy_gradient_ex2");
	    clear("policy_gradient_ex2_reward");
	    puck.draw("policy_gradient_ex2", t, T);
	    draw_reward_plot("policy_gradient_ex2_reward", R);
	    t++;

	    if (t >= T.X.length) {
	        t = 0;
	        let avg_ret = 0;
	        const epochs = 100;
	        for (let e = 0; e < epochs; e++) {
	            T = puck.sample_trajectory(puck_theta);
	            puck_theta = optimize(puck.pi, puck_theta, T, {
	                alpha: 0.05,
	                pi_pr: (theta, x, a) => {
	                    let y = puck.pi(theta, x);
	                    return y.pr[0][a[0]] * y.pr[1][a[1]];
	                }
	            });
	            avg_ret += T.R.reduce((acc, val) => acc + val, 0);
	        }
	        console.log(avg_ret / epochs);
	        R.push(avg_ret / epochs);
	        // Generate the next visualization traj
	        T = puck.sample_trajectory(puck_theta, true);
	    }
	})
	.when(visible);
});


setInterval(() => {

}, 16);
</script>

