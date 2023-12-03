---
title:  "Introduction to Ansible"
date:   "2023-12-03 00:00:00 -0800"
categories: HomeLab
header:
 teaser: /assets/images/HomeLab/Ansible_Header.png
---

![Ansible](/assets/images/HomeLab/Ansible_Header.png)

I have a few different devices on my home network and I want to keep them up to date. This is great, but it takes too much time to update all of these devices as frequently as I would like to. To solve this problem, I want to automate that process. Looking through my options, [ansible](https://www.ansible.com/) seemed like the way to go.

Ansible is an [open-source](https://github.com/ansible) IT automation platform built on top of python and run by Red Hat. It's agentless, pretty simple to use, highly customizable, and leveraged by many enterprises to manage large numbers of devices. This last point gives an added bonus: on top of making life easier for my home environment, knowing how to use Ansible can be a good skill to have professionally as well.

Ansible uses "playbooks" for its automation scripts. In reality, a playbook is a [YAML](https://www.redhat.com/en/topics/automation/what-is-yaml) file that ansible will run through sequentially and determines the configurations for the actions it takes.

In this post, I'll go over the process of installing and setting up ansible so you can start building your own playbooks. In my next post, I'll walk through the playbook that I built to automate updating my homelab infrastructure.

## Installing Ansible

### Pre-Requisites

Installing Ansible is pretty simple, but there are a few pre-requisites to consider:

1. You'll need to have [python](https://www.python.org/) and its package manager, `pip`, installed.

2. Windows is not natively supported as a control node (i.e. the device with ansible installed on it), so you'll either need to use a machine running linux, or you'll need to install and set up [Windows Subsystem for Linux (WSL)](https://learn.microsoft.com/en-us/windows/wsl/install).



### Installation

Now onto the actual installation. To do this in the most universal way, we'll simply use `pip` to install ansible. Open up your linux terminal (ex. bash) and run:

```bash
pip install ansible
```

Here are some other things you may need to do:

1. If you're using WSL and get an error like `Error: Could not install packages due to an OSError: [WinError 206] The filename or extension is too long`, you can open the registry editor application, navigate to `Computer\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem`, and set `LongPathsEnabled` to `1` instead of `0`.


2. If you get a warning during the install that says something like `WARNING: The scripts [...] are installed in <DIRECTORY NAME> which is not on PATH`, you can permanently add this folder to your `PATH` variable by adding the following lines to the end of your `~/.bashrc` file
    ```bash
    #Add to the path for ansible scripts
    export PATH="$PATH:<DIRECTORY NAME>"
    ```
    Make sure to replace `<DIRECTORY NAME>` with the directory in the warning. Then to apply this new setting, just run
    ```bash
    source ~/.bashrc
    ```



## Set Up the Environment
I authenticate to devices on my network using SSH keys. I decided that I wanted to give ansible its own SSH key that I would then distribute to all of my devices. You might decide that you want to just use password authentication, share your existing keys with ansible, or create a separate key for each device. All of these are totally valid options depending on your personal risk tolerance.

Here's how I set up my key and distributed it.

### Generate an SSH Key
Generate a new SSH key by running

```bash
ssh-keygen
```
Choose a filename and location for the key and give it a passphrase if you so wish. I saved my key as `~/.ssh/ansi` and gave it a strong passphrase using a password generator like [this one](https://1password.com/password-generator/).

This will create two files. The one that we specified is the private key. Additionally, a file in the same directory with the same name and a `.pub` extension will be created (for me, `~/.ssh/ansi.pub`). This is our public key. If we run `cat <path to public key>`, it will show us the public key. It should look like this

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCvH+GMBogxYe/xKrE3apC7yWHQFjpb47Yssy[...]
```

We'll copy this whole thing to a notes file for the next step.

### Distribute the Key to the Devices
Now it's just a matter of getting this new key to the devices we want to manage.

To do this, you can either use `ssh-copy-id` or manually log into your device (using whatever method you'd prefer) and add the public key you wrote down earlier to the end of the appropriate `~/.ssh/authorized_keys` file. I just added the key to the default user on each of my devices, but feel free to create a new user specifically for ansible if you'd prefer. [Linux Handbook](https://linuxhandbook.com/add-ssh-public-key-to-server/) has a good how-to on all of this if you're new to it.

Repeat the process for all of the devices you want to manage with Ansible.


## Ansible Connection Test
Now we'll make sure everything's working. To do that, we'll set up a connection test.

### Set Up the Inventory File
First, we need to create an inventory of the devices we want to test a connection to.

Start by creating a new directory

```bash
mkdir ansible_connection_test
```

move into that directory

```bash
cd ansible_connection_test
```

and start a new file called `inventory.ini`

```bash
nano inventory.ini
```

We'll create a group of hosts called `hosts` and list all of the devices we want to test under it, along with the name of the user that we added the SSH key to earlier. The file should look like this

```ini
[hosts]
server1.local	ansible_user=server1_user
server2.local   ansible_user=server2_user
server3.local	ansible_user=server3_user
...
```
### Run the Test
Now we can run our connection test.

We'll start by firing up `ssh-agent` so we don't have to specify the private key and passphrase over and over again. Run

```bash
eval `ssh-agent -s`
```

Then we'll add our private key file to `ssh-agent`

```bash
ssh-add '<path to private key>'
``` 

Enter the passphrase for the key if you set one.

Now, to run our connection test all we need to do is run

```bash
ansible hosts -m ping -i inventory.ini
```
*__Note:__ If you get any warnings saying that the authenticity of a host can't be established, just type "yes" and continue on. If you have multiple hosts, you may have to type this multiple times and it may break ansible's output formatting a bit. Saying "yes" here will add these hosts to a known hosts file on your device so it won't be asked about again.*

We should get back something like this (one of these per device we're testing)

```json
server01.local | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python3"
    },
    "changed": false,
    "ping": "pong"
}
```

## Setting up a Vault for Secure Variables
Some of my devices require a password in order to elevate privileges. Of course, updating a system requires elevated privileges. As a result, I need to include those passwords in my ansible configuration somehow. However, I don't want to include them in plaintext on my disk for security reasons. At the same time, I don't want to be bothered with typing in those passwords each time. Instead, what I can do is set up an [ansible vault](https://docs.ansible.com/ansible/latest/vault_guide/index.html). Ansible vault lets us encrypt sensitive data when not in use.

Our vault needs to be saved to a specific location to be used. Start with your terminal in the directory where you'll ultimately want to save your playbook.

Now we'll create some new directories
```bash
mkdir group_vars
cd group_vars
mkdir all
cd all
```

This will set up this directory structure
```
├───<playbook_dir>
    └───group_vars
        └───all
```

We should now be in the `all` directory. To set up our vault, we'll run

```bash
ansible-vault create vault.yml
```

After we set up our vault password it will open up a text editor (by default, `vi`, though this can be changed by setting an `EDITOR` environment variable) where we can then enter our sensitive variables into the vault using YAML syntax. The syntax should look like this

```yaml
variable_name_1: value1
variable_name_2: value2
...
```
Now we can use this vault to include these sensitive variables in our ansible configuration files. In our desired case of adding sudo (or "become") passwords for ansible to use, we can add the `ansible_become_pass` variable to the line for for the device in our inventory using templating, like this

```ini
[hosts]
server1.local   ansible_user=server1_user   ansible_become_pass='{% raw %}{{variable_name_1}}{% endraw %}'
```

Now when we run our ansible playbook ansible will use our vault to dynamically insert the sudo password into the inventory. We just need to make sure to pass our ansible command the `--ask-vault-pass` flag so it can prompt us for the password to decrypt the vault.

## Conclusion
From here, we can start to create [playbooks](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_intro.html). In my next post, I'll walk through the playbook that I created to update my homelab infrastructure.