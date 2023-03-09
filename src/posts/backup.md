title: Backing Up My Desktop
 desc: I had a disused laptop and an Ethernet cable; I used those to backup my files.
 date: 2022-09-04

I recently acquired an Ethernet cable and had a spare laptop that was gathering dust with a 500GB hard drive in it. I've been meaning to backup my desktop since I've had troublesome moments where I accidentally deleted important files of mine or was on the precipice of deleting important files of mine. I thought, why not hook my desktop up to that old laptop with the Ethernet cable and copy my files and directories over using something like `rsync`?

In case you're unfamiliar, backing up a computer means copying its files and folders over to another computer, so in case something happens to your files that makes them inaccessible—like a corrupted hard drive, ransomware, or your clumsy fingers irreparably damaging them—you still have a copy on the other machine. `rsync` is a tool to copy files and folders that's smart and fast: It doesn't copy everything, it just copies the things it *must* copy.

I install Ubuntu Server on that laptop and create the user `kjc`. I make three directories in the home folder of `kjc`: `daily`, `weekly`, and `monthly`, to store my backups at those time increments. I notice that Ubuntu wasn't using the full 500GB that the hard drive was capable of, instead only registering around 100GB. It turns out I needed to expand the LVM, which is as simple as just two commands:

```
$ sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
$ sudo resize2fs /dev/ubuntu-vg/ubuntu-lv
```

To get the laptop and the desktop to talk to each other via the Ethernet cable, I assigned each an IP address. On Ubuntu there's Netplan, so in `/etc/netplan/99-ethernet.yaml` I write:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp1s0:
      addresses:
        - 10.0.0.20/24
```

Then I run `sudo netplan apply` to register the configuration. On my desktop I have Network Manager, so I run `nmcli device modify enp2s0 ipv4.method manual ipv4.address 10.0.0.10/24`. Now the laptop has the IP address of `10.0.0.20`, while my desktop has the IP address `10.0.0.10`.

I then authorize two keys on the laptop: The first is my GitHub SSH key so the everyday user on my desktop can SSH in to restore files or maintain the backups; the other is a key with no password generated on my desktop as root to use specifically to store backups (since some of my files need root permissions to access). I also create an alias in `/root/.ssh/config`:

```
Host backup
	User kjc
	Hostname 10.0.0.20
	IdentityFile ~/.ssh/backup
```

So I can SSH as root to the laptop without password prompts or any other hassles. To automatically backup my system at time increments, I edit root's crontab by running `sudo EDITOR=vim crontab -e`, then write:

```
0 0 * * * rsync -AaXH --delete --exclude={'/dev/*','/proc/*','/sys/*','/tmp/*','/run/*','/mnt/*','/media/*','/lost+found','/var/cache/*','/home/kjc/.cache/*','/home/kjc/VirtualBox VMs/*','/home/kjc/Downloads/*','/home/kjc/hugo/*'} / backup:/home/kjc/daily
0 0 * */1 * rsync -AaXH --delete --exclude={'/dev/*','/proc/*','/sys/*','/tmp/*','/run/*','/mnt/*','/media/*','/lost+found','/var/cache/*','/home/kjc/.cache/*','/home/kjc/VirtualBox VMs/*','/home/kjc/Downloads/*','/home/kjc/hugo/*'} / backup:/home/kjc/monthly
0 0 * * 0 rsync -AaXH --delete --exclude={'/dev/*','/proc/*','/sys/*','/tmp/*','/run/*','/mnt/*','/media/*','/lost+found','/var/cache/*','/home/kjc/.cache/*','/home/kjc/VirtualBox VMs/*','/home/kjc/Downloads/*','/home/kjc/hugo/*'} / backup:/home/kjc/weekly
```

The commands are so long because I had to exclude a lot of directories that aren't copyable, like `/proc`, or that are too bulky and worthless to copy like `VirtualBox VMs` or `.cache`. The end of each command tells `rsync` to copy to `backup`, which utilizes the alias I created earlier and really means `-i ~/.ssh/backup kjc@10.0.0.20` or "SSH to `10.0.0.20` as the user `kjc` and authenticate with the SSH key `~/.ssh/backup`." Remember, `10.0.0.20` is the IP address we assigned to the laptop earlier. All three commands are the same except for the directory they copy to.

That's it. Now I can confidently manipulate files and directories, unrestrained by the threat of accidental removal because I probably have a copy of it on the laptop.

Also, a trick: Say that you're converting a whole folder of videos to a different format—or anything else that involves mass, potentially destructive manipulation—but you don't want to lose the original source videos in case you blunder the conversion. You could make another copy of the folder with `cp -r videos/ videos~/` and that works fine but is *very* slow if your directory is of substantial size. Instead, what you can do is create a hard link with `cp -al videos/ videos~/`. The `-a` flag stands for archive, which tells `cp` to copy recursively, ignore symbolic links, and preserve everything. The `-l` flag means create hard links. Even if you manage to mess up the conversion or delete a portion of the videos, since you still have the hard links, you still have the original videos. Of course, this applies to all files (torrents, eBooks, audio, etc.) not just videos.
