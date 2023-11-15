Migrating to & Configuring a New ThinkPad T16 Laptop | 2 | 2023-08-23 | laptop

I bought a new ThinkPad T16 laptop with an AMD Ryzen 7 Pro 6850U, 16GB of soldered RAM, and a 256GB SSD. Lenovo allows you to swap that paltry 256GB with a 1TB SSD for an additional \$550—this is a scam. I got a 1TB Samsung SSD on Amazon for less than \$100 and swapped it with the original when the laptop arrived.

I copied the data and system over from my old desktop machine to the new laptop by using Clonezilla to create an identical, block-by-block copy of the old internal SSD in my desktop to an external HDD—this took about 3–4 hours. After the T16 arrived I copied again from the external HDD to the internal SSD in the new laptop using Clonezilla—this took another 3–4 hours. Only a few things need to be done in the copy to be able to boot: changing the CPU microcode, regenerating the `/etc/fstab`, and reinstalling the bootloader. I considered an alternative method of transfer, which was to install Arch Linux from scratch on the T16 then transfer any necessary personal files and configs but decided this to be too much of a hassle.

My previous desktop machine had an Intel Core i5-7400 and 8GB RAM so this laptop is a big improvement. Everything loads quicker and feels smoother. It can also handle more open Chrome tabs without crashing. I have 400–500 chrome tabs open right now and the T16 is breezing through them. It's barely touching my 8GB of swap. I've used a desktop machine for the last couple of years so I changed my workflow and configured all the trappings a laptop has to work on my Linux system.

# TouchPad, Keyboard & Fingerprints

