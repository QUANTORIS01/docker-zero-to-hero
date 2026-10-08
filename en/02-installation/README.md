[🇮🇷 فارسی](/fa/02-installation/README.md)

# Lesson 02 — Installing Docker on Windows, Linux, and macOS

## Introduction

In the previous lesson, we learned what Docker is, why it was created, and how it differs from Virtual Machines.

Now it is time to install Docker on our own machines.

In this lesson, we will install Docker on the three major desktop operating systems:

* Windows
* Linux
* macOS

By the end of this lesson, you should be able to confidently say:

> Docker is installed and working correctly on my machine.

---

# Before We Start

You do not need a powerful computer to learn Docker, but there are a few things to keep in mind.

Throughout this course, most examples will use Linux Containers.

If you are using Windows, Docker Desktop will typically use WSL 2 as its backend.

If you are using macOS, Docker Desktop provides the environment required to run containers.

If you are using Linux, Docker Engine can be installed directly on the operating system.

---

# What Is Docker Desktop?

If you are using Windows or macOS, you will probably encounter Docker Desktop.

Docker Desktop is an application that makes it easier to run and manage Docker on desktop operating systems.

Conceptually:

```text
Docker Desktop
│
├── Docker Engine
├── Docker CLI
├── Docker Compose
├── Docker Buildx
└── Desktop Integration
```

Docker Desktop should not be confused with Docker itself.

Docker Engine is the engine responsible for running containers, while Docker Desktop provides an integrated desktop environment around Docker.

---

# Part 1 — Installing Docker on Windows

## Requirements

Docker Desktop for Windows has specific system requirements.

For most users, the WSL 2 backend is the recommended choice.

Docker currently requires at least WSL version `2.1.5` for the WSL 2 backend and recommends keeping WSL up to date.

Hardware virtualization must also be enabled in your system's BIOS/UEFI for WSL 2.

Docker Desktop supports currently supported versions of Windows 10 and Windows 11.

Always check Docker's official documentation for the latest supported Windows versions.

---

# What Is WSL?

WSL stands for:

```text
Windows Subsystem for Linux
```

WSL allows Linux environments to run inside Windows.

With WSL 2, a real Linux kernel is provided to the WSL environment.

Docker Desktop can use WSL 2 to run Linux containers.

Conceptually:

```text
Windows
│
└── WSL 2
    │
    └── Linux Kernel
         │
         └── Docker
              │
              ├── Container
              ├── Container
              └── Container
```

---

# Checking WSL

Open PowerShell or Windows Terminal and run:

```powershell
wsl --version
```

If WSL is installed, version information will be displayed.

If WSL is not installed, you can install it with:

```powershell
wsl --install
```

Windows may ask you to restart your computer.

After restarting, check the WSL installation again:

```powershell
wsl --version
```

You can update WSL with:

```powershell
wsl --update
```

> Note: WSL commands and behavior may vary depending on your Windows version and organizational policies. If your system behaves differently, check the current Microsoft and Docker documentation.

---

# Installing Docker Desktop

Download Docker Desktop from the official Docker website.

Run the installer after downloading it.

During installation, Docker will offer different configuration options.

For most users, using WSL 2 is a good choice.

After the installation completes, start Docker Desktop.

The first startup may take a little longer than subsequent launches.

---

# Verifying Docker Desktop

Once Docker Desktop is running, wait until Docker is ready.

Then open Windows Terminal or PowerShell.

Run:

```powershell
docker version
```

If Docker is installed correctly, you should see information about the Docker Client and Server.

---

# Testing Docker with Hello World

Now we can perform the most important installation test.

Run:

```powershell
docker run hello-world
```

Docker first checks whether the `hello-world` Image already exists locally.

If it does not, Docker downloads the Image from a Registry.

Docker then creates and runs a Container from that Image.

Finally, the Container prints a confirmation message.

If this works successfully:

```text
Docker is working!
```

---

# An Important Note About Windows

If you are using Docker Desktop with WSL 2, you generally should not install a separate Docker Engine inside your WSL distribution.

