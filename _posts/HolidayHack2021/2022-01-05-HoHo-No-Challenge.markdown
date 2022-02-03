---
title:  "HoHo ... No Challenge - 2021 SANS Holiday Hack Challenge"
date:   "2022-01-05 00:00:03 -0800"
categories: HolidayHack2021
header:
 teaser: /assets/images/HolidayHack2021/kringlecon_2021_pic.jpg
---

In this challenge, we're using `fail2ban` to automatically add bad actors to the 'naughty list'

[Play the 2021 SANS Holiday Hack Challenge](https://2021.kringlecon.com/invite)

## Objective

Here's our objective for this go-around:
> Jack is trying to break into Santa's workshop!
>
> Santa's elves are working 24/7 to manually look through logs, identify the malicious IP addresses, and block them. We need your help to automate this so the elves can get back to making presents! Can you configure Fail2Ban to detect and block the bad IPs?
>
> - You must monitor for new log entries in `/var/log/hohono.log`
> - If an IP generates 10 or more failure messages within an hour then it must be added to the naughty list by running `naughtylist add <ip>`
>  `/root/naughtylist add 12.34.56.78`
> - You can also remove an IP with `naughtylist del <ip>`
> `/root/naughtylist del 12.34.56.78`
> - You can check which IPs are currently on the naughty list by running `/root/naughtylist list`
>
>You'll be rewarded if you correctly identify all the malicious IPs with a Fail2Ban filter in `/etc/fail2ban/filter.d`, an action to ban and unban in `/etc/fail2ban/action.d`, and a custom jail in `/etc/fail2ban/jail.d`. Don't add any nice IPs to the naughty list!
>
> *** IMPORTANT NOTE! ***
>
> Fail2Ban won't rescan any logs it has already seen. That means it won't automatically process the log file each time you make changes to the Fail2Ban config. When needed, run `/root/naughtylist refresh` to re-sample the log file and tell Fail2Ban to reprocess it.

## Investigating the Log File

Let's start by looking at that log file.

```bash
cat /var/log/hohono.log
```

Here's a random sample of logs from that file:
```
2021-12-16 05:27:56 Valid heartbeat from 24.53.242.49
2021-12-16 05:27:57 90.111.60.200: Request completed successfully
2021-12-16 05:27:58 Login from 35.193.239.91 rejected due to unknown user name
2021-12-16 05:27:59 115.196.81.7: Request completed successfully
2021-12-16 05:28:00 55.72.164.130: Request completed successfully
2021-12-16 05:28:00 59.22.198.217: Request completed successfully
2021-12-16 05:28:00 Valid heartbeat from 145.165.191.104
2021-12-16 05:28:01 Login from 42.142.139.220 successful
2021-12-16 05:28:02 189.176.80.182: Request completed successfully
2021-12-16 05:28:03 40.222.223.130: Request completed successfully
2021-12-16 05:28:04 158.128.67.184: Request completed successfully
2021-12-16 05:28:05 137.131.3.15: Request completed successfully
2021-12-16 05:28:05 Login from 124.154.251.108 successful
2021-12-16 05:28:05 Valid heartbeat from 90.111.60.200
2021-12-16 05:28:06 97.198.233.50: Request completed successfully
2021-12-16 05:28:07 64.141.248.161: Request completed successfully
2021-12-16 05:28:07 Login from 74.145.61.146 successful
2021-12-16 05:28:07 Valid heartbeat from 119.242.156.203
2021-12-16 05:28:08 Valid heartbeat from 108.149.87.152
2021-12-16 05:28:08 Valid heartbeat from 39.106.22.137
2021-12-16 05:28:09 Login from 176.149.253.61 successful
2021-12-16 05:28:10 134.178.54.165: Request completed successfully
2021-12-16 05:28:10 171.132.13.232: Request completed successfully
2021-12-16 05:28:10 39.106.22.137: Request completed successfully
2021-12-16 05:28:10 58.27.238.141: Request completed successfully
2021-12-16 05:28:11 Login from 79.75.194.34 successful
2021-12-16 05:28:13 Login from 207.187.136.56 successful
2021-12-16 05:28:13 Valid heartbeat from 118.205.129.106
2021-12-16 05:28:15 145.225.40.65: Request completed successfully
2021-12-16 05:28:15 8.252.64.249: Request completed successfully
2021-12-16 05:28:15 Login from 56.1.175.187 successful
2021-12-16 05:28:15 Valid heartbeat from 58.252.183.72
2021-12-16 05:28:16 Failed login from 99.151.71.179 for angel
2021-12-16 05:28:16 Login from 39.106.22.137 successful
2021-12-16 05:28:17 Login from 42.102.20.202 successful
2021-12-16 05:28:18 Login from 42.142.139.220 successful
2021-12-16 05:28:18 Login from 58.252.183.72 successful
2021-12-16 05:28:18 Valid heartbeat from 30.240.149.178
2021-12-16 05:28:19 Login from 122.90.211.113 successful
2021-12-16 05:28:19 Valid heartbeat from 122.90.211.113
2021-12-16 05:28:19 Valid heartbeat from 173.37.220.74
2021-12-16 05:28:20 Login from 59.189.211.35 successful
2021-12-16 05:28:20 Login from 77.230.145.67 successful
2021-12-16 05:28:20 Valid heartbeat from 16.162.11.50
2021-12-16 05:28:20 Valid heartbeat from 221.126.111.19
```

We're asked to add an IP to the naughty list if it "generates 10 or more failure messages within an hour"

I can see some failures here, but I'm not sure if this is all of them. Let's try using `grep` to remove the ones that look to be successful:

```bash
grep --ignore-case -Ev "(success|valid)" /var/log/hohono.log
```
**Note:** `-v` is the inverse match flag in `grep`. `-E` specifies a regex filter.

From what I can see here, there are three types of failures. Here are some random examples:
```
2021-12-17 04:43:55 Login from 128.224.40.44 rejected due to unknown user name
2021-12-17 04:44:02 33.216.2.5 sent a malformed request
2021-12-17 04:44:16 Failed login from 60.64.102.57 for vixen
```


## Setting up Fail2Ban

The [debian manpages for jail.conf](https://manpages.debian.org/testing/fail2ban/jail.conf.5.en.html) are a great resource for figuring out the config files here.

### Action

First, we'll set up our action for Fail2Ban:

```bash
nano /etc/fail2ban/action.d/naughty_list_a.conf
```

```conf
[Definition]

actionban = /root/naughtylist add <ip>
actionunban = /root/naughtylist del <ip>
```

This one is relatively simple. It's just the commands we want to run to ban and unban people. In our case it's not really necessary to set up the unban action since all of the bans are permanent, but it's good for practice.

### Filter

Next, we'll set up our filter, which just defines the regex we use to identify failures in the logs:

```bash
nano /etc/fail2ban/filter.d/naughty_list_f.conf
```

```conf
[Definition]

failregex = ^ Failed login from <ADDR> .*$
            ^ <ADDR> sent a malformed request$
			^ Login from <ADDR> rejected due to unknown user name$
```

Each line is a different regex filter that fail2ban will try to match to identify failures. Because the date is in a standard format, fail2ban automatically grabs it from each line, parses it, and removes it for us.

`<ADDR>` indicates where the IP address is in the log.


### Jail

In the jail configuration, we link together the filter and the action with the log file and some additional configurations about when to ban an IP and how long to ban them for.

We'll run this to set up the jail configuration file:
```bash
nano /etc/fail2ban/jail.d/naughty_list_j.conf
```
```conf
[naughty_list_j]

enabled = true
filter = naughty_list_f
logpath = /var/log/hohono.log
action = naughty_list_a
bantime = -1
maxretry = 10
findtime = 3600
```

We set `bantime = -1` because that makes the bans permanent and `maxretry = 10` and `findtime = 3600` because we were told to ban an IP if they triggered more than 10 failures in an hour.


## Testing it Out

Now let's restart fail2ban to apply our new configs:
```bash
fail2ban-client reload
```

Now if we run:

```bash
/root/naughtylist refresh
```

we should get something like this

```
Log file refreshed! It may take fail2ban a few moments to re-process.
60.64.102.57 has been added to the naughty list!
128.224.40.44 has been added to the naughty list!
13.148.94.43 has been added to the naughty list!
142.206.34.24 has been added to the naughty list!
181.198.84.242 has been added to the naughty list!
56.190.21.216 has been added to the naughty list!
...
```

and we're done!

## Troubleshooting

If you're having trouble, you can test out the filter and the jail/action separately to make sure each file is working. **Beware though, you might have to exit out of the console and go back in (restarting the challenge fresh) if you want to get the achievement.**

### Testing the Filter

We can test our filter by using:
```bash
fail2ban-regex /var/log/hohono.log /etc/fail2ban/filter.d/naughty_list_f.conf
```

this should return something like this if it is working correctly:
```
Running tests
=============

Use   failregex filter file : naughty_list_f, basedir: /etc/fail2ban
Use         log file : /var/log/hohono.log
Use         encoding : UTF-8


Results
=======

Failregex: 2467 total
|-  #) [# of hits] regular expression
|   1) [843] ^ Failed login from <ADDR> .*$
|   2) [826] ^ <ADDR> sent a malformed request$
|   3) [798] ^ Login from <ADDR> rejected due to unknown user name$
`-

Ignoreregex: 0 total

Date template hits:
|- [# of hits] date format
|  [28811] {^LN-BEG}ExYear(?P<_sep>[-/.])Month(?P=_sep)Day(?:T|  ?)24hour:Minute:Second(?:[.,]Microseconds)?(?:\s*Zone offset)?
`-

Lines: 28811 lines, 0 ignored, 2467 matched, 26344 missed
[processed in 2.00 sec]

Missed line(s): too many to print.  Use --print-all-missed to print all 26344 lines
```

### Testing the Jail and Action

We can test our jail and our action with:
```bash
fail2ban-client set naughty_list_j banip 1.1.1.1
```
and
```bash
fail2ban-client set naughty_list_j unbanip 1.1.1.1
```
If these work, we'll get these messages printed to the console:
```
1.1.1.1 has been added to the naughty list!
1
```
and
```
1.1.1.1 has been removed from the naughty list!
1
```