To reverse the scroll direction (to so called "natural scrolling" which is what I'm used to) and enable horizontal scrolling with the touchpad I installed the package `xf86-input-synaptics` and put some stuff in `/etc/X11/xorg.conf.d/70-synaptics.conf`. I made horizontal scroll slower, as can be seen.

```
Section "InputClass"
    Identifier "touchpad"
    Driver "synaptics"
    MatchIsTouchpad "on"
        Option "VertScrollDelta" "-111"
        Option "HorizScrollDelta" "-300"
        Option "HorizTwoFingerScroll" "on"
EndSection
```

I'm not used to the keyboard on the laptop. I press the Ctrl key with the side of my palm, which is easy to do since it's the leftmost key on the bottommost row. Such is not the case on the T16, where it's position is taken by the Fn key. Luckily there's a BIOS option to swap the Fn key and Ctrl key. I still connect and use my Filco mechanical keyboard for typing intensive tasks like writing this paragraph and coding though, since I like the clicky feeling of MX blues better than squishy membrane. I got the some of the media keys working by adding a bit of code to my DWM config. 

```c
#include <X11/XF86keysym.h>

...
static const char *volicmd[]  = { "pactl", "set-sink-volume", "@DEFAULT_SINK@", "+5%", NULL };
static const char *voldcmd[]  = { "pactl", "set-sink-volume", "@DEFAULT_SINK@", "-5%", NULL };
static const char *mutecmd[]  = { "pactl", "set-sink-mute", "@DEFAULT_SINK@", "toggle", NULL };
static const char *lgticmd[]  = { "sudo", "light", "-A", "5", NULL };
static const char *lgtdcmd[]  = { "sudo", "light", "-U", "5", NULL };
...
static const Key keys[] = {
...
        { NULL,                         XF86XK_AudioLowerVolume,  spawn, {.v = voldcmd } },
        { NULL,                         XF86XK_AudioRaiseVolume,  spawn, {.v = volicmd } },
        { NULL,                         XF86XK_AudioMute,         spawn, {.v = mutecmd } },
        { NULL,                         XF86XK_MonBrightnessUp,   spawn, {.v = lgticmd } },
        { NULL,                         XF86XK_MonBrightnessDown, spawn, {.v = lgtdcmd } },
...
};
```

For some reason the `light` command requires administrator privileges. I added a line  into `/etc/sudoers` so I don't have to type my password every time I change the brightness of my screen.

```
%wheel ALL=NOPASSWD: /usr/bin/light *
```

Speaking of passwords, the T16 I bought has a fingerprint reader. Luckily the reader's device ID is `27c6:6594` which is in the list of [supported devices](https://fprint.freedesktop.org/supported-devices.html) so it's a simple matter of installing the `fprintd` package and enrolling my finger and adding the line "`auth sufficient pam_fprintd.so`" to the top of my `/etc/pam.d/login`.

```shell
$ sudo fprintd-enroll kjc
Using device /net/reactivated/Fprint/Device/0
Enrolling right-index-finger finger.
Enroll result: enroll-stage-passed
Enroll result: enroll-stage-passed
Enroll result: enroll-stage-passed
Enroll result: enroll-stage-passed
Enroll result: enroll-stage-passed
Enroll result: enroll-stage-passed
Enroll result: enroll-stage-passed
Enroll result: enroll-stage-passed
Enroll result: enroll-completed
$ sudo fprintd-list kjc
found 1 devices
Device at /net/reactivated/Fprint/Device/0
Using device /net/reactivated/Fprint/Device/0
Fingerprints for user kjc on Goodix MOC Fingerprint Sensor (press):
 - #0: right-index-finger
```

# DWM Status Bar

I changed the status bar (at the top-right of my screen) to show not only the date but also my CPU temperature and battery. This is trivial to do in Bash but I wrote the code in C++ to get some practice—I haven't used the language in a hot minute.

```cpp
#include <chrono>
#include <format>
#include <fstream>
#include <sensors/sensors.h>
#include <thread>
#include <X11/Xlib.h>

using namespace std::chrono;

int main(void) {
    Display *dpy = XOpenDisplay(NULL);

    sensors_init(NULL);
    sensors_chip_name name;
    sensors_parse_chip_name("thinkpad-isa-0000", &name);
    int a = 0, b = 1, c = 0;
    auto chip = sensors_get_detected_chips(&name, &a);
    auto f = sensors_get_features(chip, &b);
    auto s = sensors_get_all_subfeatures(chip, f, &c);
    double val;

    for (;;) {
        XStoreName(
            dpy, DefaultRootWindow(dpy),
            std::format(
                " {:%a %b %e %H:%M:%S %p %Z %Y} | +{}°C {}% ",
                zoned_time(
                    current_zone(),
                    floor<seconds>(system_clock::now())
                ),
                (sensors_get_value(chip, s->number, &val), val),
                std::stoi((std::stringstream() << std::ifstream(
                    "/sys/class/power_supply/BAT0/capacity"
                ).rdbuf()).str())
            ).c_str()
        );
        XSync(dpy, False);
        std::this_thread::sleep_for(seconds(1));
    }
}
```

`std::format` is a function defined in the header `<format>` which is included in the standard library since C++20—it almost makes the language pleasurable to work in. The Makefile I use to compile the code makes available C++20 features and links the necessary libraries among other flags that enable optimizations and all warnings.

```makefile
dwmbar: main.cpp
    g++ -std=c++20 -lX11 -lsensors -pedantic -Wall -O3 $^ -o $@
```

# Alt-Tab Thumbnail Windows

```shell
$ git clone https://github.com/richardgv/skippy-xd
$ cd skippy-xd/
$ sudo make install
```

```shell
$ mkdir ~/.config/skippy-xd/
$ cp /etc/xdg/skippy-xd.rc ~/.config/skippy-xd/skippy-xd.rc
```

```shell
$ sudo pacman -S touchegg
$ mkdir ~/.config/touchegg
$ cp /usr/share/touchegg/touchegg.conf ~/.config/touchegg/touchegg.conf
```

```xml
<gesture type="SWIPE" fingers="3" direction="DOWN">
  <action type="RUN_COMMAND">
    <command>skippy-xd</command>
  </action>
  <!--action type="MINIMIZE_WINDOW">
    <animate>true</animate>
  </action-->
</gesture>
```

```shell
$ sudo systemctl enable touchegg
$ sudo systemctl start touchegg
```

# Virtual Machine

To fully take advantage of my new laptop's more powerful CPU I set up a Windows 10 VM (Virtual Machine) to play pirated games on and test software. Instead of VMware or VirtualBox I thought I'll try something new and use QEMU running KVM.

```shell
$ cd && mkdir vms && cd vms
$ qemu-img create -f raw disk.img 50G
$ # Here I downloaded the Windows 10 ISO into ~/vms directory.
$ qemu-system-x86_64 -m 4G -cdrom Win10_22H2_English_x64v1.iso -boot order=d -drive file=disk.img,format=raw
```

After installing Windows 10 as normal and powering down the VM, I added a function to start it in my `.bashrc`. The command enables KVM and allocates it 14 of my 16 cores as well as 8GB of memory. It specifies the drive file and the middle two lines are to get the audio working.

```bash
vmclean() {
    sudo systemctl set-property --runtime system.slice AllowedCPUs=0-15
    sudo systemctl set-property --runtime user.slice AllowedCPUs=0-15
}

vm() {
    sudo mkdir /sys/fs/cgroup/shield
    sudo sh -c 'echo 2-15 >/sys/fs/cgroup/shield/cpuset.cpus'
    qemu-system-x86_64                                     \
        -enable-kvm -machine q35 -device amd-iommu -smp 14 \
        -audiodev pa,id=snd0,out.mixing-engine=off         \
        -device intel-hda -device hda-duplex,audiodev=snd0 \
        -cpu host -m 4G -drive file=~/vms/disk.img,format=raw &
    sleep 1
    pid=$(pgrep qemu)
    sudo sh -c "echo $pid >/sys/fs/cgroup/shield/cgroup.procs"
    sudo systemctl set-property --runtime system.slice AllowedCPUs=0,1
    sudo systemctl set-property --runtime user.slice AllowedCPUs=0,1
    tail --pid=$pid -f /dev/null && vmclean
}
```

Unfortunately the VM is really slow. I should pin or isolate my CPU cores or something. Not sure what that means but I might make a separate post about resolving this issue later.

# Conclusion

All of the configuration written above took only 1–2 days. It's been around a week now and I'm happy with the T16. I plan to make cold backups weekly just in case the internal SSD fails some day in the distant future or I mess up and run `sudo rm -rf /`.
