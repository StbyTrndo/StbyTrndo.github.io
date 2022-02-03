---
title:  "Grepping for Gold Challenge - 2021 SANS Holiday Hack Challenge"
date:   "2022-01-05 00:00:02 -0800"
categories: HolidayHack2021
header:
 teaser: /assets/images/HolidayHack2021/kringlecon_2021_pic.jpg
---

In this task, we have to search through a giant file that was created using `nmap -oG`.

[Play the 2021 SANS Holiday Hack Challenge](https://2021.kringlecon.com/invite)

We're greeted with the following instructions at the top of the terminal:
```
Howdy howdy!  Mind helping me with this homew- er, challenge?
Someone ran nmap -oG on a big network and produced this bigscan.gnmap file.
The quizme program has the questions and hints and, incidentally,
has NOTHING to do with an Elf University assignment. Thanks!

Answer all the questions in the quizme executable:
- What port does 34.76.1.22 have open?
- What port does 34.77.207.226 have open?
- How many hosts appear "Up" in the scan?
- How many hosts have a web port open?  (Let's just use TCP ports 80, 443, and 8080)
- How many hosts with status Up have no (detected) open TCP ports?
- What's the greatest number of TCP ports any one host has open?

Check out bigscan.gnmap and type quizme to answer each question.
```

**Note:** the `-oG` flag in nmap specifies the output to be formatted in a way that makes grepping through it easier.

## What port does 34.76.1.22 have open?
Let's just cat out the file and grep for the ip address to see what we get:

```bash
cat bigscan.gnmap | grep 34.76.1.22
```
the output looks like this:
```
Host: 34.76.1.22 ()     Status: Up
Host: 34.76.1.22 ()     Ports: 62078/open/tcp//iphone-sync///      Ignored State: closed (999)
```

We can see that only port 62078 is open.

**Answer:** 62078

we can submit this answer by running `quizme`  in the console.

## What port does 34.77.207.226 have open?
Let's run that same command, but with this new IP:
```bash
cat bigscan.gnmap | grep 34.77.207.226
```

output:
```
Host: 34.77.207.226 ()     Status: Up
Host: 34.77.207.226 ()     Ports: 8080/open/tcp//http-proxy///      Ignored State: filtered (999)
```

This time port 8080 is open

**Answer:** 8080

## How many hosts appear "Up" in the scan?
Now we have to count the total number of occurences of something using grep. For this we can use the `-c` flag.

```bash
cat bigscan.gnmap | grep -c 'Status: Up'
```

output:
```
26054
```

**Answer:** 26054

## How many hosts have a web port open?  (Let's just use TCP ports 80, 443, and 8080)

For this, we'll use a regular expression to search for either `80`, `443`, or `8080`, followed by `/open` and count the results.
```bash
cat bigscan.gnmap | grep -c -E '(80|443|8080)/open'
```

output:
```
14372
```

**Answer:** 14372

## How many hosts with status Up have no (detected) open TCP ports?
We already know from the 3rd question how many hosts we have that are up (26054), so all we need to figure out is how many hosts have some port open. Then we just do this:

$$TotalHosts - HostsWithOpenPorts = HostsWithNoOpenPorts$$

to find the number of hosts with open ports, we can just find the number of lines where `/open` appears

```bash
cat bigscan.gnmap | grep -c '/open'
```

output:
```
25652
```

therefore:
$$HostsWithNoOpenPorts = 26054 - 25652 = 402$$

**Answer:** 402

## What's the greatest number of TCP ports any one host has open?
This one was a bit trickier. It's tough to get grep to do this just on its own. I ended up doing it the "dumb" way. (Although if it's dumb and it works, is it really dumb?)

I ended up creating a bash script for this:

```bash
max=0
cat bigscan.gnmap | while read line
        do
                temp=$( echo $line | grep -o '/open' | wc -l)
                if (($temp>$max))
                        then
                                max=$temp
                                echo $max
                fi
        done
```

basically what it does is feed the file line-by-line into grep, which then counts the total number of occurences in that line and stores that in a temporary variable. It then compares that to the current maximum. If it is greater than the current max, it changes the max and prints it out.

Putting this all into one line so we can just copy it into the terminal:
```bash
max=0; cat bigscan.gnmap | while read line; do  temp=$( echo $line | grep -o '/open' | wc -l); if (($temp>$max)); then max=$temp; echo $max; fi; done
```

Running it in the terminal yeilds the following output:

```
5
6
9
10
11
12
```

12 is the last maximum it spit out, so that is our answer.

This takes a while to run, but it works.

**Answer:** 12