A Strange Hello World Program in C | 4 | 2023-05-11 | C,assembly,linux,low-level

```c
__attribute__((section(".text"))) const char main[] = {
    0x55, 0x48, 0x89, 0xe5, 0x48, 0x83, 0xec, 0x10, 0x48, 0xb8,
    0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x48, 0x89,
    0x45, 0xf1, 0x48, 0xb8, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21,
    0x0a, 0x00, 0x48, 0x89, 0x45, 0xf8, 0x48, 0x8d, 0x45, 0xf1,
    0x48, 0x89, 0xc6, 0x48, 0xc7, 0xc0, 0x01, 0x00, 0x00, 0x00,
    0x48, 0xc7, 0xc7, 0x01, 0x00, 0x00, 0x00, 0x48, 0xc7, 0xc2,
    0x0f, 0x00, 0x00, 0x00, 0x0f, 0x05, 0xb8, 0x00, 0x00, 0x00,
    0x00, 0xc9, 0xc3
};
```

Compiling the above C code with either GCC or Clang on my x86-64 Linux platform yields

```
$ gcc main.c
/tmp/ccJRPyPq.s: Assembler messages:
/tmp/ccJRPyPq.s:4: Warning: ignoring changed section attributes for .text
$ clang main.c
main.c:1:1: warning: variable named 'main' with external linkage has undefined behavior [-Wmain]
__attribute__((section(".text"))) const char main[] = {
^
1 warning generated.
$ ./a.out
hello, world!
```

Both compilers emit warnings but if we ignore them and run the executable anyway it prints "hello, world!". This is surprising as we're seemingly assigning random bytes to a variable called `main`, and the fact that it compiles at all is astonishing.

The trick is to recall that computers make no differentiation between data and code. A CPU fetches then executes 0s and 1s (called machine code) from memory and doesn't care where those 0s and 1s come from. It will happily try to run an image or a word document and interpret that as machine code, although it will likely run itself into an invalid state and segfault.

Each CPU has a different type of machine code, according to the ISA (Instruction Set Architecture) it chooses to implement. For example, Intel CPUs implement the x86/x86-64 ISA and the ARM brand of CPUs implement the eponymous ARM ISA. Machine code can be considered as a sequence of individual instructions, each of which performs a really simple task such as moving an immediate (a constant value) into a register (which are variables the CPU have) or adding two numbers. For each instruction an opcode identifies the type of instruction and parameters specify what the instruction should be done on; this is all encoded in a few bytes.

Machine code is just 0s and 1s so it's time consuming and difficult for programmers to directly write in, so programmers have invented assembly language, which is essentially the same as machine code except each instruction is identified by a mnemonic instead of an opcode—for example `mov` for move, `add` for addition, and `lea` for load effective address. Below is x86-64 machine code followed by assembly

```
b8 0a 00 00 00  =  mov eax, 10
bb 0d 00 00 00  =  mov ebx, 13
01 d8           =  add eax, ebx
```

So the sequence of bytes `0x01`, `0xd8` tell the CPU to add whatever is in the `ebx` register to the `eax` register. If we compile the following C code that prints "hello, world!" in a very straightforward manner

```c
#include <stdio.h>

int main(void) {
    printf("hello, world!\n");
}
```

Then disassemble it

```
...
0000000000001140 <main>:
    1140:        55                           push   %rbp
    1141:        48 89 e5                     mov    %rsp,%rbp
    1144:        48 8d 3d b9 0e 00 00         lea    0xeb9(%rip),%rdi        # 2004 <_IO_stdin_used+0x4>
    114b:        b0 00                        mov    $0x0,%al
    114d:        e8 de fe ff ff               call   1030 <printf@plt>
    1152:        31 c0                        xor    %eax,%eax
    1154:        5d                           pop    %rbp
    1155:        c3                           ret
...
```

We can see the assembly that the compiler generates from our C source code. In the middle column of the listing we see the actual machine code, the bits and bytes, stored in the executable. Instead of the compiler generating the assembly and then the assembler assembling the assembly, why not skip the middlemen and directly assign the machine code to our main function/array? If we try to compile that

```c
const char main[] = {
    0x55, 0x48, 0x89, 0xe5, 0x48, 0x8d, 0x3d, 0xb9, 0x0e, 0x00,
    0x00, 0xb0, 0x00, 0xe8, 0xde, 0xfe, 0xff, 0xff, 0x31, 0xc0,
    0x5d, 0xc3,
};
```

Then running the resulting executable

```
$ ./a.out
Segmentation fault (core dumped)
```

We get a segfault. This is because of a couple problems:

1. If we `objdump -d a.out`, we don't even see the main function. Try `objdump -D a.out` and we see that our main function is hidden away in the `.rodata` section, which is marked non-executable.
2. Take note of the disassembly of our normal hello world function, see how `call 1030 <printf@plt>` is calling an external symbol `printf` that is resolved at runtime by the dynamic linker. The linker can't do its job properly if GCC doesn't even know we're using the symbol `printf`.

The solution to the first problem is to explicitly force the compiler to put the main variable into the .text section. This is achieved with `__attribute__((section(".text")))`.

