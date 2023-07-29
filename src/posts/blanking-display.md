Blanking Displays on Linux | 3 | 2023-04-26 | linux

I blank my displays when I go to sleep since I don't want sharp blue light cast on my bed as I try to doze. My Linux PC can be put to sleep with the command `systemctl suspend` which also blanks the display, but often I need my PC computing some time-consuming code overnight, rendering 3D models, or transferring files to my backup so I need it still run, just with the display off. I could just turn off my only monitor hooked to the PC with the power button, but the 2K monitor takes maybe 3-4 seconds to load back up and I'm too impatient to wait that long each morning so instead I found that I can run `xset dpms force off` to turn off the screen.

If that doesn't work for you try the command `sleep 1 && xset dpms force off` which just waits a second but seems to fix things.

I also have a laptop which isn't running Xorg or any other graphical display so I can't use the `xset` command. I've tried doing what some Stack Overflow Q&As suggest, like using the command `setterm -powerdown 1` which doesn't work on my laptop or using `vbetool` which isn't in OpenSUSE's repos, so I can't install it on my laptop. Instead I followed an OpenSUSE [forum](https://forums.opensuse.org/t/how-to-turn-off-monitor-in-multi-user-mode/149732/4) in which OP has the same problem I have. In the file `/etc/systemd/logind.conf` I set `HandleLidSwitch` to `ignore`, then the file looks like

```
#  This file is part of systemd.
#
#  systemd is free software; you can redistribute it and/or modify it under the
#  terms of the GNU Lesser General Public License as published by the Free
#  Software Foundation; either version 2.1 of the License, or (at your option)
#  any later version.
#
# Entries in this file show the compile time defaults. Local configuration
# should be created by either modifying this file, or by creating "drop-ins" in
# the logind.conf.d/ subdirectory. The latter is generally recommended.
# Defaults can be restored by simply deleting this file and all drop-ins.
#
# Use 'systemd-analyze cat-config systemd/logind.conf' to display the full config.
#
# See logind.conf(5) for details.

[Login]
...
#HandleSuspendKey=suspend
#HandleHibernateKey=hibernate
#HandleLidSwitch=suspend
HandleLidSwitch=ignore
#HandleLidSwitchExternalPower=suspend
#HandleLidSwitchDocked=ignore
...
```

Then I restarted the service this config file belongs to by running the command `sudo systemctl restart systemd-logind` for the changes to take effect.

Now, when I close my laptop lid instead of shutting off it blanks the display but runs in the background, so I can still SSH into it even if the lid is shut tight and transfer files with `rsync` and backup my files between them at midnight—while I'm asleep.
