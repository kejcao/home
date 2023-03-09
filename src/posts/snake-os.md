title: Snake OS
 desc: I write a simple OS whose only purpose is to play snake.
 date: 2023-02-26

A computer operates with sequences of zeros and ones, called binary. A bit is
either a zero or a one and a byte is 8 bits, so for example `10110011` is a
byte. Each byte represents a number, for example `10110011` is 179 in our more
familiar decimal notation. Hexadecimal is an more concise way of representing
binary, one that is less verbose and more convenient and readable for a
programmer. In hexadecimal, `10110011` would be represented as `0xb3`.

A computer has RAM, which stores a sequence of bytes. Think of RAM as a long
line of numbered boxes, starting from 0, with a byte in each of them. We can
write or read from each of the boxes. The CPU (the brain of the computer)
interprets some of these bytes as machine code, and runs them. Programmer can
set numbers in these boxes for the CPU to run, although this is very difficult
so programmers created something called assembly, which through a program called
an assembler translates assembly to machine code, something the CPU can
understand. Assembly uses text and abbreviations and is much easier to write
than machine code.

If any of what I just said is alien to you, please read more about it online.

Sectors are 512-byte increments every storage device—this could be a USB, hard
drive, or CD—is divided into. For example, I have a 500 GB hard drive which has
976562500 sectors because 500 GB is the same as 500,000,000,000 bytes, which
divided by 512 bytes is equal to 976562500 sectors.

When a computer powers on, the BIOS looks at the first sector of each storage
device and if it ends with the magic number `0xaa55`, the BIOS knows this
storage device is bootable and runs the machine code in the sector; thus this
sector is called the boot sector or the master boot record (MBR). This is the
way operating systems boot themselves.

An operating system is stored as an ISO image file, an uncompressed,
sector-by-sector copy of a disc. To use an operating system on an ISO file you
would copy this file byte-by-byte to a storage device of your choice, then plug
this into a computer. This computer would recognize it as bootable because the
first 512-bytes of the ISO file ends with the magic number `0xaa55`, which if
you remember denotes a storage device as bootable.

An operating system's kernel is essential to its function, and its the job of
the operating system's bootloader (stored in the first 512-bytes, so its ran by
the BIOS) to load this kernel.

For example,

```x86asm
loop:
	jmp loop

times 510 - ($-loop) db 0
dw 0xaa55
```

Which can be assembled with `nasm bootloader.s -o os.iso`, and if we look
at the bytes of `os.iso`:

```
00000000: ebfe 0000 0000 0000 0000 0000 0000 0000  ................
00000010: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000020: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000030: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000040: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000050: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000060: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000070: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000080: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000090: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000000a0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000000b0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000000c0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000000d0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000000e0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000000f0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000100: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000110: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000120: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000130: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000140: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000150: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000160: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000170: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000180: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000190: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000001a0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000001b0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000001c0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000001d0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000001e0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
000001f0: 0000 0000 0000 0000 0000 0000 0000 55aa  ..............U.
```

`0xeb` is the opcode for the `jmp` instruction and `0xfe` is -2 in two's
complement, the way computers use to represent both negative and positive
numbers. You can copy this to a USB byte-by-byte with `dd if=os.iso
of=/dev/[device]` and plug it into a computer. The computer will boot it and do
nothing, since whenever it tries to execute the machine code it jumps back -2
bytes to the start, in which it tries again to execute the machine code and it
gets stuck in this loop, which is just what we intended.

Now that you get the gist of it, here's what I wrote for my operating system
that only plays snake:

```mips
.text
.code16
.globl _start
_start:
	# setup stack
	mov $0x7c00, %bp
	mov %bp, %sp

	# read sectors
	mov $2, %ah

	# read destination
	xor %bx, %bx
	mov %bx, %es
	mov $0x7e00, %bx

	# what to read
	mov $128, %al # sectors
	mov $0, %ch # cylinder
	mov $2, %cl # sector
	mov $0, %dh # head

	# execute read
	int $0x13

	# set up video mode
	mov $0, %ah
	mov $0x13, %al # VGA 320x200, 256 colors

	int $0x10

	# enter protected mode
	cli
	lgdt (gdt_desc)
	mov %cr0, %eax
	or $0x1, %eax
	mov %eax, %cr0

	# setup segment registers
	mov $dataseg, %ax
	mov %ax, %ds
	mov %ax, %es
	mov %ax, %fs
	mov %ax, %gs
	mov %ax, %ss

	# jump to kernel
	jmp $codeseg, $0x7e00

gdt_start:
	.quad 0x0
gdt_code:
	.word 0xffff # limit
	.word 0x0    # base (0-15)
	.byte 0x0    # base (16-23)
	# present 1; privilege 00; type 1; code 1; conforming 0;
	# readable 1; accessed 0
	.byte 0b10011010
	# granularity 1; 32-bit 1; 64-bit 0; AVL 0; limit 1111
	.byte 0b11001111
	.byte 0x0    # base (24-31)
gdt_data:
	.word 0xffff # limit
	.word 0x0    # base (0-15)
	.byte 0x0    # base (16-23)
	# present 1; privilege 00; type 1; code 0; expand down 0;
	# writable 1; accessed 0
	.byte 0b10010010
	# granularity 1; 32-bit 1; 64-bit 0; AVL 0; limit 1111
	.byte 0b11001111
	.byte 0x0    # base (24-31)
gdt_end:

gdt_desc:
	.word gdt_end-gdt_start - 1
	.long gdt_start

.equ codeseg, gdt_code-gdt_start
.equ dataseg, gdt_data-gdt_start

.skip 510 - (.-_start)
.word 0xaa55
```

