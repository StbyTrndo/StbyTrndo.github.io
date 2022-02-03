---
title:  "Document Analysis Challenge - 2021 SANS Holiday Hack Challenge"
date:   "2022-01-05 00:00:00 -0800"
categories: HolidayHack2021
header:
 teaser: /assets/images/HolidayHack2021/kringlecon_2021_pic.jpg
---

In this challenge, we use `exiftool` to check to see who last modified a file.

[Play the 2021 SANS Holiday Hack Challenge](https://2021.kringlecon.com/invite)

Here are the instructions that show up in the terminal:

>HELP! That wily Jack Frost modified one of our naughty/nice records, and right before Christmas! Can you help us figure out which one? We've installed exiftool for your convenience!

Running `ls` shows that this folder is full of `.docx` files.

Let's run `exiftool` on one of them:

```bash
exiftool 2021-12-01.docx
```
This outputs a bunch of metadata that we can look through. The one we're interested in is "Last Modified By", which shows up as "Santa Claus" for this file.

Let's check the Last Modified By field for all of the files in this folder:

```bash
exiftool -LastModifiedBy *
```

And from here we can see that all of the files were last modified by Santa Claus, except for one.

**Answer:** 2021-12-21.docx