Installing another Docker Engine inside WSL can cause conflicts.

The typical architecture is:

```text
Windows
│
├── WSL 2
│
└── Docker Desktop
      │
      └── Docker Engine
```

---

# Part 2 — Installing Docker on Linux

Linux provides a different installation experience.

Docker Engine can be installed directly on Linux.

For this course, we will use Ubuntu as our primary Linux example.

Ubuntu is widely used for development, servers, and deployment environments.

---

# Checking the Ubuntu Version

First, check your Ubuntu version:

```bash
cat /etc/os-release
```

You can also use:

```bash
lsb_release -a
```

---

# Removing Conflicting Packages

If Docker was previously installed from your distribution's package repositories, some packages may conflict with the official Docker packages.

Examples include:

```text
docker.io
docker-compose
docker-compose-v2
docker-doc
docker-buildx
podman-docker
containerd
runc
```

These packages may need to be reviewed or removed before installing Docker from the official repository.

> If Docker is already installed on your system, make sure you do not have important Containers, Images, or Volumes before removing packages.

---

# Adding the Official Docker Repository

First, install the required packages:

```bash
sudo apt update
sudo apt install ca-certificates curl
```

Create the keyring directory:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

Download Docker's official GPG key:

```bash
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
```

Make the key readable:

```bash
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Now add Docker's official repository:

```bash
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

Then update the package index:

```bash
sudo apt update
```

---

# Installing Docker Engine

Now install the main Docker packages:

