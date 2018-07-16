work
# Tracer

![seen demo3](https://raw.githubusercontent.com/mrpossoms/tracer/master/tracer.gif)

I built _Tracer_ for fun. It's a simple path tracer implementation which writes light intensities into a buffer. Rendering performance is improved by splitting the frame up into columns and rendering each on its' own thread. In this demo, the render buffer is then read and used to manipulate the terminal via ncurses to yeild a 'retro asethetic.

Repo: [Github](https://github.com/mrpossoms/tracer)

<br/>

## Technologies and Tools Used
* C++
* GNU Make
* Ncurses
