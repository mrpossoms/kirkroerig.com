~work
# Tracer

Repo: [Github](https://github.com/mrpossoms/tracer)
![seen demo3](https://raw.githubusercontent.com/mrpossoms/tracer/master/tracer.gif)

## What is it?
I built _Tracer_ for fun. It's a simple path tracer implementation which writes light intensities into a buffer. In this demo, the render buffer is then read and used to manipulate the terminal via ncurses to yield a 'retro' aesthetic.

## What did I do?
I implemented a simple path-tracing algorithm in C++. In addition to the algorithm, I also defined several intersection equations which give surfaces their form during rendering.

I also improved performance by rendering each frame using several concurrent threads. The path-tracing algorithm is highly seperable. Meaning that the computations done for one 'pixel' in the buffer are completely independent from the others. Such a property of an algorithm lends itself well to parallelism. So I split the frame up, one column per thread. This significantly increases frame throughput. 


<br/>

## Technologies and Tools Used
* C++
* GNU Make
* Ncurses
