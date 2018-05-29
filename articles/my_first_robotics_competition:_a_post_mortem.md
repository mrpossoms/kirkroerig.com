article,robotics,electronics,learning,lessons,programming,algorithms
My First Robotics Competition: A Post-mortem
============================================
![Alt](/images/IMG_1591.JPG "Recording a path at AVC 2016")
For the last 9 months or so, I've been tinkering with the design, construction and implementation of a robot capable of competing in Sparkfun's AVC. AVC, an acronym for Autonomous Vehicle Competition, is a fairly straight-forward, single lap race featuring home built robotic vehicles attempting to out perform one another. Typically the race takes place annually, in Sparkfun's parking lot. The course features hay bails, jumps, and various obstacles to try your machine's navigational metal. I first learned of the race from Sparkfun's website whilst buying parts for another project a few years ago. However, this year I finally decided to give it a go.

Like so many things in life, the first go was far from flawless. I visited the race course the day before the actual event. I made a few attempts, but I was only able to make it 2/3 of the way through the track. According to other competitors, it was a much more narrow course than what it had been in years prior. What was somewhat reassuring was the amount of trouble the other competitors were also having, including those who were veterans of the event. Regardless of the outcome, much was learned. I want to take some time here to chronicle those lessons learned.

<br/>
<br/>
<br/>
<br/>

Focus on solving the problem at hand
------------------------------------
Large projects often have countless facets that could steal away your attention from the big picture. And it's easy to let the scope creep, and grow larger and larger. It often becomes all too common (for me at least) to lose sight of what the actual end goal is, and rather, get caught up in solving various sub problems which, albeit useful, frequently detract from successfully executing your true goal. I found myself, building, reading and learning about much much more than I needed to really solve the problem. Though this is great for personal development, it doesn't immediately help win races. :)

Start Small
-----------------------------------
In a way, this goes back to the point above. Starting small, and trying to solve the problem in the most minimal way possible is the best way to begin. Over engineering a solution will result in many more problems than just those which you began with. Once you've solved the problem, then you should seek to optimize. Just remember! KISS!

One thing at a time / Keep it modular!
----------------------------------
As I built my robot, I found myself getting stuck, bored or disinterested with certain tasks. This unintentionally introduced many down-right stupid bugs into my code. As subtlely broken systems slyly introduced their bugs into the system as a whole, bugs that proved to be very difficult to track down. This can be remedied by strickly adhering to good branching discipline, and keeping each feature modular. That way, even if you do thrash between features those that are unfinished / not totally perfect will not screw with those that are.

Modular design for any system is beneficial for a myriad of reasons. Mostly it allows different system components to be built and operate largely independently of one another. This also helps to improve over all quality and testability. Plus, if one component is found to be a pain point, rebuilding, refactoring or ripping it out will be much less painful if systems are not tangled together. Also, modular components are easier to experiment with and decrease the risk of muddying up the surrounding infrastructure and systems.

Prove it! Run experiments and tests
----------------------------------
Do you think you got something working? Did you finally solve the problem? Don't celebrate quite yet. Be your own worst critic, try to prove that it in fact doesn't work. Setup tests that you think it might have trouble with. Run some experiments with the goal of showing your past-self to be wrong. Just accepting a success in one circumstance does not mean it won't fail miserably in another.

Put together a good test environment
-----------------------------------
You can plug away at building things and think it through as carefully as you please, but at the end of the day, you'll still need to try it out. For me this was often difficult. I started construction of this project in the winter months, and being from Michigan that meant snow, salt and water all at once. These are not the best conditions to be running a small scale robotic car in. However, it was the only way I could give the system a true test. After the fact, I realized that I would have been much better off testing a simulated car, in a simulated environment. Aside from the convenience of being able to run valid trials from the warmth of a coffee shop, the simulated environment would also allow for the freedom to carefully control different sources of interference and other environmental anomalies.

Be explicit about units
---------------------------------
This got me into trouble a number of times. Between GPS, the IMU, rotary encoder and LIDAR sensors; mismatched unit types abounded. Despite that, I used the same vector types for nearly every one of them. This often resulted in units getting mixed with incompatible units which in turn generated all kinds of unwanted bugs that were particularly difficult to track down. I strongly suggest explicitly disallowing this kind of mixing and matching in favor of purpose built types for each unit and explicit conversions between them if you really must.

Build robust self-check / diagnostic systems
---------------------------------
This might be a pain in the ass, but it will save you a ton of time and frustration in the long run. Especially as your project complexity grows. Many times I discovered a broken wire or some other physical failure after hunting around in my code for the culprit. Self check systems that narrow down the issue without human investigation are well worth your time. Configurable diagnostics and logging are also hugely beneficial.

Maintain version awareness
---------------------------------
This really only applies to self contained systems that communicate with one another. Particular examples from my project included the wheel encoder micro-controller talking to the main computer. The main computer talking to diagnostic apps, and diagnostic apps and programs talking to various system daemons. A number of times I found myself stumped as to why I was getting garbage data from the robot, only to find that I had, unknowingly, slightly changed the packet structure. A simple wrapping header confirming protocol/packet version would have easily caught this oversight, and if handled correctly reported it.

Don't hesitate to refactor construction
---------------------------------
Code gets refactored frequently, but the same should also go for mechanical/electrical parts. If something breaks don't just patch it up and leave it. It failed for a reason, and the patch will certainly fail too. Take some time to redesign given what you learned about weak points in your previous attempt.

Use utilities and tools that let you iterate quickly
---------------------------------
I'm a fanboy for the C programming language. I love its simplicity and power. However I did find myself in situations where it was a bit of a hinderance. Trying to quickly build some algorithmic code, especially if it was math heavy, was often slow, tedious and error prone. Use higher level tools to try things out and prove validity before pursuing a final and possibly more finicky implementation. Even for the final implementation, I would recommended using a language or set of libraries that allow you to express higher level concepts with ease (such as a good C++ linear algebra library).

Robots are realtime
--------------------------------
Robots live in our world, and time in our world marches on relentlessly. As such, a robot's accurate perception of time is key for commonly used algorithms to function correctly. Traditional, non-realtime operating systems present a problem for such algorithms. In my case, this problem was Linux. At any moment, your process can be suspended for a short time to allow another system process to run. For most applications this doesn't matter much. However, when you are integrating sensor data a fixed and very small time step will save you a lot of headache by reducing error. In my future projects, I will definitely consider deferring all highly time sensitive tasks to either a micro controller, or a computer running a proper RTOS.
