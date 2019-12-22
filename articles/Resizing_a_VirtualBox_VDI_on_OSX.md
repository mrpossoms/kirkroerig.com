~article,VirtualBox,vm,administration,virtual,disk,image,linux,mac,osx,ubuntu
Resizing a Ubuntu VirtualBox VDI on OSX
=========================

I often underestimate the amount of disk space needed when creating and using a VirtualBox vm, but luckily for me it's not too hard to expand them. Here's how.

First, shutdown your VM. From your host OS, in this case OSX, run the following command with appropriate arguments replaced.

```bash
$ /Applications/VirtualBox.app/Contents/MacOS/VBoxManage modifyhd "[path to vdi]" --resize [Size in MB]
```

After that, boot your Ubuntu VM back up. Run the following command from a terminal window running on the VM.

```bash
$ fdisk [path to disk device]
```

From the fdisk REPL print partitions.

```
> p
```

Your primary partition may have a swap partition between it and the new unallocated space that you wish to extend it with. If this is the case. You will need to delete said partition. Find the number corresponding to the blocking partition in the list printed by the command above. Then use the following command to delete it.

```
> d [ number of swap/ext partition ]
```

Exit fdisk, and save your changes. After that reboot the VM.
If you don't already have it installed, go ahead and fetch gparted.
```bash
$ sudo apt-get install gparted
$ gparted
```

Use gparted to resize your remaining primary partition, and reboot!
