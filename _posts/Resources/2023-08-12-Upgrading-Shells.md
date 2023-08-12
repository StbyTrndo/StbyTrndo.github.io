---
title:  "Upgrading Shells"
date:   "2023-08-12 00:00:00 -0800"
categories: Resources
header:
 teaser: /assets/images/HackTheBox/Precious/Precious.png
---

If you get a non-teletype (TTY) shell, you can potentially upgrade it to a teletype shell for more functionality and fewer restrictions using the instructions below.

**Note:** If you were running a different shell instead of `bash` your host machine when you caught the shell, switch the shell to `bash` before setting up your listener or these instructions may not work properly.

## Upgrading Your Shell

If you have a limited reverse shell, you can try to increase the functionality of the shell by doing the following.

1. In the reverse shell, run
```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

2. Background the shell with `CTRL+Z`
3. Run this command (this will pass through keyboard shortcuts) 
```bash
stty raw -echo
``` 
4. Bring the shell back to the foreground by running:
```bash
fg
#Note: you won't be able to see the input on the screen
```
5. Hit `ENTER` twice
6. Run this command to set the terminal
```bash
export TERM=xterm
```

Now you should be back in your reverse shell and it should have increased capabilities, like copy/paste shortcuts, the ability to clear the screen, etc.