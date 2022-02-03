---
title:  "Logic Chompers Challenge - 2021 SANS Holiday Hack Challenge"
date:   "2022-01-05 00:00:07 -0800"
categories: HolidayHack2021
header:
 teaser: /assets/images/HolidayHack2021/kringlecon_2021_pic.jpg
---

This one is more of a game than a challenge. You just have to complete one Intermediate stage on the "Potpourri" setting.

[Play the 2021 SANS Holiday Hack Challenge](https://2021.kringlecon.com/invite)

The important rules are here:

## Boolean Logic
- `OR`: only one of the two arguments must be true (`a OR b`)
- `NOT`: inverse the argument following this word (`NOT a`)
- `AND`: both of the arguments must be true (`a AND b`)
- `=`: both arguments must evaluate to the same value (`a=b`)

## Arithmetic Expressions
- `!=`: the arguments must not be the same (`a != b`)
- `>`: the preceeding argument must be greater than the following argument (`a>b`)
- `<`: the preceeding argument must be less than the following argument (`a<b`)
- `\>=`: the preceeding argument must be greater than or equal tothe following argument (`a>=b`)
- `<=`: the preceeding argument must be less than or equal to the following argument (`a<=b`)

## Number Conversions
This is just converting binary to decimal. [Cuemath](https://www.cuemath.com/numbers/binary-to-decimal/) explains it well.

## Bitwise Operations:
- `&`: (AND) Compare each bit in the two arguments. If both of the arguments have a 1 in that position, the output also has a 1 in that position. Otherwise it is a zero.
- `||`: (OR) Compare each bit in the two arguments. If at least one of the arguments has a 1 in that position, the output also has a 1 in that position. Otherwise it is a zero.
- `>>` and `<<`: Move the bits a number of bits in the direction indicated by the "arrows", filling in zeros in the newly empty spaces and dropping any digits if they fall off of the right hand side. Examples:
	- `0b00100 << 1` = `0b01000`
	- `0b10101 >> 2` = `0b00101`