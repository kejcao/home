Reverse Engineering IOLI Crackmes | 3 | 2023-04-20 | linux,RE

A crackme is an executable program that people reverse engineer for fun. The executable usually prompts the user for a password, and the game is figuring out what that password is by reverse engineering the executable. IOLI crackmes are a series of 10 introductory crackmes we'll be reverse engineering today. They look like this

```
$ ./crackme0x00
IOLI Crackme Level 0x00
Password: 346234
Invalid Password!
$ ./crackme0x00
IOLI Crackme Level 0x00
Password: 250382
Password OK :)
```

Our goal is to get the `Password OK :)` message for every program. You can download the crackmes at [IOLI-crackme.tar.gz](https://dustri.org/b/files/IOLI-crackme.tar.gz).

## crackme0x00

The first one is trivial, we can use one of radare2's tools to get the strings of the program

```
$ rabin2 -z ./crackme0x00
[Strings]
nth paddr      vaddr      len size section type  string
―――――――――――――――――――――――――――――――――――――――――――――――――――――――
0   0x00000568 0x08048568 24  25   .rodata ascii IOLI Crackme Level 0x00\n
1   0x00000581 0x08048581 10  11   .rodata ascii Password:
2   0x0000058f 0x0804858f 6   7    .rodata ascii 250382
3   0x00000596 0x08048596 18  19   .rodata ascii Invalid Password!\n
4   0x000005a9 0x080485a9 15  16   .rodata ascii Password OK :)\n
```

We find the password is just 250382. If you don't have `rabin2` you could've also used GNU strings.

```
$ ./crackme0x00
IOLI Crackme Level 0x00
Password: 250382
Password OK :)
```

## crackme0x01

Taking a look at the disassembly shows that the only `cmp` instruction in the main function is comparing the constant `0x149a` with a local variable on the stack.

```
$ objdump -d ./crackme0x01
...
080483e4 <main>:
 80483e4:        55                           push   %ebp
 80483e5:        89 e5                        mov    %esp,%ebp
 80483e7:        83 ec 18                     sub    $0x18,%esp
 80483ea:        83 e4 f0                     and    $0xfffffff0,%esp
 80483ed:        b8 00 00 00 00               mov    $0x0,%eax
 80483f2:        83 c0 0f                     add    $0xf,%eax
 80483f5:        83 c0 0f                     add    $0xf,%eax
 80483f8:        c1 e8 04                     shr    $0x4,%eax
 80483fb:        c1 e0 04                     shl    $0x4,%eax
 80483fe:        29 c4                        sub    %eax,%esp
 8048400:        c7 04 24 28 85 04 08         movl   $0x8048528,(%esp)
 8048407:        e8 10 ff ff ff               call   804831c <printf@plt>
 804840c:        c7 04 24 41 85 04 08         movl   $0x8048541,(%esp)
 8048413:        e8 04 ff ff ff               call   804831c <printf@plt>
 8048418:        8d 45 fc                     lea    -0x4(%ebp),%eax
 804841b:        89 44 24 04                  mov    %eax,0x4(%esp)
 804841f:        c7 04 24 4c 85 04 08         movl   $0x804854c,(%esp)
 8048426:        e8 e1 fe ff ff               call   804830c <scanf@plt>
 804842b:        81 7d fc 9a 14 00 00         cmpl   $0x149a,-0x4(%ebp)
 8048432:        74 0e                        je     8048442 <main+0x5e>
 8048434:        c7 04 24 4f 85 04 08         movl   $0x804854f,(%esp)
 804843b:        e8 dc fe ff ff               call   804831c <printf@plt>
 8048440:        eb 0c                        jmp    804844e <main+0x6a>
 8048442:        c7 04 24 62 85 04 08         movl   $0x8048562,(%esp)
 8048449:        e8 ce fe ff ff               call   804831c <printf@plt>
 804844e:        b8 00 00 00 00               mov    $0x0,%eax
 8048453:        c9                           leave
 8048454:        c3                           ret
 8048455:        90                           nop
...
```

0x149a in decimal is 5274 and that's the password.

## crackme0x02

If you look at the disassembly again like last time you'll notice that it's doing some additions and multiplications on local variables to sort of obfuscate what the password is. It's only a few simple instructions, you could work through them manually and figure out what the password is but I think it's much easier to just use `gdb`. Jumping to the part where the comparison is taking place, we can print the value of the local variable it's comparing our input against.

```
Reading symbols from crackme0x02...
(No debugging symbols found in crackme0x02)
(gdb) start main
Temporary breakpoint 1 at 0x80483ea
Starting program: /home/kjc/IOLI/crackme0x02 main
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/usr/lib/libthread_db.so.1".

Temporary breakpoint 1, 0x080483ea in main ()
(gdb) disass main
Dump of assembler code for function main:
   0x080483e4 <+0>:    push   %ebp
   0x080483e5 <+1>:    mov    %esp,%ebp
   0x080483e7 <+3>:    sub    $0x18,%esp
=> 0x080483ea <+6>:    and    $0xfffffff0,%esp
   0x080483ed <+9>:    mov    $0x0,%eax
   0x080483f2 <+14>:   add    $0xf,%eax
   0x080483f5 <+17>:   add    $0xf,%eax
   0x080483f8 <+20>:   shr    $0x4,%eax
   0x080483fb <+23>:   shl    $0x4,%eax
   0x080483fe <+26>:   sub    %eax,%esp
   0x08048400 <+28>:   movl   $0x8048548,(%esp)
   0x08048407 <+35>:   call   0x804831c <printf@plt>
   0x0804840c <+40>:   movl   $0x8048561,(%esp)
   0x08048413 <+47>:   call   0x804831c <printf@plt>
   0x08048418 <+52>:   lea    -0x4(%ebp),%eax
   0x0804841b <+55>:   mov    %eax,0x4(%esp)
   0x0804841f <+59>:   movl   $0x804856c,(%esp)
   0x08048426 <+66>:   call   0x804830c <scanf@plt>
   0x0804842b <+71>:   movl   $0x5a,-0x8(%ebp)
   0x08048432 <+78>:   movl   $0x1ec,-0xc(%ebp)
   0x08048439 <+85>:   mov    -0xc(%ebp),%edx
   0x0804843c <+88>:   lea    -0x8(%ebp),%eax
   0x0804843f <+91>:   add    %edx,(%eax)
   0x08048441 <+93>:   mov    -0x8(%ebp),%eax
   0x08048444 <+96>:   imul   -0x8(%ebp),%eax
   0x08048448 <+100>:  mov    %eax,-0xc(%ebp)
   0x0804844b <+103>:  mov    -0x4(%ebp),%eax
   0x0804844e <+106>:  cmp    -0xc(%ebp),%eax
   0x08048451 <+109>:  jne    0x8048461 <main+125>
   0x08048453 <+111>:  movl   $0x804856f,(%esp)
   0x0804845a <+118>:  call   0x804831c <printf@plt>
   0x0804845f <+123>:  jmp    0x804846d <main+137>
   0x08048461 <+125>:  movl   $0x804857f,(%esp)
   0x08048468 <+132>:  call   0x804831c <printf@plt>
   0x0804846d <+137>:  mov    $0x0,%eax
   0x08048472 <+142>:  leave
   0x08048473 <+143>:  ret
End of assembler dump.
(gdb) b *0x0804844e
Breakpoint 2 at 0x804844e
(gdb) c
Continuing.
IOLI Crackme Level 0x02
Password: 636

Breakpoint 2, 0x0804844e in main ()
(gdb) x/d $ebp-0xc
0xffffd72c:    338724
(gdb)
```

So the password is 338724.

## crackme0x03

Take a look at the disassembly

```
$ objdump -d ./crackme0x03
...
0804846e <test>:
 804846e:        55                           push   %ebp
 804846f:        89 e5                        mov    %esp,%ebp
 8048471:        83 ec 08                     sub    $0x8,%esp
 8048474:        8b 45 08                     mov    0x8(%ebp),%eax
 8048477:        3b 45 0c                     cmp    0xc(%ebp),%eax
 804847a:        74 0e                        je     804848a <test+0x1c>
 804847c:        c7 04 24 ec 85 04 08         movl   $0x80485ec,(%esp)
 8048483:        e8 8c ff ff ff               call   8048414 <shift>
 8048488:        eb 0c                        jmp    8048496 <test+0x28>
 804848a:        c7 04 24 fe 85 04 08         movl   $0x80485fe,(%esp)
 8048491:        e8 7e ff ff ff               call   8048414 <shift>
 8048496:        c9                           leave
 8048497:        c3                           ret

08048498 <main>:
 8048498:        55                           push   %ebp
 8048499:        89 e5                        mov    %esp,%ebp
 804849b:        83 ec 18                     sub    $0x18,%esp
 804849e:        83 e4 f0                     and    $0xfffffff0,%esp
 80484a1:        b8 00 00 00 00               mov    $0x0,%eax
 80484a6:        83 c0 0f                     add    $0xf,%eax
 80484a9:        83 c0 0f                     add    $0xf,%eax
 80484ac:        c1 e8 04                     shr    $0x4,%eax
 80484af:        c1 e0 04                     shl    $0x4,%eax
 80484b2:        29 c4                        sub    %eax,%esp
 80484b4:        c7 04 24 10 86 04 08         movl   $0x8048610,(%esp)
 80484bb:        e8 90 fe ff ff               call   8048350 <printf@plt>
 80484c0:        c7 04 24 29 86 04 08         movl   $0x8048629,(%esp)
 80484c7:        e8 84 fe ff ff               call   8048350 <printf@plt>
 80484cc:        8d 45 fc                     lea    -0x4(%ebp),%eax
 80484cf:        89 44 24 04                  mov    %eax,0x4(%esp)
 80484d3:        c7 04 24 34 86 04 08         movl   $0x8048634,(%esp)
 80484da:        e8 51 fe ff ff               call   8048330 <scanf@plt>
 80484df:        c7 45 f8 5a 00 00 00         movl   $0x5a,-0x8(%ebp)
 80484e6:        c7 45 f4 ec 01 00 00         movl   $0x1ec,-0xc(%ebp)
 80484ed:        8b 55 f4                     mov    -0xc(%ebp),%edx
 80484f0:        8d 45 f8                     lea    -0x8(%ebp),%eax
 80484f3:        01 10                        add    %edx,(%eax)
 80484f5:        8b 45 f8                     mov    -0x8(%ebp),%eax
 80484f8:        0f af 45 f8                  imul   -0x8(%ebp),%eax
 80484fc:        89 45 f4                     mov    %eax,-0xc(%ebp)
 80484ff:        8b 45 f4                     mov    -0xc(%ebp),%eax
 8048502:        89 44 24 04                  mov    %eax,0x4(%esp)
 8048506:        8b 45 fc                     mov    -0x4(%ebp),%eax
 8048509:        89 04 24                     mov    %eax,(%esp)
 804850c:        e8 5d ff ff ff               call   804846e <test>
 8048511:        b8 00 00 00 00               mov    $0x0,%eax
 8048516:        c9                           leave
 8048517:        c3                           ret
 8048518:        90                           nop
...
```

Clearly the `test` function is comparing its two arguments and printing something depending on whether their equal or not. If we look at the `main` function we see that it's calling the `test` function against its local variables `-0xc(%ebp)` and `-0x4(%ebp)`. We can use `gdb` like last time to print the two arguments and one of them will be our password. Doing that yields 338724, which is the password and the same password as the last one.

## crackme0x04

Looking at the disassembly we see that the main function is passing an argument to a `check` function. Most likely, that argument is our input and the password is calculated on the fly in the `check` function. Just looking at it, it appears to be using a quite a lot of loops and conditionals and it would be annoying and burdensome to puzzle everything together in assembly (at least for me, I'm not exactly experienced with it) so we can open up Ghidra—a very nice reverse engineering tool authored by the NSA—and look at the C decompilation it gives of the `check` function

```c
void check(char *param_1)

{
  size_t sVar1;
  char local_11;
  uint local_10;
  int local_c;
  int local_8;
  
  local_c = 0;
  local_10 = 0;
  while( true ) {
    sVar1 = strlen(param_1);
    if (sVar1 <= local_10) {
      printf("Password Incorrect!\n");
      return;
    }
    local_11 = param_1[local_10];
    sscanf(&local_11,"%d",&local_8);
    local_c = local_c + local_8;
    if (local_c == 0xf) break;
    local_10 = local_10 + 1;
  }
  printf("Password OK!\n");
                    /* WARNING: Subroutine does not return */
  exit(0);
}
```

From this it's clear that we need to get `local_c` to equal 0xf, where `local_c` appears to be the sum of the digits of `check`'s argument, our input. That is to say the password is just a number whose digits sum to 15—like 96, which is a valid password.

## crackme0x05

If we look at the decompilation by Ghidra again, we see much of the same except it's calling another function `parell` if the digits sum to 0xf.

```c
void parell(char *param_1)

{
  uint local_8;
  
  sscanf(param_1,"%d",&local_8);
  if ((local_8 & 1) == 0) {
    printf("Password OK!\n");
                    /* WARNING: Subroutine does not return */
    exit(0);
  }
  return;
}
```

This function checks if its argument's first bit is not set, in other words that the number is even. In short, the password must be an even number whose digits sum to 16, like 88.

## crackme0x06

This one is similar to the last one in structure, but `check` and `parell` now take two arguments: the input and the third argument to main

```c
undefined4 main(undefined4 param_1,undefined4 param_2,undefined4 param_3)

{
  undefined local_7c [120];
  
  printf("IOLI Crackme Level 0x06\n");
  printf("Password: ");
  scanf("%s",local_7c);
  check(local_7c,param_3);
  return 0;
}
```

I suspected that `param_3` had something to do with environmental variables and searching it up followed by some experimentation confirmed my suspicions . `param_3` is `char **envp`, a null-terminated array of environmental variables represented as strings in the form of `VAR=VAL`. The `check` function hasn't changed much, but here's what the `parell` function looks like

```c
void parell(char *input,char **envp)

{
  int iVar1;
  int local_c;
  uint local_8;
  
  sscanf(input,"%d",&local_8);
  iVar1 = dummy(local_8,envp);
  if (iVar1 != 0) {
    for (local_c = 0; local_c < 10; local_c = local_c + 1) {
      if ((local_8 & 1) == 0) {
        printf("Password OK!\n");
                    /* WARNING: Subroutine does not return */
        exit(0);
      }
    }
  }
  return;
}
```

The for loop is a red herring, the function does the same thing as it did last time but this time we must ensure that the `dummy` function returns a nonzero value. The `dummy` function looks like

```c
undefined4 dummy(uint input,char **envp)

{
  int iVar1;
  int i;
  
  i = 0;
  do {
    if (envp[i] == (char *)0x0) {
      return 0;
    }
    iVar1 = strncmp(envp[i],"LOLO",3);
    i = i + 1;
  } while (iVar1 != 0);
  return 1;
}
```

It returns 1 if any of the environmental variables in `envp` starts with "LOL"—not necessarily "LOLO" because of the 3 in `strncmp`. We want it to return 1 so we just pass an environmental variable that begins with "LOL" and give it the same input as last time. It looks like this

```
$ LOL= ./crackme0x06
IOLI Crackme Level 0x06
Password: 88
Password OK!
```

## crackme0x07

The first thing I did was input the exact same password as the last crackme

```
$ LOL= ./crackme0x07
IOLI Crackme Level 0x07
Password: 88
Password OK!
```

And it works. But let's reverse engineer it anyway and figure out how it works. The first thing we notice is the symbols have been stripped

```
$ file ./crackme0x07
./crackme0x07: ELF 32-bit LSB executable, Intel 80386, version 1 (SYSV),
dynamically linked, interpreter /lib/ld-linux.so.2, for GNU/Linux 2.6.9, stripped
```

If we run `objdump -d` we just get a huge blob of instructions in `.text`. No worries, from the top we see

```
08048400 <.text>:
 8048400:        31 ed                        xor    %ebp,%ebp
 8048402:        5e                           pop    %esi
 8048403:        89 e1                        mov    %esp,%ecx
 8048405:        83 e4 f0                     and    $0xfffffff0,%esp
 8048408:        50                           push   %eax
 8048409:        54                           push   %esp
 804840a:        52                           push   %edx
 804840b:        68 50 87 04 08               push   $0x8048750
 8048410:        68 e0 86 04 08               push   $0x80486e0
 8048415:        51                           push   %ecx
 8048416:        56                           push   %esi
 8048417:        68 7d 86 04 08               push   $0x804867d
 804841c:        e8 67 ff ff ff               call   8048388 <__libc_start_main@plt>
 8048421:        f4                           hlt
 8048422:        90                           nop
 8048423:        90                           nop
...
```

This asks `__libc_start_main` to start the main function. The address it pushes right before calling the function is where our main function is

```
...
 804867d:        55                           push   %ebp
 804867e:        89 e5                        mov    %esp,%ebp
 8048680:        81 ec 88 00 00 00            sub    $0x88,%esp
 8048686:        83 e4 f0                     and    $0xfffffff0,%esp
 8048689:        b8 00 00 00 00               mov    $0x0,%eax
 804868e:        83 c0 0f                     add    $0xf,%eax
 8048691:        83 c0 0f                     add    $0xf,%eax
 8048694:        c1 e8 04                     shr    $0x4,%eax
 8048697:        c1 e0 04                     shl    $0x4,%eax
 804869a:        29 c4                        sub    %eax,%esp
 804869c:        c7 04 24 d9 87 04 08         movl   $0x80487d9,(%esp)
 80486a3:        e8 10 fd ff ff               call   80483b8 <printf@plt>
 80486a8:        c7 04 24 f2 87 04 08         movl   $0x80487f2,(%esp)
 80486af:        e8 04 fd ff ff               call   80483b8 <printf@plt>
 80486b4:        8d 45 88                     lea    -0x78(%ebp),%eax
 80486b7:        89 44 24 04                  mov    %eax,0x4(%esp)
 80486bb:        c7 04 24 fd 87 04 08         movl   $0x80487fd,(%esp)
 80486c2:        e8 d1 fc ff ff               call   8048398 <scanf@plt>
 80486c7:        8b 45 10                     mov    0x10(%ebp),%eax
 80486ca:        89 44 24 04                  mov    %eax,0x4(%esp)
 80486ce:        8d 45 88                     lea    -0x78(%ebp),%eax
 80486d1:        89 04 24                     mov    %eax,(%esp)
 80486d4:        e8 e0 fe ff ff               call   80485b9 <exit@plt+0x1d1>
 80486d9:        b8 00 00 00 00               mov    $0x0,%eax
 80486de:        c9                           leave
 80486df:        c3                           ret
...
```

It does what we've seen before and it calls some check function again at `80485b9 <exit@plt+0x1d1>`. I'll use Ghidra from now on. The `check` function looks like

```c
void check(char *input,char **envp)

{
  size_t sVar1;
  int iVar2;
  char local_11;
  uint local_10;
  int local_c;
  uint local_8;
  
  local_c = 0;
  local_10 = 0;
  while( true ) {
    sVar1 = strlen(input);
    if (sVar1 <= local_10) break;
    local_11 = input[local_10];
    sscanf(&local_11,"%d",&local_8);
    local_c = local_c + local_8;
    if (local_c == 0x10) {
      parell(input,envp);
    }
    local_10 = local_10 + 1;
  }
  print_password_incorrect();
  iVar2 = dummy(local_8,envp);
  if (iVar2 != 0) {
    for (local_10 = 0; (int)local_10 < 10; local_10 = local_10 + 1) {
      if ((local_8 & 1) == 0) {
        printf("wtf?\n");
                    /* WARNING: Subroutine does not return */
        exit(0);
      }
    }
  }
  return;
}
```

The `parell` function looks similar to the one in the last `crackme` but in our `check` function there's an unreachable bit of code that prints "wtf?"

## crackme0x08

Once again the password is the same as the last crackme.

```
$ LOL= ./crackme0x08
IOLI Crackme Level 0x08
Password: 88
Password OK!
```

Just taking a look at the disassembly, it looks very much like every other one we've cracked, maybe a new function or two.

## crackme0x09

Once again the password is the same as the last crackme.

```
$ LOL= ./crackme0x09
IOLI Crackme Level 0x09
Password: 88
Password OK!
```

Once again the binary is stripped but it's not fun reverse engineering something when you've already got the answer. Maybe the author should've changed the passwords, these last couple crackmes have been almost disappointing.

## Conclusion

These were really easy and simple. It was an underwhelming ending, `crackme0x00` to `crackme0x06` were all fun and original but `crackme0x07` to `crackme0x09` just reused the same answers.

I'll do more crackmes in the future, these are pretty fun. [crackmes.one](https://crackmes.one/) has many good crackmes. I have an account on that website, my username is [kejcao](https://crackmes.one/user/kejcao).
