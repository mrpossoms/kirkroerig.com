~article,policy,gradient,ml,machine,learning
<script src="/js/math.js"></script>
<script src="/js/ui.js"></script>
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

fieldset {
    border: none;
}
</style>
<!-- ### TODO
1. Policy jargon shouldn't be frontloaded in the intro
2. Glossary of key terms up front
3. Summary at end
4. Probably remove the log probability thing, maybe save this for a follow-up
5. Interactive term definitions
 -->
# Policy Gradient

<canvas id="pg-hook"></canvas>
<script>
let trained_theta = [
  [ -5.2411426220896615, 0.08240532417772563, 5.443433754517182, 0.05314562935127422, -0.7515561637990559, -0.0528628026362152 ],
  [ -0.018673344825325455, 0.06288750088051466, -0.020646319339298745, -5.251316470695126, 0.018008655116941566, 5.395137537266251]
];
when_visible("pg-hook", (visible) => {
    let cvs = document.getElementById("pg-hook");
    let T = puck.sample_trajectory(trained_theta, [0,0], [cvs.clientWidth, cvs.clientHeight], true);
    let t = 0;
	animate("pg-hook", 16)
	.using(() => {
	    clear("pg-hook");
	    puck.draw("pg-hook", t, T);
	    t++;

	    if (t >= T.X.length) {
    T = puck.sample_trajectory(trained_theta, [0,0], [cvs.clientWidth, cvs.clientHeight], true);
            t = 0;
	    }
	})
	.when(visible);
});
</script>

There's something special about the idea of a machine that can learn to play a game, drive a car, or even walk, all on its own. Yet, exactly this is the domain of [Reinforcement Learning](https://en.wikipedia.org/wiki/Reinforcement_learning).

