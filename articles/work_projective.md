~work
# Projective

<iframe width="1146" height="480" src="https://www.youtube.com/embed/T_LwVTtjQ4w" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

## What is it?
_Projective_ is an augmented reality game I developed for [iOS devices](https://itunes.apple.com/us/app/projective/id988918636?ls=1&mt=8) well before the release of Apple's ARKit framework. 

## What did I do?
I built _Projective_ from the ground up. In doing so, I wrote a simple OpenGL ES 2.0, and FMOD based game engine. For text rendering, I created a set of functions that convert True-Type fonts into meshes that can be rendered in game. The most critical detail was in making use of the orientation quaternions from CoreMotion to re-generate the view matrices on each frame.


## Learnings
* Project managment
* Programatic generation of PCM audio
* Internals of True-Type fonts.
* Quaternions for practical applications
<br/><br/>

## Technologies and Tools Used
* OpenGL ES 2.0
* Objective-C, C
* FMOD
* Blender
* Xcode
