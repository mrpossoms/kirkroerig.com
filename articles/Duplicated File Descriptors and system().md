unix,linux,system,fork,socket,udp,0,fd,file,file descriptor,network
Duplicated File Descriptors and system()
========================================


For the last month or so I've been pretty heavily invested in building
and programming an autonomous R/C car for Sparkfun's [AVC](http://avc.sparkfun.com).
I decided to use a Raspberry Pi Model A+ as my embedded platform with an
Arch Arm distro installed on it. All had been going quite well until I started
working on the control software.

The Problem
-----------
Some time ago I stumbled across a fantastic driver written by [richardghirst](https://github.com/richardghirst) for
the Raspberry Pi called servoblaster. Essentially, this driver enables the configuration and use of the Pi's GPIO
header pins as PWM outputs. In other words, it allows you to easily drive R/C servos from the Pi with no
additional hardware! This was exactly what I was looking for. There were two implementations of the driver, one
kernel level, and another user level. richardghirst recommended the user level, so I decided to heed his suggestion.

At this time I began working on a simple UDP server that would run on the Pi. The server would allow me to control the
car remotely over WiFi. This is what the beginning of that server looked like.

```C
int main(int argc, char* argv[])
{
	// open socket, setup sockaddr_in structure
	int sock = socket(AF_INET, SOCK_DGRAM, 0);
	struct sockaddr_in addr = { };
	addr.sin_family      = AF_INET;
	addr.sin_port        = htons(atoi(argv[1]));
	addr.sin_addr.s_addr = INADDR_ANY;

	printf("Setup using port %d\n", ntohs(addr.sin_port)); // say what port

	assert(sock > 0); // sanity check

	// bind the process to the desired port
	int res = bind(sock, (const struct sockaddr*)&addr, sizeof(addr));
	assert(res >= 0); // sanity check

	// start up the control module, and servoblaster
	assert(!conInit());

	// ...
```

In the function call __conInit()__ the driver daemon is started with the following calls.

```C
	// does the servo blaster device exist? (is the driver running?)
	if(!stat("/dev/servoblaster", &buf)){
		fprintf(stderr, "Servo driver already running\n");
	}
	// execute the servo blaster daemon
	else if(system("servod --p1pins=37,38")){
		fprintf(stderr, "Failed to start servo driver\n");
		return -1;
	}
```

Here, the program first looks to see if the driver has been started. It assumes if the device file exists, then the
driver is live. Otherwise it attempts to start it with the call __system("servod --p1pins=37,38")__.

This is where the problem was. If the driver isn't running and __system("servod --p1pins=37,38")__ is called it forks a new child process. When
that occurs all open file descriptors in the host process are automatically inherited by the child. So that means...

```C
	int sock = socket(AF_INET, SOCK_DGRAM, 0);
```

is thus inherited by the child process, which in this case is the servo driver. But because the driver is a daemon
it will keep running after the UDP server has shut down. This means, the servo driver will keep __sock__ open and bound
to the port specified above. Which will result in an __EADDRINUSE__ errno if a __bind()__ to that port is attempted again.

The Solution
------------

After some searching I found that luckily this was a very easy fix. It came down entirely to adding one function
call shortly after opening the socket.

```C
	int sock = socket(AF_INET, SOCK_DGRAM, 0);
	fcntl(sock, F_SETFD, fcntl(sock, F_GETFD) | FD_CLOEXEC);
```

The fcntl function is used to get and set properties of file descriptors. The current flags of __sock__ are retrieved
with the __fcntl(sock, F_GETFD)__ call. Those flags are then or'ed together with the flag __FD_CLOEXEC__. Here's what
the man pages say about that flag.

```Markdown
	FD_CLOEXEC   
				Close-on-exec; the given file descriptor will be auto-
				matically closed in the successor process image when
				one of the execv(2) or posix_spawn(2) family of system
				calls is invoked.

```

Perfect! That was exactly the behavior that I had needed. And sure enough the server worked as intended. So much so
that I could drive my car around from my laptop :)

<center>
<blockquote class="instagram-media" data-instgrm-version="6" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:300px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:8px;"> <div style=" background:#F8F8F8; line-height:0; margin-top:40px; padding:50.0% 0; text-align:center; width:100%;"> <div style=" background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAMAAAApWqozAAAAGFBMVEUiIiI9PT0eHh4gIB4hIBkcHBwcHBwcHBydr+JQAAAACHRSTlMABA4YHyQsM5jtaMwAAADfSURBVDjL7ZVBEgMhCAQBAf//42xcNbpAqakcM0ftUmFAAIBE81IqBJdS3lS6zs3bIpB9WED3YYXFPmHRfT8sgyrCP1x8uEUxLMzNWElFOYCV6mHWWwMzdPEKHlhLw7NWJqkHc4uIZphavDzA2JPzUDsBZziNae2S6owH8xPmX8G7zzgKEOPUoYHvGz1TBCxMkd3kwNVbU0gKHkx+iZILf77IofhrY1nYFnB/lQPb79drWOyJVa/DAvg9B/rLB4cC+Nqgdz/TvBbBnr6GBReqn/nRmDgaQEej7WhonozjF+Y2I/fZou/qAAAAAElFTkSuQmCC); display:block; height:44px; margin:0 auto -44px; position:relative; top:-22px; width:44px;"></div></div><p style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;"><a href="https://www.instagram.com/p/_01BFUHmvh/" style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none;" target="_blank">A video posted by Kirk Roerig (@mrpossoms)</a> on <time style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px;" datetime="2015-12-28T06:28:38+00:00">Dec 27, 2015 at 10:28pm PST</time></p></div></blockquote>
</center>
<script async defer src="//platform.instagram.com/en_US/embeds.js"></script>
