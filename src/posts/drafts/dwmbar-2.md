A DWM Status Bar in C++ | 1 | 2023-12-30 | dwm,linux,C++

A while ago I wrote a [post](/posts/dwmbar) on writing some C code to populate the status bar on my window manager DWM. I've since switched out that code for C++ and a more modular approach. The main file is stupidly simple, and is just a driver for the header files in `modules/`.

```cpp
#include "modules/battery.h"
#include "modules/memory.h"
#include "modules/vram.h"
#include "modules/celsius.h"
#include "modules/time.h"

Display *dpy = XOpenDisplay(NULL);

void update() {
    using std::chrono::seconds;

    XStoreName(
        dpy, DefaultRootWindow(dpy),
        std::format(" {} {}  +{}°C {}%  {} ",
            modules::vram(),
            modules::memory(),
            modules::celsius(),
            modules::battery(),
            modules::time()).c_str());

    XSync(dpy, False);
    std::this_thread::sleep_for(seconds(1));
}

int main(void) {
    signal(SIGUSR1, (sighandler_t)update);
    for (;;)
        update();
}
```

Let me give an example of the `time.h` module, which is simply the code

```cpp
#include <chrono>
#include <format>
#include <string>

namespace modules {
    std::string time() {
        using namespace std::chrono;

        return std::format("{:%a %b %e %I:%M:%S %p %Z %Y}",
            zoned_time(current_zone(), floor<seconds>(system_clock::now())));
    }
}
```

I have an integrated Radeon 680M which has a paltry 1GB of VRAM.

```cpp
#include <libdrm/amdgpu.h>
#include <libdrm/amdgpu_drm.h>
#include <xf86drm.h>
#include <fcntl.h>

namespace modules {
    std::string vram() {
        static auto [total, dev] = []() {
            drmDevicePtr device;

            assert(drmGetDevices(nullptr, 0) == 1); // make sure we have only one card
            assert(drmGetDevices(&device, 1) >= 0); // get that card

            // try render node first, as it does not require to drop master
            int fd = -1;
            for (int j = DRM_NODE_MAX - 1; j >= 0; --j) {
                if (1 << j & device[0].available_nodes) {
                    fd = open(device[0].nodes[j], O_RDWR);
                    break;
                }
            }
            assert(fd != -1);

            amdgpu_device_handle dev;
            uint32_t major, minor;
            amdgpu_device_initialize(fd, &major, &minor, &dev);

            struct drm_amdgpu_info_vram_gtt total;
            amdgpu_query_info(dev, AMDGPU_INFO_VRAM_GTT, sizeof(total), &total);

            return std::pair{total, dev};
        }();


        uint64_t vram, gtt;
        amdgpu_query_info(dev, AMDGPU_INFO_VRAM_USAGE, sizeof(uint64_t), &vram);
        amdgpu_query_info(dev, AMDGPU_INFO_GTT_USAGE, sizeof(uint64_t), &gtt);

        return std::format("{}%", std::round((double)vram / total.vram_size * 100));
    }
}
```
