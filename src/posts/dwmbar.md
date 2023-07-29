dwmbar: Create a DWM Status Bar | 3 | 2022-08-15 | dwm,linux,C

DWM is a window manager and its status bar is a customizable piece of text on the top right of the screen. I wrote a C program that populates the status bar with the time and ALSA volume, in the format of `Thu Aug 11 11:03:23 AM EDT 2022 [ 36% ]`.

The code to set the window manager's name using Xlib was copied from [dwmstatus](https://git.suckless.org/dwmstatus/). Compile with `gcc main.c $(pkg-config --cflags --libs x11 alsa) -O3 -o dwmbar`.

```c
#include <X11/Xlib.h>
#include <alsa/asoundlib.h>
#include <alsa/mixer.h>
#include <signal.h>
#include <stdbool.h>
#include <stdio.h>
#include <time.h>
#include <unistd.h>

bool run = true;

void sigint_handler() {
    run = false;
}

double get_volume(snd_mixer_t *handle) {
    snd_mixer_handle_events(handle);

    snd_mixer_selem_id_t *sid;
    snd_mixer_selem_id_alloca(&sid);
    snd_mixer_selem_id_set_index(sid, 0);
    snd_mixer_selem_id_set_name(sid, "Master");

    long min, max, volume;
    snd_mixer_elem_t *elem = snd_mixer_find_selem(handle, sid);
    snd_mixer_selem_get_playback_volume_range(elem, &min, &max);
    snd_mixer_selem_get_playback_volume(elem, SND_MIXER_SCHN_FRONT_LEFT, &volume);

    return (double)volume / (max/100);
}

snd_mixer_t *create_handle(void) {
    snd_mixer_t *handle;
    snd_mixer_open(&handle, 0);
    snd_mixer_attach(handle, "default");
    snd_mixer_selem_register(handle, NULL, NULL);
    snd_mixer_load(handle);
    return handle;
}

int main(void) {
    Display *dpy = XOpenDisplay(NULL);
    snd_mixer_t *handle = create_handle();

    signal(SIGINT, sigint_handler);

    while(run) {
        char bar[128];

        time_t t = time(NULL);
        struct tm *tm = localtime(&t);
        int n = strftime(bar, sizeof(bar), " %a %b %d %r %Z %Y ", tm);

        sprintf(bar+n, "[ %.0f%% ]", get_volume(handle));

        XStoreName(dpy, DefaultRootWindow(dpy), bar);
        XSync(dpy, False);

        usleep(1000000);
    }

    snd_mixer_close(handle);
    XCloseDisplay(dpy);
}
```
