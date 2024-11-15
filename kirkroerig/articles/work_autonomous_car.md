~work
# Autonomous Driving Project
Repo: [Github](https://github.com/mrpossoms/AVC2017)

## What is it?
I built this system and platform for autonomous racing competitions. The software and hardware is built around an embedded linux distribution. The system is designed to be used as a pipeline of seperate programs which helps ease testing by allowing me to simply swap the simulator program in for the program that normally collects sensor readings.

## What did I do?
This project is comprised of a set of several very different facets, most of which I built from the ground up.

### Sensor interface
The first step was to let the system see and feel. The *collector* program opens a connection to the I2C bus and then initiates communication with the BNO055 IMU, and the PWM-logger. I modified the PWM-logger firmware to also record readings from a homemade wheel encoder I fitted on the front right wheel of the car. A connection is then opened to the camera through the V4L2 API. The camera is configured then set to stream.

### Machine learning
The competition that I was initially interested in takes place in a parking lot, with the track defined by hay bales. So my plan was to classify patches of the camera frame and steer toward the clearest path. I used Tensorflow to train a model to classify small image patches by the type of texture it believes the patch to be, unknown: 0, hay: 1, or asphalt: 2. I used a combination of synthesized and web-scraped data for training.

### Simulator
A crucial component that I wrote for the system was a simulator. A simple driving simulator built using _seen_ that could interface with the other programs in the suite. The simulator is used as the testbed by which much of the software could be rapidly iterated upon to achieve better performance.

![simulator running](https://raw.githubusercontent.com/mrpossoms/AVC2017/master/example.gif)

## Learnings
* Real-time scheduling
* Deterministic timing
* Simulation development
* System architecture
* Sensor calibration
* Driver authoring
* ML system design
* Web scraping
* Training data synthesis
* PID controllers
<br/>
<br/>

## Technologies and Tools Used
* C, C++, Bash, Python
* Tensorflow
* V4L2
* GNU Make
* OpenGL 4.0