The solution to the second problem is to use Linux syscalls. Instead of using a constant string we'll be putting the string onto the stack instead, so it's nearby and easily addressed. Compile the following code with `-fno-stack-protector` which just simplifies the assembly by getting rid of the extraneous stack protector code

```c
#include <stdio.h>

int main(void) {
    char s[] = "hello, world!\n";
    printf(s);
}
```

Disassembling the resulting executable yields

```
...
0000000000001139 <main>:
    1139:        55                           push   %rbp
    113a:        48 89 e5                     mov    %rsp,%rbp
    113d:        48 83 ec 10                  sub    $0x10,%rsp
    1141:        48 b8 68 65 6c 6c 6f         movabs $0x77202c6f6c6c6568,%rax
    1148:        2c 20 77
    114b:        48 89 45 f1                  mov    %rax,-0xf(%rbp)
    114f:        48 b8 77 6f 72 6c 64         movabs $0xa21646c726f77,%rax
    1156:        21 0a 00
    1159:        48 89 45 f8                  mov    %rax,-0x8(%rbp)
    115d:        48 8d 45 f1                  lea    -0xf(%rbp),%rax
    1161:        48 89 c7                     mov    %rax,%rdi
    1164:        b8 00 00 00 00               mov    $0x0,%eax
    1169:        e8 c2 fe ff ff               call   1030 <printf@plt>
    116e:        b8 00 00 00 00               mov    $0x0,%eax
    1173:        c9                           leave
    1174:        c3                           ret
...
```

We can copy the assembly into a temporary source file and switch out the call to `printf` with our syscall

```
.text
.globl main
main:
    push   %rbp
    mov    %rsp,%rbp
    sub    $0x10,%rsp
    movabs $0x77202c6f6c6c6568,%rax
    
    mov    %rax,-0xf(%rbp)
    movabs $0xa21646c726f77,%rax
    
    mov    %rax,-0x8(%rbp)
    lea    -0xf(%rbp),%rax
    #mov    %rax,%rdi
    mov    %rax,%rsi # move address of string into rsi instead of rdi
    #mov    $0x0,%eax

    mov $0x1,%rax # syscall number (0x1 is write)
    mov $0x1,%rdi # file descriptor (0x1 is stdout)
    mov $0xf,%rdx # length of string (14 + 1 for null terminator)
    syscall
    #call   1030 <printf@plt>

    mov    $0x0,%eax
    leave
    ret
```

Then we assemble and link the assembly and disassemble again

```
$ gcc main.s
$ objdump -d a.out
...
0000000000001119 <main>:
    1119:        55                           push   %rbp
    111a:        48 89 e5                     mov    %rsp,%rbp
    111d:        48 83 ec 10                  sub    $0x10,%rsp
    1121:        48 b8 68 65 6c 6c 6f         movabs $0x77202c6f6c6c6568,%rax
    1128:        2c 20 77
    112b:        48 89 45 f1                  mov    %rax,-0xf(%rbp)
    112f:        48 b8 77 6f 72 6c 64         movabs $0xa21646c726f77,%rax
    1136:        21 0a 00
    1139:        48 89 45 f8                  mov    %rax,-0x8(%rbp)
    113d:        48 8d 45 f1                  lea    -0xf(%rbp),%rax
    1141:        48 89 c6                     mov    %rax,%rsi
    1144:        b8 00 00 00 00               mov    $0x0,%eax
    1149:        48 c7 c0 01 00 00 00         mov    $0x1,%rax
    1150:        48 c7 c7 01 00 00 00         mov    $0x1,%rdi
    1157:        48 c7 c2 0f 00 00 00         mov    $0xf,%rdx
    115e:        0f 05                        syscall
    1160:        b8 00 00 00 00               mov    $0x0,%eax
    1165:        c9                           leave
    1166:        c3                           ret
...
```

Now we can finally copy that machine code and combine our technique of explicitly telling the compiler to put the main variable into the .text section

```c
__attribute__((section(".text"))) const char main[] = {
    0x55, 0x48, 0x89, 0xe5, 0x48, 0x83, 0xec, 0x10, 0x48, 0xb8,
    0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x48, 0x89,
    0x45, 0xf1, 0x48, 0xb8, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21,
    0x0a, 0x00, 0x48, 0x89, 0x45, 0xf8, 0x48, 0x8d, 0x45, 0xf1,
    0x48, 0x89, 0xc6, 0x48, 0xc7, 0xc0, 0x01, 0x00, 0x00, 0x00,
    0x48, 0xc7, 0xc7, 0x01, 0x00, 0x00, 0x00, 0x48, 0xc7, 0xc2,
    0x0f, 0x00, 0x00, 0x00, 0x0f, 0x05, 0xb8, 0x00, 0x00, 0x00,
    0x00, 0xc9, 0xc3
};
```

Which is what was shown at the beginning. Note the machine code is specific to x86-64 processors and I'm doing a Linux syscall, which would be done differently on other OSes. The code is a fun party trick but for obvious reasons is not portable and horrible in practice.
