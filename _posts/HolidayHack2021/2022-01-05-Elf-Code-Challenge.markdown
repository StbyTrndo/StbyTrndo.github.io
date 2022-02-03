---
title:  "The Elf Code Challenge - 2021 SANS Holiday Hack Challenge"
date:   "2022-01-05 00:00:08 -0800"
categories: HolidayHack2021
header:
 teaser: /assets/images/HolidayHack2021/elf_code_lvl_0.png
---

In this challenge we have to write some python code to get an elf to move past obstacles and to a gate.

[Play the 2021 SANS Holiday Hack Challenge](https://2021.kringlecon.com/invite)

## Level 0
The first level is just a sample with the code already filled out. Just press Run.
![Level 0](/assets/images/HolidayHack2021/elf_code_lvl_0.png)

## Level 1
![Level 1](/assets/images/HolidayHack2021/elf_code_lvl_1.png)

### Solution
```python
import elf, munchkins, levers, lollipops, yeeters, pits
elf.moveLeft(10) #increased to grab the lollipop
elf.moveUp(20) #walk through the gate. Overshooting the number of spaces doesn't matter
```

## Level 2
![Level 2](/assets/images/HolidayHack2021/elf_code_lvl_2.png)

### Solution
```python
import elf, munchkins, levers, lollipops, yeeters, pits
# Get lollipop objects
lollipop1 = lollipops.get(1)
lollipop0 = lollipops.get(0)
#Move to lollipops
elf.moveTo(lollipop1.position)
elf.moveTo(lollipop0.position)

elf.moveTo({"x":2,"y":2})
```

## Level 3
![Level 3](/assets/images/HolidayHack2021/elf_code_lvl_3.png)

### Solution
```python
import elf, munchkins, levers, lollipops, yeeters, pits
lever0 = levers.get(0)
lollipop0 = lollipops.get(0)

elf.moveTo(lever0.position)
lever0.pull(lever0.data()+2) #this lever's challenge is to add 2 to a value

elf.moveTo(lollipop0.position)
elf.moveTo({"x":2,"y":2})
```

## Level 4
This one gives us a hint with a [link](https://www.freecodecamp.org/news/the-python-guide-for-beginners/#types)

![Level 4](/assets/images/HolidayHack2021/elf_code_lvl_4.png)

### Solution
```python
import elf, munchkins, levers, lollipops, yeeters, pits

lever0, lever1, lever2, lever3, lever4 = levers.get() #get all of the lever objects
elf.moveTo(lever4.position)
lever4.pull("A String") #string
elf.moveTo(lever3.position)
lever3.pull(True) #boolean
elf.moveTo(lever2.position)
lever2.pull(12) #int
elf.moveTo(lever1.position)
lever1.pull([]) #list
elf.moveTo(lever0.position)
lever0.pull({}) #dictionary
elf.moveUp(10)
```

## Level 5

![Level 5](/assets/images/HolidayHack2021/elf_code_lvl_5.png)

### Solution
```python
import elf, munchkins, levers, lollipops, yeeters, pits
lever0, lever1, lever2, lever3, lever4 = levers.get()
elf.moveTo(lever4.position)
lever4.pull(lever4.data()+" concatenate") #concatenate strings
elf.moveTo(lever3.position)
lever3.pull(not lever3.data()) #invert boolean value
elf.moveTo(lever2.position)
lever2.pull(lever2.data()+1) #add 1
elf.moveTo(lever1.position)
li=lever1.data()
li.append(1)
lever1.pull(li) #append 1 to the end of the list
elf.moveTo(lever0.position)
dic = lever0.data()
dic["strkey"]="strvalue"
lever0.pull(dic) #add "strkey":"strvalue" to dict
elf.moveUp(10)
```

## Level 6
There are a couple of links to [freecodecamp](https://www.freecodecamp.org/news/the-python-guide-for-beginners/#operators) in the hints for this one.

![Level 6](/assets/images/HolidayHack2021/elf_code_lvl_6.png)

### Lever Objective
Calling `lever.data()` will return a boolean, a number, a list of integers, a string, or a dict with `"a"` and an integer to you. For a boolean, return the inverse. For a number, return double the number. For a list of integers, return that list with each integer incremented by 1. For a string, return the string concatenated with itself. For a dict, return the dict with `a`'s value + 1.

### Solution
```python
import elf, munchkins, levers, lollipops, yeeters, pits
lever = levers.get(0)
data = lever.data()
if type(data) == bool:
    data = not data
elif type(data) == int:
    data = data * 2
elif type(data) == list:
    data = [element + 1 for element in data]
elif type(data) == str:
    data = data + data
else:
    data['a'] = data['a']+1
    
elf.moveTo(lever.position)
lever.pull(data)
elf.moveUp(10)
```

## Level 7
This one includes a [link](https://www.freecodecamp.org/news/the-python-guide-for-beginners/#forloops) to how to make loops in python.

![Level 7](/assets/images/HolidayHack2021/elf_code_lvl_7.png)

### Solution
```python
import elf, munchkins, levers, lollipops, yeeters, pits
for num in range(10):
    elf.moveLeft(3)
    elf.moveUp(20)
    elf.moveLeft(3)
    elf.moveDown(20)
```

## Level 8
![Level 8](/assets/images/HolidayHack2021/elf_code_lvl_8.png)

### Munchkin Objective
Use `munchkin.ask()` and I will return a JSON object similar to:

```json
{
    "2ghd3":327,
    "pwmcojfd":23,
    "ivntirc":"asjkdhfg",
    "qpwo":76,
    "szixuchv":"lollipop",
    "aiusywt":4,
    "xmzxcv":"sdfhj",
}
```

Use `munchkin.answer(answer)` to tell me the name of the **key** with a _value_ of **lollipop**.

In this example, the solution would be `munchkin.answer("szixuchv")`.

### Solution
```python
import elf, munchkins, levers, lollipops, yeeters, pits
all_lollipops = lollipops.get()
munchkin = munchkins.get(0)
json = munchkin.ask()
for key in json:
    if json[key]=='lollipop':
        ans=key
for lollipop in all_lollipops:
    elf.moveTo(lollipop.position)
munchkin.answer(ans)
elf.moveTo({'x':2,'y':2})
```