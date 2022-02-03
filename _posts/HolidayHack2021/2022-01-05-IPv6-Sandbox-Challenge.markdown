---
title:  "IPv6 Sandbox Challenge - 2021 SANS Holiday Hack Challenge"
date:   "2022-01-05 00:00:06 -0800"
categories: HolidayHack2021
header:
 teaser: /assets/images/HolidayHack2021/kringlecon_2021_pic.jpg
---

In this challenge, we're asked to get the candy striper working, but we have to use IPv6 to do it.

[Play the 2021 SANS Holiday Hack Challenge](https://2021.kringlecon.com/invite)

> Tools:
> * netcat
> * nmap
> * ping / ping 6
> * curl
> 
> Welcome, Kringlecon attendee! The candy striper is running as a service on this terminal, but I can't remember the password. Like a sticky note under the keyboard, I put the password on another machine in this network. Problem is: I don't have the IP address of that other host.
> 
> Please do what you can to help me out. Find the other machine, retrieve the password, and enter it into the Candy Striper in the pane above. I know you can get it running again!

The elf also directs us to this [GitHub Page](https://gist.github.com/chriselgee/c1c69756e527f649d0a95b6f20337c2f) discussing IPV6 syntax for the above mentioned tools.

The github page also helpfully tells us the following:

>Want to find link local addresses for systems in your network segment? Try hitting local hosts and routers with these multicast addresses:
>
>-   `ping6 ff02::1 -c2`
>-   `ping6 ff02::2 -c2` Then see what's in your ~~ARP cache~~ NDISC cache list:
>-   `ip neigh`

running `ping6 ff02::1 -c2` in the terminal recieves this result:

```
PING ff02::1(ff02::1) 56 data bytes
64 bytes from fe80::42:c0ff:fea8:a004%eth0: icmp_seq=1 ttl=64 time=0.027 ms
64 bytes from fe80::42:e0ff:fe9c:1aa7%eth0: icmp_seq=1 ttl=64 time=0.064 ms (DUP!)
64 bytes from fe80::42:c0ff:fea8:a003%eth0: icmp_seq=1 ttl=64 time=0.128 ms (DUP!)
64 bytes from fe80::42:c0ff:fea8:a002%eth0: icmp_seq=1 ttl=64 time=0.129 ms (DUP!)
64 bytes from fe80::42:c0ff:fea8:a004%eth0: icmp_seq=2 ttl=64 time=0.027 ms

--- ff02::1 ping statistics ---
2 packets transmitted, 2 received, +3 duplicates, 0% packet loss, time 28ms
rtt min/avg/max/mdev = 0.027/0.075/0.129/0.045 ms
```

so it seems like we have a few IP addresses to check now.

Let's see what services are running on them using nmap. Here's an example:

```bash
nmap -6 -sV -p- fe80::42:c0ff:fea8:a005%eth0
```

`fe80::42:c0ff:fea8:a002%eth0` shows some services running:

```
Starting Nmap 7.70 ( https://nmap.org ) at 2021-12-10 22:43 UTC
Nmap scan report for fe80::42:c0ff:fea8:a002
Host is up (0.000093s latency).
Not shown: 65533 closed ports
PORT     STATE SERVICE     VERSION
80/tcp   open  http        nginx 1.14.2
9000/tcp open  cslistener?
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port9000-TCP:V=7.70%I=7%D=12/10%Time=61B3D831%P=x86_64-pc-linux-gnu%r(N
SF:ULL,D,"PieceOnEarth\n")%r(GenericLines,D,"PieceOnEarth\n")%r(GetRequest
SF:,D,"PieceOnEarth\n")%r(HTTPOptions,D,"PieceOnEarth\n")%r(RTSPRequest,D,
SF:"PieceOnEarth\n")%r(RPCCheck,D,"PieceOnEarth\n")%r(DNSVersionBindReqTCP
SF:,D,"PieceOnEarth\n")%r(DNSStatusRequestTCP,D,"PieceOnEarth\n")%r(Help,D
SF:,"PieceOnEarth\n")%r(SSLSessionReq,D,"PieceOnEarth\n")%r(TLSSessionReq,
SF:D,"PieceOnEarth\n")%r(Kerberos,D,"PieceOnEarth\n")%r(SMBProgNeg,D,"Piec
SF:eOnEarth\n")%r(X11Probe,D,"PieceOnEarth\n")%r(FourOhFourRequest,D,"Piec
SF:eOnEarth\n")%r(LPDString,D,"PieceOnEarth\n")%r(LDAPSearchReq,D,"PieceOn
SF:Earth\n")%r(LDAPBindReq,D,"PieceOnEarth\n")%r(SIPOptions,D,"PieceOnEart
SF:h\n")%r(LANDesk-RC,D,"PieceOnEarth\n")%r(TerminalServer,D,"PieceOnEarth
SF:\n")%r(NCP,D,"PieceOnEarth\n")%r(NotesRPC,D,"PieceOnEarth\n")%r(JavaRMI
SF:,D,"PieceOnEarth\n")%r(WMSRequest,D,"PieceOnEarth\n")%r(oracle-tns,D,"P
SF:ieceOnEarth\n")%r(ms-sql-s,D,"PieceOnEarth\n")%r(afp,D,"PieceOnEarth\n"
SF:)%r(giop,D,"PieceOnEarth\n");

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 21.51 seconds
```

It looks like "PieceOnEarth" might be the right password, but let's check the web server on port 80 first.

```bash
curl http://[fe80::42:c0ff:fea8:a002]:80/ --interface eth0
```

response:
```html
<html>
<head><title>Candy Striper v6</title></head>
<body>
<marquee>Connect to the other open TCP port to get the striper's activation phrase!</marquee>
</body>
</html>
```

Let's try that other port then

```bash
curl http://[fe80::42:c0ff:fea8:a002]:9000/ --interface eth0
```

The response to this request confirms our suspicions. The response is just "PieceOnEarth"

**Answer:** PieceOnEarth