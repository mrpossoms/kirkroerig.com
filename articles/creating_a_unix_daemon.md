unix,linux,system,fork,daemon,service
Creating a Unix Daemon
========================================

To quote Wikipedia,

*__In multitasking computer operating systems, a daemon (/ˈdiːmən/ or /ˈdeɪmən/)[1] 
is a computer program that runs as a background process, rather than being under
the direct control of an interactive user.__*

In practice daemons are used any time a service needs to be accessible at a moment's notice.
A good example would be a server applicaion. A server spends most of it's time sitting, waiting, 
for a request or connection that could come at any time; then honoring that request as quickly
as possible.

Recently I created my first daemon, a TCP server for uploading gps data to the computer on a robot.
So I wanted to document what I learned.

Here's how to create a minimal Unix daemon in C.

```C
#include <sys/stat.h>
#include <stdio.h>
#include <unistd.h>
#include <errno.h>

int main()
{
	// When you start the daemon initially the process that is spawned
	// is attached to the user's current session. So the first a child
	// process is spawned. fork() accomplishes this. From this point on you
	// can think of your program now existing as two processes, both of which
	// just finished executing the line below. One of these processes is the
	// parent, the other is the child
	pid_t pid = fork();

	if(pid > 0){
		printf("parent: the daemon's pid is %d\n", pid);
		return -1; // the parent has nothing else to do, simply exit
	}
	else if(pid < 0){
		// if the pid returned is -1, then the fork() failed.
		printf("parent: and the daemon failed to start (%d).\n", errno);
		return -2;
	}

	// if the pid is 0 then this process is the child
	// setsid() makes the process the leader of a new session. This is the
	// reason we had to fork() above. Since the parent was already the process
	// group leader creating another session would fail.
	if(setsid() < 0){
		printf("daemon: I failed to create a new session.\n");
		return -3;
	}

	// when the child is spawned all its' properties are inherited from
	// the parent including the working directory as shown below
	char workingDirectory[256];
	char* wd = getwd(workingDirectory);
	printf("daemon: current working directory is '%s'\n", wd);

	// change the working directory appropriately. (to root for example)
	chdir("/");
	wd = getwd(workingDirectory);
	printf("daemon: new current working directory is '%s'\n", wd);

	// close whatever file descriptors might have been
	// inherited from the parent, such as stdin stdout
	for(int i = sysconf(_SC_OPEN_MAX); i--;){
		close(i);
	}

	// stdio is closed, you won't hear anything more from the daemon
	printf("daemon: now I'm silent!\n");

	// like everything else, file permissions are also inherited from the
	// parent process. This is an octal number which follows the chmod
	// pattern. The default value is 022. (write access for owner only)
	umask(022);

	// keep the daemon alive for 10 seconds.
	// here is where you would actually do some work :)
	sleep(10);

	return 0;
}
```