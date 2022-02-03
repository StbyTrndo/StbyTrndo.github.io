---
title:  "Holiday Hero Challenge - 2021 SANS Holiday Hack Challenge"
date:   "2022-01-05 00:00:04 -0800"
categories: HolidayHack2021
header:
 teaser: /assets/images/HolidayHack2021/holiday_hero_opener.png
---

This is a guitar hero-like minigame, but for holiday music. It's supposed to be two-player, but there's a way to enable single-player by messing with some client-side values. A hint tells us that one of the values "is passed to the server".

[Play the 2021 SANS Holiday Hack Challenge](https://2021.kringlecon.com/invite)

Doing this 2-player is straightforward; you just play the game as intended with another player. For some fun, let's try to hack around it instead.

**Note:** I'm doing all of this on Chrome, so if you're using a different web browser the menus might be a bit different.



Clicking on the game, we're greeted with a few options:
![Opening Screen](/assets/images/HolidayHack2021/holiday_hero_opener.png)

Let's click on create room, since we don't want to do any matchmaking and we don't have a room to join as of yet.

This displays some basic instructions on how the game plays.

![Instructions](/assets/images/HolidayHack2021/holiday_hero_instructions.png)

We can close this out. The game says it's waiting for a second player.

Right-click on the game window and hit inspect (or press F12) to bring up chrome's dev tools.

## Value 1

Let's focus on the parameter that's passed to the server first. This likely means it's some kind of cookie.

Heading to the application tab, then Storage>Cookies and clicking on the `hero.kringlecastle.com` cookie brings us up a cookie that looks like this:

```
Name: HOHOHO
Value: %7B%22single_player%22%3Afalse%7D
```

The value is just `{"single_player":false}`, but URL-encoded.

Let's change "false" to "true" here by right clicking and selecting Edit "Value".

New value: `%7B%22single_player%22%3Afalse%7D`

To apply this change, right-click on the grey area around the game and select Reload Frame

## Value 2
This one isn't passed to the server, so that means it should be part of the site's code. Ths site runs on JavaScript, which devtools allows us to mess with in the console.

Looking at the Sources tab, we can see what's loaded:

![Files](/assets/images/HolidayHack2021/holiday_hero_files.png)

`c_690706...` at the bottom is the same as our "Join Code", so that's probably the game code. Under this are a number of files. `holidayhero.min.js` is probably the one to go with.

![JavaScript Code](/assets/images/HolidayHack2021/holiday_hero_raw_code.png)

It doesn't look very nice though. Luckily Chrome has a pretty-print function built in. Click on that button to make it look nice.

I'm going to CTRL+F and search for "single". At the top of the file, we can see a variable called `single_player_mode`, which is set to `!1` (which evaluates to false).

This looks like the other value we need to change. Going to the console in the bottom of the dev tools, we can change this value on the fly. First we need to switch contexts from "top" to "c_690..." (the game context)

![Developer Console](/assets/images/HolidayHack2021/holiday_hero_console.png)

After that, we just enter this:

```js
single_player_mode = true
```

We get a popup in the game window saying "Player 2 (COMPUTER) has joined!"

Sweet!

From there we can just play the game as normal with a computer player filling in the other part.