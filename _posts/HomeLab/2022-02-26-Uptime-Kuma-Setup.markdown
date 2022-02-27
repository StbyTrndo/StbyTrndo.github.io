---
title:  "Uptime Kuma Setup"
date:   "2022-02-26 00:00:00 -0800"
categories: HomeLab
header:
 teaser: /assets/images/Homelab/Uptime_Kuma_Header.png
---

Uptime Kuma is an open-source, self-hosted app that keeps track of the status of various services and notifies you if something goes down. It's really sleek-looking and is super easy to use.

Here are the [GitHub](https://github.com/louislam/uptime-kuma) and [Docker Hub](https://hub.docker.com/r/louislam/uptime-kuma) links.

In this post, we'll go over how to set it up on a raspberry pi. I'm using a raspberry pi 4b on Raspberry Pi OS Lite (64-bit), but it doesn't really make too much difference in this case since we're using Docker.

## Installing Docker and Docker-Compose
First, we need to get Docker onto the machine. Feel free to skip this section if you already have Docker working.

### Setup

Start by SSH-ing into the raspberry pi

Let's just make sure everything is up to date first

```bash
sudo apt update && sudo apt upgrade
```

Now we'll make a new user to run Docker

```bash
sudo useradd docker
```

Now if we run

```bash
cat /etc/passwd | grep docker
```

we should see a line like this

```
docker:x:1001:1001::/home/docker:/bin/bash
```

Let's set a password

```bash
sudo passwd docker
```

Give it a strong password. Here's a [password generator from 1Password](https://1password.com/password-generator/) you can use.

### Install Docker

Now we'll install Docker. I'm largely taking this from the [official docker documentation](https://docs.docker.com/engine/install/debian/). We could also try to run it [rootless](), but honestly I'm not so concerned about it since this isn't an external-facing machine and it's only on my home network.

```bash
curl -fsSL https://get.docker.com -o get-docker.sh #get the official docker setup script
sudo sh get-docker.sh #execute it
rm get-docker.sh #remove it
```

Now we'll set up the Docker group and add our user to it

```bash
sudo usermod -aG docker docker #the first 'docker' is the group and the second is the user
```

Let's make sure Docker starts our containers whenever the system is started up

```bash
sudo systemctl enable docker
```


### Install Docker-Compose

Python comes pre-loaded on raspberry pi OS, so we don't have to worry about that, but we do have to install its package manager, pip.

```bash
sudo apt install python3-pip
```

Then we just run 

```bash
sudo pip install docker-compose
```
 
 and we're done!
 
### Validating This All Worked

Let's just make sure this all worked. 

Switch to the docker user

```bash
su docker
```

and make sure we can run Docker commands

```bash
docker run hello-world
```

We should get something like this back

```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
93288797bd35: Pull complete
Digest: sha256:97a379f4f88575512824f3b352bc03cd75e239179eea0fecc38e597b2209f49a
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

Run

```bash
docker-compose -v
```

and we should get back the version of docker-compose we're running. In my case it looked like this
```
docker-compose version 1.29.2, build unknown
```

Now run

```bash
exit
```

to switch back to the user you initially logged in as (usually the `pi` user).


## Install and Run Uptime Kuma

Let's create a directory for our Docker containers to live in

```bash
sudo mkdir /var/docker #make /var/docker directory. This could be anywhere on your system. Just choose what's right for you.
sudo chown docker:docker /var/docker #let the docker user and group own that directory
```

Now we'll switch to our `docker` user

```bash
su docker
```

and set up our file structure:

```bash
cd /var/docker
mkdir uptimekuma
mkdir uptimekuma/data
cd uptimekuma
```

We'll create our `docker-compose.yml` file

```bash
nano docker-compose.yml
```
(*Note: you might get some history warnings here. Don't worry about it. It's just because our docker user doesn't have a home directory.*)

and paste in the following
```yml
---
version: "3.1" #docker-compose api version

services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest #gets the latest image from dockerhub
    container_name: uptime-kuma #call the container uptime-kuma
    volumes:
      - /var/uptimekuma/data:/app/data #store data in the data folder we created
    ports:
      - 3001:3001 #exposes the web service on port 3001
    restart: unless-stopped #restart the service unless explicitly told to stop it
    security_opt:
      - no-new-privileges:true #prevent privilege escalation within the container
```


Now all we have to do is run

```bash
docker-compose up -d #add --force-recreate if you want to force it to re-initialize the container
```

This will download and run the uptime kuma Docker containter.

If we run

```bash
docker ps
```

it should return the details of our container, which should look like this

```
CONTAINER ID   IMAGE                    COMMAND                  CREATED          STATUS                             PORTS                                       NAMES
d71e47ba2df6   louislam/uptime-kuma:1   "/usr/bin/dumb-init …"   42 seconds ago   Up 16 seconds (health: starting)   0.0.0.0:3001->3001/tcp, :::3001->3001/tcp   uptime-kuma
```

You can run `exit` twice to leave the `docker` user and your SSH session.

## Done! Go Configure Uptime Kuma

If you go to http://X.X.X.X:3001 (replacing the Xs with your raspberry pi's IP address), you should get the uptime kuma setup page

![Setup Page](/assets/images/HomeLab/Uptime_Kuma_Setup.png)

Just enter your desired username and password (don't forget to use a [strong password](https://1password.com/password-generator/) again!) and you're ready to start using uptime kuma!