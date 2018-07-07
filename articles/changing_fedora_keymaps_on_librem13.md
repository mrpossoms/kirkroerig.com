article,linux,fedora,user,x11,keyboard,keymap
# Keymaps on the Purism Librem13
I ordered a Purism Librem 13 laptop about 6 months ago because I was looking for a Linux first machine. I was doing some embedded linux work at the time, and my client's build/dev environments were setup specifically for Fedora. So I swapped out the SSD, installed Fedora and quickly found that the keyboard layouts were flawed for this machine.

The '\, |' key on the Librem were mapped to '<' and '>' which made writting C++ and using linux as it's intended extremely annoying.

## The Fix
First I had to find the keycode that the key corresponded to, I found the following command in some X11 documentation which proved useful.

```bash
$ xev | awk -F'[ )]+' '/^KeyPress/ { a[NR+2] } NR in a { printf "%-3s %s\n", $5, $8 }'
```

Within an X11 session, that brings up a window which allows you to type, see the keycode and the symbol bound to that key. I quickly found that my problem key was keycode 94.

After some grepping, I found that the key being bound to that keycode was in `/usr/share/X11/xkb/keycodes/evdev` so I had to dive into X11's keyboard database and change the following

```bash
$ cd /usr/share/X11/xkb/keycodes
$ sudo vim evdev
``` 

From within `evdev` I changed the binding for 94 to `<BKSL> = 94;` and then commented out any other assignments or aliases to `<BKSL>` in that file. After restarting my X11 session my keyboard again worked as intended!

