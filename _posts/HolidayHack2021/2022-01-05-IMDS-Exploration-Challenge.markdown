---
title:  "IMDS Exploration Challenge - 2021 SANS Holiday Hack Challenge"
date:   "2022-01-05 00:00:05 -0800"
categories: HolidayHack2021
header:
 teaser: /assets/images/HolidayHack2021/kringlecon_2021_pic.jpg
---

In this challenge, we learn about the Instance Metadata Service (IMDS), which is used by many cloud providers. This challenge is mostly on-rails with you just typing in what they ask of you.

[Play the 2021 SANS Holiday Hack Challenge](https://2021.kringlecon.com/invite)

The first thing we're asked to do is "send a couple of ping packets" to a server with a specified IP (169.254.169.254).

```bash
ping 169.254.169.254
```

In the next two sections, we run the commands as instructed as we learn the basics of IMDS:

```bash
curl http://169.254.169.254
curl http://169.254.169.254/latest
curl http://169.254.169.254/latest/dynamic
curl http://169.254.169.254/latest/dynamic/instance-identity/document
curl http://169.254.169.254/latest/dynamic/instance-identity/document | jq


curl http://169.254.169.254/latest/meta-data
curl http://169.254.169.254/latest/meta-data/public-hostname
curl http://169.254.169.254/latest/meta-data/public-hostname; echo
curl http://169.254.169.254/latest/meta-data/iam/security-credentials; echo
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/elfu-deploy-role; echo
```

Now we discuss IMDSv2. Here is the final set of commands:

```bash
cat gettoken.sh
source gettoken.sh
echo $TOKEN
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region
exit
```