tried vblank, didn't work. see bookmarks

apparently gcc employs some sort of optimization to reduce the size of data by maybe pointing the same data to the same place. This would be fine i

originally I stored the images as an array of literal strings.

```c
char *octopus1[] = {
	"000011110000",
	"011111111110",
	"111111111111",
	"111001100111",
	"111111111111",
	"000110011000",
	"001101101100",
	"110000000011",
};
char *octopus2[] = {
	"000011110000",
	"011111111110",
	"111111111111",
	"111001100111",
	"111111111111",
	"001110011100",
	"011001100110",
	"001100001100",
};
```

This is completely fine until I had to adjust the images, like when I a bullet hits a block it must explode so I set zeros.

```c
char *block[] = {
	"00000011111111111111000000",
	"00000111111111111111100000",
	"00001111111111111111110000",
	"00011111111111111111111000",
	"00111111111111111111111100",
	"01111111111111111111111110",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111111111111111111111",
	"11111111100000001111111111",
	"11111111000000000111111111",
	"11111110000000000011111111",
	"11111100000000000001111111",
	"11111100000000000001111111",
	"11111100000000000001111111",
};
```

But I forgot that string literals are meant to be *literals* and constant, so it's a no-brainer for compiler to point to exactly same string literals to the same memory location.

```c
int octopus1[] = {
	0,0,0,0,1,1,1,1,0,0,0,0,
	0,1,1,1,1,1,1,1,1,1,1,0,
	1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,0,0,1,1,0,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,
	0,0,0,1,1,0,0,1,1,0,0,0,
	0,0,1,1,0,1,1,0,1,1,0,0,
	1,1,0,0,0,0,0,0,0,0,1,1,
};
int octopus2[] = {
	0,0,0,0,1,1,1,1,0,0,0,0,
	0,1,1,1,1,1,1,1,1,1,1,0,
	1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,0,0,1,1,0,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,
	0,0,1,1,1,0,0,1,1,1,0,0,
	0,1,1,0,0,1,1,0,0,1,1,0,
	0,0,1,1,0,0,0,0,1,1,0,0,
};

int block[] = {
	0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
	0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
	0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,
	0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,
	0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
	0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
	1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
	1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
};
```

i spent a couple hours trying to figure out why I couldn't `call` functions in the bootloader. I narrowed it down to a problem with the stack. I noticed in the iso file, that the machine instructions were prefixed with `0x66`, so I suspected that the instructions were running in 32-bit or 64-bit mode instead of 16-bit mode. This was the case, and it turns out you need to put the `.code16` directive on top of your assembly to tell the `gas` assembler to output code for real mode. An excerpt from their documentation:

>>>
While GAS normally writes only "pure" 32-bit i386 code, it has limited support for writing code to run in real mode or in 16-bit protected mode code segments. To do this, insert a `.code16' directive before the assembly language instructions to be run in 16-bit mode. You can switch GAS back to writing normal 32-bit code with the `.code32' directive.
>>>

```bash
objcopy -I binary -O elf64-x86-64 cp866.psf cp866.o
```

Technical notes:

- The bootloader I've described is a single stage bootloader, all stored in a
  measly 512-bytes, way to small for any proper, professional bootloader. (Just
  look at GRUB, it's a small operating system.)  There exists two-stage
  bootloaders, which in which the first bootloader (loaded by the BIOS) loads
  the second bootloader which loads the kernel.
- I haven't loaded the A20 line because everything works fine without it. I
  think QEMU enables it by default.

binutils 2.39 and gcc 12.2.0

../binutils-2.39/configure --target=i386-elf --with-sysroot
make
sudo make install

../gdb-12.1/configure --target=i386-elf
make all-gdb
sudo make install-gdb

../gcc-12.2.0/configure --target=i386-elf --enable-languages=c --without-headers
make all-gcc
make all-target-libgcc
make install-gcc
make install-target-libgcc