Reinforcement learning (RL) encompasses a multitude of techniques and algorithms which can be employed to achieve goals like these. In my humble opinion, one of the most elegant RL algorithms are [Policy Gradient Methods](https://en.wikipedia.org/wiki/Reinforcement_learning#Direct_policy_search).

The goal of this article is to give an uninitiated audience an intuitive understanding of Policy Gradient Methods through interactive examples. There is a plethora of resources available which dive deep into the mathematics and theory behind these methods, but the core ideas can be distilled. You will get the most from this article if you at least have a basic understanding of linear algebra, probability, calculus, but I will do my best to explain these concepts as we go.

_A final note before we begin;
In this artical I intentionally deviate from the standard notation found in the literature. I do this to make the concepts more approachable to a wider audience. If you are already familiar with these concepts, you may find the notation verbose._

# Hello, World!

Let's look at a dead simple, "Hello, world!" style example which demonstrates the core idea of Policy Gradient Methods.

First, we need to briefly touch upon what a policy is. At its simplest, a policy is a function that decides what action to take given some context. This function, how we define it and optimize its behavior is the core focus of this article, but more on this later.

In the example below we have a simple environment where the policy chooses from three possible actions _left_, _middle_ and _right_. The corresponding buttons allow you to select which action you want to reward the <a href="#policy" title="A policy is...">policy</a> for choosing.

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
animate_when_visible({id:"policy_gradient_ex", fps:10},
() => {    
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


    text("policy_gradient_ex", "try me!", [32,32], {angle: -Math.PI / 4})
});
</script>

The number next to each action in the visualization is the probability that the action will be chosen. A circle is drawn next to the action that is chosen for each frame.

Over time, you'll notice that the action you selected will be chosen more frequently. The key idea of Policy Gradient Methods is intuitive, and boils down to just one objective:

> **Adjust** the **policy** to **increase** the **probability** of **actions** that lead to **good** outcomes.

We can achieve our goal of choosing the action that leads to a **good** outcome by following this guiding principle, but to get there we need to answer some fundamental questions:

* [How do we define a **policy**?](#policy)
* [How do we measure the **goodness** or **badness** of an action?](#reward)
* [How do we calculate the **probability** of an **action**?](#action-probability)
* [How do we **adjust** our policy to maximize the **goodness** of its actions?](#optimization)

--------------------------------------------------------------------------------

## What is a **policy**? <a name="policy"/>

Put simply, a policy is a function which makes a decision to take an action ($a$) given some context (or state $x$). Often a policy is written as something like:

$$
\pi(x) \rightarrow a
$$

What this expression gestures at is very simple. A policy $\pi$ is a function which accepts a state $x$ and yields an action $a$. You can think of the state as the policy's observation of its environment. This could take many different forms, such as the position of objects in a game, sensor measurements from a robot or something else entirely. Similarly, the action can take many forms too, such as joystick inputs for a game or motor commands for a robot.

Irrespective of their nature, states and actions in practice are usually numerical - [scalars](https://en.wikipedia.org/wiki/Scalar_(mathematics\)), [vectors](https://en.wikipedia.org/wiki/Vector_(mathematics_and_physics\)) and [matrices](https://en.wikipedia.org/wiki/Matrix_(mathematics\)) are all commonly seen in the wild.

##### Notation Key

In the remainder of the article, we will use the following notation:
* Scalars will be denoted by regular symbols like $x$, $\theta$, $i$.
* Bold faced symbols like $\mathbf{x}$, $\mathbf{pr}$ will denote vectors.
* Matrices will be denoted by capital symbols like $X$, $\Theta$.

#### A Policy's Output

In our case, the policy will output a vector. Concretely, the vector's elements will be the probabilities assigned to each action class (left, middle and right). You may be wondering, "Why should our policy return probabilities for each action? Couldn't it output an action directly?".

That my friend, is a great question and the answer lies in something called the [explore-exploit dilemma](https://en.wikipedia.org/wiki/Exploration-exploitation_dilemma). For a given state, we want to strike a balance between trying new actions (explore), and taking advantage of actions that have proven to be good (exploit). Randomization is a good way to encourage exploration. However, we don't want the policy to try _totally_ random actions. We want to remember what actions had positive outcomes and use this to bias our choices. Using a probability distribution to encode our experience is a great way to implement this idea. We'll see how this works a little later.

#### Policy Definition

Let's consider the interactive example above. How is that policy defined, and how does it work? Let's write it out mathematically.

$$
\pi(\Theta, \mathbf{x}) = softmax(\mathbf{x} \Theta) = \mathbf{pr}
$$

You probably noticed that the notation changed a bit. So let's break each part of it down to understand what it means.

$$
\pi(\Theta, \mathbf{x})
$$

The policy function now includes a $\Theta$ input parameter. This indicates that the policy is _parameterized_ by the variable $\Theta$. Meaning the policy function, in addition to the state $x$, accepts some parameters $\Theta$ which we can adjust to change the policy's behavior. Concretely, the definition of $\Theta$ for our example above is:

$$
\Theta = \begin{bmatrix}
\theta_0 & \theta_1 & \theta_2
\end{bmatrix}
$$

Where each of the $\theta_i$ are the scalar parameters of the policy. Because this is a very simple example our input state $x$ is constant (specifically, 1 and can be ignored), and as a consequence these parameters represent the _relative_ probabilities of each action.

$$
softmax(x \Theta)
$$

Now this part of the expression does the policy's heavy lifting. It says that the state $x$ is multiplied by the parameters $\Theta$ and are passed through a [softmax](https://en.wikipedia.org/wiki/Softmax_function) function.

$$
\mathbf{pr}
$$

This is the probability distribution returned when $\pi(\Theta, x)$ is evaluated. $\mathbf{pr}$ is a vector containing the probabilities of each of the possible actions (left, middle, right) given a particular state $x$. It's worth mentioning that $\mathbf{pr}$ can't be used directly as an action, instead we will use the distribution $\mathbf{pr}$ to sample an action. We will get to the specifics of this soon.

##### The Softmax Function

The softmax function transforms a vector of arbitrary numbers into a probability distribution. It does this by exponentiation of each element in the vector and then normalizing the result by dividing it by the sum of all of the vector's exponetiated elements. 

$$
softmax(\mathbf{z}) = \frac{e^{\mathbf{z}}}{\sum_{i} e^{\mathbf{z}_i}}
$$

The softmax function returns a vector of probabilities that sum to 1. This is because the exponential function is always positive, and the sum of the exponentials in the denominator normalizes the probabilities to sum to 1. Play around with the example below to get a feel for how the softmax function works.

<form>
<canvas id="softmax_ex"></canvas>
<input type="range" id="left_activation" step="any" min=-10 max=10 oninput="update_softmax()"/>
<label for="left_activation">left input</label>
<input type="range" id="middle_activation" step="any" min=-10 max=10 oninput="update_softmax()"/>
<label for="middle_activation">middle input</label>
<input type="range" id="right_activation" step="any" min=-10 max=10 oninput="update_softmax()"/>
<label for="right_activation">right input</label>
</form>

<script>

function update_softmax() {
    let left = document.getElementById('left_activation');
    let middle = document.getElementById('middle_activation');
    let right = document.getElementById('right_activation');    

    let A = [left.valueAsNumber, middle.valueAsNumber, right.valueAsNumber];

    left.nextElementSibling.textContent = `left input: ${A[0].toFixed(3)}`; 
    middle.nextElementSibling.textContent = `middle input: ${A[1].toFixed(3)}`; 
    right.nextElementSibling.textContent = `right input: ${A[2].toFixed(3)}`; 

    let A_pr = softmax(A);

    clear("softmax_ex");
    let labels = [`left: ${A_pr[0].toFixed(3)}`, 
                  `middle: ${A_pr[1].toFixed(3)}`, 
                  `right: ${A_pr[2].toFixed(3)}`];
        
    draw_probabilities("softmax_ex", A_pr, labels, undefined, undefined, 
    (ctx, i, x, y) => {
        if (A[0] == i-1) {
            ctx.strokeStyle = color('LightGray');
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.stroke();
        }
    })
}
update_softmax();
</script>

Great, so this enables us to calculate the probability distribution for all actions given a state $x$ and our policy parameters $\Theta$, but how do we actually choose which action to take?

##### Sampling An Action

As we alluded to earlier, we can sample from the distribution to somewhat randomly choose an action. This is achievable as long as we can generate a uniform random number on the interval $[0, 1)$. This can be done by incrementally computing the cumulative sum of the probabilities and checking if the random number is less than sum.

```javascript
function sample_multinomial(pr) {
    let r = Math.random(); // real number between 0 and 1
    let c = 0;
    for (let a = 0; a < pr.length; a++) {
        c += pr[a];
        if (r < c) {
            return a;
        }
    }
}
```

Bringing all of this together, the JS implementation of our policy looks something like this:

```javascript
function pi(theta, x) {
    let z = matmul([x], theta);
    let pr = softmax(z[0]);             // vector of action probabilities
    let a_idx = sample_multinomial(pr); // randomly sample an action from the distribution p

    return { pr: pr, a: a_idx };
}
```
--------------------------------------------------------------------------------

## How do we measure the *goodness* or *badness* of an action? <a name="reward"/>

Now that we understand what a policy is, and how it can choose actions, we need to understand how we can measure the goodness or badness of an action.

This is where the **reward function** comes in. The reward function is a function that takes as input the state and action and returns a scalar value which represents the goodness or badness of the action. This scalar value is called the **reward**.

The reward function could be defined to theoretically score _any_ behavior. Be it driving a car, or playing a game. Actually games are a great example to illustrate this point. In a game, the **reward function** could be the scoring system, or the number of enemies killed, or the number of coins collected.

In our example, the state is always 1 so we ignore it. The reward is 1 when the policy chooses the target action and -1 when it chooses the other actions. Put more formally:

$$
R(x, a) =
\begin{cases}
    +1, & \text{if } a = a_{target} \\
    -1, & \text{otherwise}
\end{cases}
$$

Defining the reward function with both positive and negative rewards allows us to guide the policy towards actions that lead to good outcomes more quickly, we will explore why this is the case later.

--------------------------------------------------------------------------------

## How do we calculate the probability of an action? <a name="action-probability"/>

We've already seen how the policy can calculate the probability distribution over its actions given a state. But how do we calculate the probability of a specific action being taken? Take for example a probability distribution returned by our policy:

$$
\mathbf{pr} = [ 0.1, 0.6, 0.3]
$$

With an action it chose:

$$
a = 0
$$

What is the probability of the action $a$ being taken? In the case of our example, it's very simple. The probability of an action being taken is exactly the action's probability in the distribution calculated by the policy, 0.1 or 10%.

This is the case because all of our actions in this distribution (_left_, _middle_, and _right_) are mutually exclusive. You can not have an action that combines _left_ and _middle_. So the probability can be found by extracting the element from the probability vector whose index corresponds to the sampled action. To put this a little more formally:

$$
Pr_a(\mathbf{pr}, a) = \mathbf{pr}_a
$$

Where $\mathbf{pr}$ is the vector of probabilities output from the policy. $a$ is the index of the specific action in $\mathbf{pr}$ which was sampled from the distribution. Finally $\mathbf{pr}_a$ is the $a$-th element in the vector $\mathbf{pr}$.

<!-- 
TODO: consider including this discussion elsewhere
While this is mathematically correct. A trick you can use to make this easier to compute is to take the log of the probabilities and sum them. This is because the log of a product is the sum of the logs of the factors.

$$
\log pr_t = \sum_{i} \log pr_{t_i}[a_{t_i}]
$$

You will often see this trick used in practice because it is more numerically stable than simply multiplying probabilities together.
 -->
--------------------------------------------------------------------------------

## How do we adjust our policy to maximize the **goodness** of its actions? <a name="optimization"/>

We've gotten all the prerequisites out of the way, now we can finally get to the meat of the Policy Gradient Methods. To restate, what we want to do is adjust the policy to increase the probability of actions that have been observed to return positive reward, and decrease the probability of those that have been observed to return negative rewards.

To do this, we will compute the [_**gradient**_](/article/gradient) of the the probability of the chosen action $a$ with-respect-to the policy's parameters $\Theta$. The policy's gradient is:


$$
\nabla_{\Theta}pr_{a} = {\Large \begin{bmatrix}
\frac{\partial pr_{a}}{\partial \theta_0} & \frac{\partial pr_{a}}{\partial \theta_1} & \frac{\partial pr_{a}}{\partial \theta_2} \\
\end{bmatrix}}
$$

where

$$
\mathbf{pr} = \pi(\Theta, \mathbf{x})
$$

$$
a = sample\_multinomial(\mathbf{pr})
$$

$$
pr_{a} = Pr_a(\mathbf{pr}, a)
$$

It's worth noting that this gradient shares the same shape as the parameters $\Theta$. In our case, this is a vector with 3 elements since our policy's $\Theta$ is also a vector with 3 elements.

Each of the partial derivatives could be computed analytically using the chain rule, but for simplicity, we will use a numerical approximation to the gradient using finite differencing. Finite differencing is a method of approximating the derivative of a function by evaluating the function at two different points by _slightly_ perturbing the input of one of the points and dividing the difference by the perturbation.

In our case, the input we are perturbing are the parameters themselves.

<!--
$$
\frac{\partial pr_{a_t}}{\partial \theta_i} \approx \frac{pr_{a_t}(\Theta + \Delta \theta_i) - pr_{a_t}(\Theta)}{\Delta \theta_i}
$$
-->

$$
\mathbf{pr} = \pi(\Theta, x)
$$

$$
\mathbf{pr'} = \pi(\Theta + \Delta\theta_i, x)
$$

$$
\frac{\partial pr_{a}}{\partial \theta_i} \approx \frac{Pr_a(\mathbf{pr'}, a) - Pr_a(\mathbf{pr},a)}{\Delta \theta_i}
$$

$\mathbf{pr}$ is the probability distribution returned by the policy with the current parameters. $\mathbf{pr'}$ is almost the same distribution, but with a small perturbation of $\Delta\theta_i$ to parameter $\theta_i$. Tweaking the value of $\theta_i$ by a small amount lets us see what impact the adjustment has the resulting probability distribution.

We will repeat this computation for each of the parameters in $\Theta$ to get the full approximated gradient $\nabla_{\Theta}pr_{a}$.

**_TODO add a toy here which allows the reader to tweak parameters to see what the impacts are on the policy's output_**

<!-- </td>
    <td>foo</td>
</tr>
</table> -->

With the gradient in hand, we can finally adjust the policy's parameters to increase the probability of actions that lead to good outcomes. This is done by taking a step in the direction of the gradient using a technique called _gradient ascent_.

$$
\Theta + \alpha R(x, a) \nabla_{\Theta}pr_{a} \rightarrow \Theta'
$$

Where $\Theta$ are the current policy parameters. $\alpha$ is the _learning rate_, a hyperparameter that controls how large of an adjustment is made in each optimization step. $R(x, a)$ is a function that returns the reward of taking action $a$ while in state $x$. $\nabla_{\Theta}pr_{a}$ is the gradient of the probability of the chosen action $a$ with-respect-to the policy's parameters $\Theta$.

The learning rate $\alpha$ and reward $R(x, a)$ are multiplied together to yield a scalar number. As you may recall, $R(x, a) > 0$ if $a$ was a good action to take while in state $x$. Otherwise, $R(x, a) \leq 0$.

As a consequence, this scaling may cause the direction of the gradient flip, depending on the sign of $R(x, a)$. This means when $R(x, a) < 0$ we will move the policy's parameters in a direction which decreases the likelihood of $a$ occurring in state $x$. 

Conversely, when $R(x, a) > 0$ we will move the policy's parameters in a direction which increases the likelihood of $a$ occurring while in state $x$. 

<!-- Where

* $\Theta \rightarrow$ current policy parameters.
* $\alpha \rightarrow$ _learning rate_, a hyperparameter that controls how much the policy's parameters are adjusted in each update.
* $\nabla_{\Theta} \rightarrow$ gradient of the policy's probability distribution with respect to the policy's parameters.
* $R(x_t, a_t) \rightarrow$ reward of the action taken by the policy.
* $\Theta' \rightarrow$ updated policy parameters.
 -->


In essence that's it! We just repeat this sequence until our policy's actions converge to our optimization objective. Which in this case is to maximize the probability of the target action.

1. For a given state, evaluate the policy to get the probability distribution of actions.
2. Sample an action from the distribution.
3. Compute the reward of the action, given both the state and action.
4. Compute the gradient of the action's probability with respect to the policy's parameters.
5. Scale the gradient by the reward, such that positive rewards move the policy in the direction of increasing the likelihood of the action, and negative rewards decrease the likelihood of the action.
6. Repeat!

Like we've stated this example is akin to a "Hello, World!" of Policy Gradient Methods. In practice, there are many more considerations and optimizations that need to be made to make the algorithm work well with complex problems. But this should give you a good starting intuition for the core ideas of Policy Gradient Methods.

# Puck World!

Now you should have an understanding of the core ideas of Policy Gradient Methods. Let's look at a more interesting example to see how these ideas can be applied to a more complex problem. We will consider a 2D robot (puck) that can move in any direction. What changes do we need to make to our policy and reward function to handle this problem? Lets find out by examining each of the key differences.

--------------------------------------------------------------------------------

## Environment

To begin, let's describe the environment. The environment will consist of a target 'x' at the center of the screen. The puck 'o' will be spawned at a random location and will be able to move in any direction. The puck's objective will be to reach the target 'x'.

<canvas id="puck_env"></canvas>
<script>
let puck_env_cvs = document.getElementById('puck_env');
let env_x = puck.initial_state([0,0], [puck_env_cvs.clientWidth, puck_env_cvs.clientHeight], false);

let puck_env_draw = () => {
    clear("puck_env");
    puck.draw("puck_env", 0, {X: [env_x]});
    text(puck_env_cvs, "try me!", [32,32], {angle: -Math.PI / 4});
};

let puck_env_update_state = (e) => {
    switch(e.type) {
    case "mousemove":
        env_x[0] = e.offsetX;
        env_x[1] = e.offsetY;
        break;
    case "touchmove":
        env_x[0] = e.layerX;
        env_x[1] = e.layerY;
        break;
    }
    puck_env_draw();
};

puck_env_cvs.addEventListener("touchmove", puck_env_update_state);
puck_env_cvs.addEventListener("mousemove", puck_env_update_state);
puck_env_update_state({});
</script>

--------------------------------------------------------------------------------

## State Space

The environment's state space will consist of the puck's current position and the target's position. The state space will be defined as:

$$
\mathbf{x} = \begin{bmatrix} 
x_{puck} \\
y_{puck} \\
x_{target} \\
y_{target} \\
\end{bmatrix}
$$

--------------------------------------------------------------------------------

## Action Space

The "Puck World"'s action space makes a slight departure from "Hello World". Specifically, the puck policy will choose two actions simultaneously. These actions are: 

<fieldset>
<legend>vertical</legend>
<button style="width:30%" onclick="puck_act_move(0, -10)">up (i)</button>
<button style="width:30%">none</button>
<button style="width:30%" onclick="puck_act_move(0, 10)">down (k)</button>
</fieldset>
<fieldset>
<legend>horizontal</legend>
<button style="width:30%" onclick="puck_act_move(-10,0)">left (j)</button>
<button style="width:30%">none</button>
<button style="width:30%" onclick="puck_act_move(10,0)">right (l)</button>
</fieldset>

<canvas id="puck_action"></canvas>
<script>
let puck_action_cvs = document.getElementById('puck_action');
let act_x = puck.initial_state([0,0], [puck_action_cvs.clientWidth, puck_action_cvs.clientHeight], false);

let puck_act_draw = () => {
    clear("puck_action");
    puck.draw("puck_action", 0, {X: [act_x]});
    text(puck_action_cvs, "try me!", [32,32], {angle: -Math.PI / 4});
};

let puck_act_move = (dx, dy) => {
    act_x[0] += dx; act_x[1] += dy
    puck_act_draw();
};
puck_act_draw();

addEventListener("keydown", (e) => {
    let deltas = {'i': [0, -10], 'k': [0, 10], 'j': [-10, 0], 'l': [10, 0]};
    if (e.key in deltas) {
        puck_act_move(deltas[e.key][0], deltas[e.key][1]);
    }
});

</script>

Both the horizontal and vertical actions are considered _random independent variables_ meaning they do not have influence on each-other.

This means that the puck will be able to take actions such as moving _up and to the left_, or _not moving in either direction at all_. We could have achieved the same end by simply creating a policy which emits an action vector with 9 elements, one for each possible combination of horizontal and vertical actions. This has some disadvantages though, for one, the policy would require more parameters. So, how do we calculate the probability of taking a specific combined action?

#### Probability of independent actions <a name="independent-action-probability"/>
<!--
But what if you had an action space that was not mutually exclusive? Say instead we are controlling a puck in a 2D space, and the actions are the puck's direction along the x **AND** y axis. Where the options along the x axis are _left_, _none_, and _right_, and along the y axis are _up_, _none_, and _down_. 
-->
Consider, for example, the follow probability distributions for a horizontal action $pr_{x}$ and vertical action $pr_{y}$:

$$
\mathbf{pr_{x}} = [ 0.1, 0.6, 0.3 ]
$$

$$
\mathbf{pr_{y}} = [ 0.2, 0.3, 0.5 ]
$$

**A quick aside:** In the puck world example, you'll notice lots of $t$ subscripts. This is used to denote a variable that exists for a particular time-step or frame of the simulation.

Now say the policy chose a specific action, which includes a choice of both a horizontal action and a vertical action:

$$
\mathbf{a} = \begin{bmatrix} 
a_{x} = 0 \\
a_{y} = 1 \\
\end{bmatrix}
$$

What is the probability of the action $a$ being taken? This is a bit more complex, but can be done by evaluating the probability density function of the action space. This amounts to multiplying the probabilities of each action class in $a$:

$$
pr = \mathbf{pr_{x}}[a_{x}] * \mathbf{pr_{y}}[a_{y}]
$$

In this case the probability of the action taken by the policy is $0.1 * 0.3 = 0.03$ or 3%. This can be generalized to any number of actions and action spaces by multiplying the probabilities of each action class in the action space:

$$
Pr_a(\mathbf{pr}, \mathbf{a}) = \prod_{i} \mathbf{pr_{a_i}}
$$

--------------------------------------------------------------------------------

## Policy

Like the policy in the 'hello world!' style example, this policy will be a simple linear map. Because of its linearity, unlike a non-linear system like a neural-network, the policy has limited ability to learn complex representations, so we will give it some help. The input to the policy will not directly be the state space, instead it will be a [feature vector](https://en.wikipedia.org/wiki/Feature_(machine_learning\)) derived from the state space. Our policy only cares about the target's position relative to the puck. Because of this we will construct the feature vector as:

$$
\Delta{x} = x_{target} - x_{puck}
$$
$$
\Delta{y} = y_{target} - y_{puck}
$$
$$
\phi(x) = \begin{bmatrix} 
\Delta{x} / \sqrt{\Delta{x}^2 + \Delta{y}^2}\\
\Delta{y} / \sqrt{\Delta{x}^2 + \Delta{y}^2}\\
\end{bmatrix}
$$

The vector $\phi(\mathbf{x_t})$ will be our _feature vector_, the input to the policy. This feature vector is simply the direction from the puck to the target normalized to a unit vector. Normalizing the vector ensures that the policy is invariant to the distance between the puck and target.

With our feature vector in place we can define the 2x6 matrix $\Theta$ which will map our feature vector to the probability distribution of actions:

$$
\Theta = \begin{bmatrix}
\theta_{00} & \theta_{01} & \theta_{02} & \theta_{03} & \theta_{04} & \theta_{05} \\
\theta_{10} & \theta_{11} & \theta_{12} & \theta_{13} & \theta_{14} & \theta_{15} \\
\end{bmatrix}
$$

Our policy will mulitply the feature vector by the policy parameters. The resulting vector will be sliced in two, one vector for the vertical actions and one for the horizontal actions. Each of these vectors will be passed through a softmax function to get the probability distribution of actions.

$$
\mathbf{z} = \phi(\mathbf{x}) \Theta
$$
where $z$ is a 6 element vector, and
$$
\pi(\Theta, \mathbf{x}) = \mathbf{pr} = \begin{bmatrix}
softmax([z_0, z_1, z_2]) \\
softmax([z_3, z_4, z_5] \\
\end{bmatrix} = \begin{bmatrix}
\mathbf{pr_{x}} \\
\mathbf{pr_{y}} \\
\end{bmatrix}
$$

This policy will return two probability distributions, one for the horizontal actions $\mathbf{pr_x}$ and one for the vertical actions $\mathbf{pr_y}$. Just like the last example, we will sample from each of these to determine what horizontal and vertical actions the puck will take.

Once specific vertical and horizontal actions are sampled, the probability of that combination can be computed as we've previously seen for [independent actions.](#independent-action-probability)

Below is an interactive illustration of how this policy reacts to different states. The policy parameters used have already been optimized to seek the target.

<canvas id="puck_pol"></canvas>
##### Horizontal Probability Distribution $\mathbf{pr_{x}}$
<canvas id="puck_pol_hori"></canvas>
##### Vertical Probability Distribution $\mathbf{pr_{y}}$
<canvas id="puck_pol_vert"></canvas>
<script>
let puck_pol_cvs = document.getElementById('puck_pol');
let pol_x = puck.initial_state([0,0], [puck_pol_cvs.clientWidth, puck_pol_cvs.clientHeight], false);

let puck_pol_draw = () => {
    clear("puck_pol");
    puck.draw("puck_pol", 0, {X: [pol_x]});
    text(puck_pol_cvs, "try me!", [32,32], {angle: -Math.PI / 4});
};

let puck_pol_update_state = (e) => {
    switch(e.type) {
    case "mousemove":
        pol_x[0] = e.offsetX;
        pol_x[1] = e.offsetY;
        break;
    case "touchmove":
        pol_x[0] = e.layerX;
        pol_x[1] = e.layerY;
        break;
    }

    let pr_t = puck.pi(trained_theta, pol_x).pr;

    clear("puck_pol_vert"); clear("puck_pol_hori");
    { // draw vertical probabilities
        let labels = [`up: ${parseInt(pr_t[1][0]*100)}%`, 
                      `middle: ${parseInt(pr_t[1][1]*100)}%`, 
                      `down: ${parseInt(pr_t[1][2]*100)}%`];
        draw_probabilities("puck_pol_vert", pr_t[1], labels, undefined, undefined);        
    }

    { // draw horizontal probabilities
        let labels = [`left: ${parseInt(pr_t[0][0]*100)}%`, 
                      `middle: ${parseInt(pr_t[0][1]*100)}%`, 
                      `right: ${parseInt(pr_t[0][2]*100)}%`];
        draw_probabilities("puck_pol_hori", pr_t[0], labels, undefined, undefined);        
    }
    puck_pol_draw();
};

puck_pol_cvs.addEventListener("touchmove", puck_pol_update_state);
puck_pol_cvs.addEventListener("mousemove", puck_pol_update_state);
puck_pol_update_state({});
</script>

--------------------------------------------------------------------------------

## Reward Function

The reward function is straight-forward. We want the reward to be positive when the puck's action moves it closer to the target, and negative when it moves further away. This can be implement as:

$$
R(\mathbf{x_{t-1}}, \mathbf{x_t}) = dist(x_{{t-1}_{puck}}, x_{{t-1}_{target}}) - dist(x_{{t}_{puck}}, x_{{t}_{target}})
$$
where
$$
dist(\mathbf{a}, \mathbf{b}) = \sqrt{(a_x - b_x)^2 + (a_y - b_y)^2}
$$

<canvas id="puck_reward"></canvas>
<script>
let puck_reward_cvs = document.getElementById('puck_reward');
let reward_x = puck.initial_state([0,0], [puck_reward_cvs.clientWidth, puck_reward_cvs.clientHeight], false);

let puck_reward_draw = (reward) => {
    clear("puck_reward");
    puck.draw("puck_reward", 0, {X: [reward_x]});

    let ctx = ctx_cache(puck_reward_cvs)
    text(ctx, `reward: ${reward.toFixed(2)}`, [puck_reward_cvs.clientWidth / 2, puck_reward_cvs.clientHeight]);
    text(ctx, "try me!", [32,32], {angle: -Math.PI / 4});
};

let puck_reward_update_state = (e) => {
    reward_x_t1 = [...reward_x];
    switch(e.type) {
    case "mousemove":
        reward_x_t1[0] = e.offsetX;
        reward_x_t1[1] = e.offsetY;
        break;
    case "touchmove":
        reward_x_t1[0] = e.layerX;
        reward_x_t1[1] = e.layerY;
        break;
    }

    if (dist(reward_x, reward_x_t1) > 1 || !('type' in e)) {
        puck_reward_draw(puck.reward(reward_x, reward_x_t1));
        reward_x = reward_x_t1;        
    }
};

puck_reward_cvs.addEventListener("touchmove", puck_reward_update_state);
puck_reward_cvs.addEventListener("mousemove", puck_reward_update_state);
puck_reward_update_state({});
</script>

--------------------------------------------------------------------------------

## Optimization

Here things are a little different from the "Hello, World!" example. In that example the policy computes a single action for which we give some reward or penalty, then immediately adjust the policy parameters. In this example we will sample a _trajectory_. Each trajectory begins from a random initial state (a randomized starting position for the puck). The puck's policy is then allowed to choose actions and interact with the environment until time runs out ($t$ states are generated), or the target is reached.

<canvas id="policy_gradient_montecarlo"></canvas>
<script>
let rand_theta = randmat(2, 6);
let mc_trajectories = [];
let mc_t = 0;
let mc_cvs = document.getElementById("policy_gradient_montecarlo");
for (let i = 0; i < 1; i++) {
    mc_trajectories.push(puck.sample_trajectory(rand_theta, [0,0], [mc_cvs.clientWidth, mc_cvs.clientHeight]));
}

animate_when_visible({id:"policy_gradient_montecarlo", fps:60},
() => {
        clear("policy_gradient_montecarlo");
        let T = mc_trajectories;
        for (let i = 0; i < T.length; i++) {
            puck.draw("policy_gradient_montecarlo", mc_t % T[i].X.length, T[i]);
        }
        mc_t++;

        if (mc_t >= T[0].X.length) {
            T[0] = puck.sample_trajectory(rand_theta, [0,0], [mc_cvs.clientWidth, mc_cvs.clientHeight]);                
        	mc_t = 0;
        }
});
</script>

The illustration above shows what a trajectory looks like for the puck with a randomly initialized policy. As you can see from the animation, a trajectory consists of a sequence of states, each new state was generated by the policy choosing an action, interacting with the environment and receiving a reward. The trajectory stores these values as well as the probability distribution output from the policy, this isn't strickly necessary, but it allows us to skip recomputing it when we optimize the policy.

$$
\tau = \{ \mathbf{x_0}, \mathbf{pr_0}, a_0, r_0, \ldots \mathbf{x_{t-1}}, \mathbf{pr_{t-1}}, a_{t-1}, r_{t-1}\}
$$

Once a trajectory has been generated, we can compute the the policy's gradient of the probability of the action $pr_{a_t}$ taken for each time step $t$ **with respect to** the policy's parameters $\Theta$. This is done by summing the gradients of the probabilities of each action in the trajectory.

$$
\nabla_{\Theta} = \frac{1}{t} \sum_{t} \nabla_{\Theta}pr_{a_t} R(x_t, a_t)
$$

Where we compute $\nabla_{\Theta}pr_{a_t}$, the gradient for each timestep $t$ as:

$$
\nabla_{\Theta}pr_{a_{t}} = \Large \begin{bmatrix}
\frac{\partial pr_{a_t}}{\partial \theta_{00}} & \frac{\partial pr_{a_t}}{\partial \theta_{01}} & \dots & \frac{\partial pr_{a_t}}{\partial \theta_{04}} & \frac{\partial pr_{a_t}}{\partial \theta_{05}} \\
\frac{\partial pr_{a_t}}{\partial \theta_{10}} & \frac{\partial pr_{a_t}}{\partial \theta_{11}} & \dots & \frac{\partial pr_{a_t}}{\partial \theta_{14}} & \frac{\partial pr_{a_t}}{\partial \theta_{15}} \\
\end{bmatrix}
$$

Which depends on the state of the system $x$ and probability of the action $pr_a$ taken at time $t$.

$$
pr_{a_t} = Pr_a(\mathbf{pr_t}, a_t)
$$

$$
a_t \sim \mathbf{pr_t}
$$

$$
\mathbf{pr_t} = \pi(\Theta, \mathbf{x_t})
$$

Finally, we adjust the policy's parameters by taking a step in the direction of the gradient for the trajectory scaled by the reward and learning rate:

$$
\Theta + \alpha \nabla_{\Theta} \rightarrow \Theta'
$$

## Bringing it all together

Now that we have all the pieces in place, we can optimize the policy to maximize the probability of the puck reaching the target. Below is a live example of how the policy parameters are optimized over time. The plot shows the average reward of the puck over 10 epochs. The puck's policy parameters are initialized with a bad policy, and then optimized using the policy gradient method.

<canvas id="policy_gradient_ex2"></canvas>
Average Reward per 10 Epochs
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

let ele = document.getElementById("policy_gradient_ex2");
let T = puck.sample_trajectory(puck_theta, [0,0], [ele.clientWidth, ele.clientHeight], true);
let R = []
draw_reward_plot("policy_gradient_ex2_reward", R);

animate_when_visible({id: "policy_gradient_ex2", fps: 60}, () => {
    clear("policy_gradient_ex2");
    puck.draw("policy_gradient_ex2", t, T);
    t++;

    if (t >= T.X.length) {
        t = 0;
        let avg_ret = 0;
        const epochs = 10;
        for (let e = 0; e < epochs; e++) {
            T = puck.sample_trajectory(puck_theta);
            puck_theta = optimize(puck.pi, puck_theta, T, {
                alpha: 0.5,
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
        T = puck.sample_trajectory(puck_theta, [0,0], [ele.clientWidth, ele.clientHeight], true);

        clear("policy_gradient_ex2_reward");
        draw_reward_plot("policy_gradient_ex2_reward", R);
    }    
})
</script>

### A Final Note

The examples and discussions in this article are meant to provide a high-level overview of Policy Gradient Methods. In practice, there are many more considerations and optimizations that need to be made to make the algorithm work well with complex problems. But this should give you a good starting intuition for the core ideas of Policy Gradient Methods.


## Summary

Policy Gradient Methods are an intuitive and elegant approach to reinforcement learning, enabling machines to learn behaviors by optimizing their actions toward favorable outcomes. Starting with the basic "Hello, World!" example, this article has demonstrated how policies, rewards, and gradients come together to guide decision-making. By extending these ideas to more complex environments, like "Puck World," we explored the practicality of policy gradients in dynamic scenarios.

Through step-by-step explanations and interactive examples, we illustrated key concepts such as policy definition, reward functions, action probabilities, and optimization. These foundational insights lay the groundwork for deeper exploration into advanced reinforcement learning techniques. Whether you're a beginner or revisiting the basics, Policy Gradient Methods provide a powerful toolkit for tackling diverse real-world problems.


### Resources & Further Reading
* [RL Course by David Silver - Lecture 7: Policy Gradient Methods](https://youtu.be/KHZVXao4qXs?si=Sh30NZ0ZAbsRSUB8)
* [Simple statistical gradient-following algorithms for connectionist reinforcement learning](https://link.springer.com/article/10.1007/BF00992696)
* Russell, S. (n.d.). Policy Search. In Artificial Intelligence A Modern Approach (2nd ed., pp. 781–785).

<!--<script src="/ace-builds/src-noconflict/ace.js" type="text/javascript" charset="utf-8"></script>
<script>
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/javascript");
</script>-->
</body>
</html>
