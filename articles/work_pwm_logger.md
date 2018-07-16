work
# PWM Logger

![PWM Logger](http://www.protean.io/imgs/logger.jpg)

Repo: [Github](https://github.com/Protean-Tech/pwm-logger)

I designed the [PWM logger](http://www.protean.io/product/pwm-logger) to facilitate the development of small-scale autonomous vehicle systems whose performance strongly depends on servo data collection and then later, reproduction. Such as those who are implementing end-to-end ML systems.

It does this by decoding PWM signals from servos and motor controllers and then allowing an I2C master to record the readings to produce labels for a training set. The logger can also be put in a mode that generates PWM rather than recording. This way it can seemlessly swap between recording a human flying or driving, to letting the computer take the wheel.

I designed the PCB for the _PWM logger_ around the Parrallax Propeller MCU, and programmed it in it's native Propeller assembly. I wrote a software I2C driver in Propeller ASM to interface with other systems.

## Learnings
* Assembly programming
* Hardware design, prototyping, assembly and debugging
* I2C bus protocol
* SMD soldering
* PCB design
<br/><br/>

## Technologies and Tools Used
* Parallax Propeller MCU
* GNU Make
* EAGLE
* Bus analyzer