```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

This installs components including:

* Docker Engine
* Docker CLI
* containerd
* Buildx
* Docker Compose Plugin

---

# Checking the Docker Service

After installation, check the Docker service:

```bash
sudo systemctl status docker
```

If Docker is running, you should see an `active` status.

If the service is not running:

```bash
sudo systemctl start docker
```

To configure Docker to start automatically during boot:

```bash
sudo systemctl enable docker
```

---

# Running Your First Container on Linux

Now run:

```bash
sudo docker run hello-world
```

If the success message is displayed, Docker Engine has been installed correctly.

---

# Why Did We Use sudo?

By default, Docker's Unix socket is configured so that a regular user may not have permission to communicate with the Docker daemon.

That is why you may initially need:

```bash
sudo docker ps
```

Using `sudo` for every Docker command is not particularly convenient.

Later in this course, we will learn how to configure non-root access.

> Security note: membership in the `docker` group effectively grants high privileges on the host system. Understand the security implications before enabling it.

For now, using `sudo` during the initial setup is perfectly acceptable.

---

# Part 3 — Installing Docker on macOS

If you are using a Mac, the installation process is straightforward.

Docker provides Docker Desktop for macOS.

---

# Apple Silicon or Intel?

Mac computers can use different CPU architectures.

Modern Macs may use Apple Silicon:

```text
Apple Silicon
├── M1
├── M2
├── M3
├── M4
└── ...
```

Older Macs may use:

```text
Intel
```

Therefore, make sure you download the Docker Desktop build that matches your Mac's architecture.

---

# Checking Your Mac Architecture

Open Terminal and run:

```bash
uname -m
```

If the output is:

```text
arm64
```

your Mac uses Apple Silicon.

If the output is:

```text
x86_64
```

your Mac uses an Intel processor.

---

# macOS Requirements

Docker Desktop supports the current macOS release and the two previous major releases.

At least 4 GB of RAM is required.

On Apple Silicon Macs, Rosetta 2 can still be useful for certain optional Darwin/AMD64 command-line tools.

If needed, install it with:

```bash
softwareupdate --install-rosetta
```

---

# Installing Docker Desktop on macOS

Download Docker Desktop from the official Docker website.

Select the version matching your Mac's architecture.

After downloading:

1. Open the Docker Desktop installer.
2. Move Docker to Applications.
3. Start Docker Desktop.
4. Complete the initial setup.

Then open Terminal.

---

# Verifying Docker on macOS

First:

```bash
docker version
```

Then:

```bash
docker run hello-world
```

If the success message is displayed, Docker has been installed correctly.

---

# Final Verification

Regardless of your operating system, by the end of this lesson you should be able to run:

```bash
docker version
```

and:

```bash
docker run hello-world
```

successfully.

---

# Useful Commands for Checking Your Installation

Let's learn a few useful commands.

## Check the Docker version

```bash
docker --version
```

Example:

```text
Docker version ...
```

---

## Display detailed Docker information

```bash
docker info
```

This command displays detailed information about the Docker Engine, containers, images, and configuration.

---

## List running containers

```bash
docker ps
```

---

## List all containers

```bash
docker ps -a
```

---

## List images

```bash
docker images
```

---

# `docker ps` vs `docker ps -a`

This distinction is extremely important.

The command:

```bash
docker ps
```

shows only currently running containers.

While:

```bash
docker ps -a
```

shows all containers, including stopped containers.

For example, after running:

```bash
docker run hello-world
```

the container may stop after printing its message.

Therefore:

```bash
docker ps
```

may show nothing.

But:

```bash
docker ps -a
```

will show the `hello-world` container.

---

# Common Problems

## Problem 1 — `docker` command not found

If you see something like:

```text
docker: command not found
```

Docker may not be installed correctly, or the Docker CLI may not be available in your PATH.

First, make sure Docker Desktop is running or verify the Docker Engine installation on Linux.

---

# Problem 2 — Docker Desktop Does Not Start

On Windows, check:

* WSL is installed.
* WSL is up to date.
* Hardware virtualization is enabled in BIOS/UEFI.
* Your Windows version is supported.

Check WSL with:

```powershell
wsl --version
```

---

# Problem 3 — Permission Denied on Linux

If:

```bash
docker ps
```

returns a permission error, test:

```bash
sudo docker ps
```

If the second command works, your user permissions are the likely cause.

We will cover this in more detail later.

---

# Problem 4 — Docker Daemon Is Not Running

If Docker reports that the daemon is not running, check:

```bash
sudo systemctl status docker
```

If necessary:

```bash
sudo systemctl start docker
```

---

# Problem 5 — `hello-world` Cannot Be Downloaded

Running:

```bash
docker run hello-world
```

may require access to a Docker Registry.

Potential causes include:

* Internet connectivity
* DNS problems
* Proxy configuration
* Firewall restrictions
* Network restrictions

Make sure your system has network access and can reach the required registry.

---

# An Important Note About Docker Hub

When you run:

```bash
docker run hello-world
```

Docker checks whether the Image already exists locally.

If it does not, Docker downloads it from a Registry.

In the default workflow, that Registry is Docker Hub.

We will explore Registries in much more detail later.

The general flow is:

```text
Docker Client
      │
      ▼
Docker Engine
      │
      ▼
Registry
      │
      ▼
Image
      │
      ▼
Container
```

---

# Exercises

## Exercise 1

Check your Docker version:

```bash
docker --version
```

---

## Exercise 2

Display Docker information:

```bash
docker info
```

---

## Exercise 3

Run your first Container:

```bash
docker run hello-world
```

---

## Exercise 4

Find the Container you just created:

```bash
docker ps -a
```

---

## Exercise 5

List the Images available locally:

```bash
docker images
```

---

# Challenge

Without looking at the explanation above, answer this question:

> Why might `docker ps` show no containers immediately after running `docker run hello-world`, while the same Container still appears in `docker ps -a`?

If you understand the answer, you have already learned your first important concept about the Container lifecycle.

---

# Summary

In this lesson, we learned:

* What Docker Desktop is.
* What WSL 2 is.
* How to install Docker on Windows.
* How to install Docker Engine on Ubuntu.
* How to install Docker Desktop on macOS.
* How to identify Apple Silicon and Intel architectures.
* How to verify Docker using `docker version`.
* How to run our first Container with `hello-world`.
* How to list running and stopped Containers.
* How to list local Images.
* How to troubleshoot common installation problems.

In the next lesson, we will start working with Docker itself.

We will no longer just install Docker.

We will start **using Docker**.
