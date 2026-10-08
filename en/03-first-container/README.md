[🇮🇷 فارسی](/fa/03-first-container/README.md)

# Lesson 03 — Your First Container and the Container Lifecycle

## Introduction

So far, we have installed Docker and verified that it works correctly.

But installing Docker is only the beginning.

In this lesson, we will start working with real Containers and learn about their lifecycle.

By the end of this lesson, you will be able to:

* Run a Container.
* List running Containers.
* Find stopped Containers.
* Stop a Container.
* Start it again.
* Restart a Container.
* Remove a Container.
* View Container logs.
* Execute commands inside a Container.
* Run Containers in the background.
* Assign custom Container names.
* Understand basic Port Mapping.
* Understand the Container lifecycle.

---

# Your First Docker Command

Let's start with a simple command:

```bash
docker run hello-world
```

If Docker is installed correctly, Docker will display a success message.

But what actually happened?

Conceptually, the command goes through several steps:

```text
docker run hello-world
        │
        ▼
Does the Image exist?
        │
   ┌────┴────┐
   │         │
  Yes        No
   │         │
   │     Pull Image
   │         │
   └────┬────┘
        ▼
Create Container
        │
        ▼
Start Container
        │
        ▼
Execute Process
```

So `docker run` is not simply "start a program."

If necessary, Docker downloads the Image, creates a Container from it, and starts the Container.

---

# What Does `docker run` Actually Do?

Conceptually:

```text
docker run IMAGE
```

means:

> Create a Container from this Image and run it.

For example:

```bash
docker run nginx
```

Here:

```text
nginx
```

is the Image name.

Docker first checks whether the Image already exists locally.

If it does not, Docker downloads it from a Registry.

Docker then creates and starts a Container.

---

# Running a Real Container

Let's run an Nginx Container:

```bash
docker run nginx
```

Your terminal may remain attached to the Container's process.

For now, you can stop it with:

```text
Ctrl + C
```

However, there is a better way to run services such as Nginx.

---

# Running a Container in the Background

Use the `-d` option to run a Container in Detached Mode:

```bash
docker run -d nginx
```

The option:

```text
-d
```

stands for:

```text
detached
```

This means that the Container will run in the background.

Docker will usually print the Container ID.

For example:

```text
a8f3c2...
```

This is the Container ID.

---

# Listing Running Containers

Now run:

```bash
docker ps
```

You should see something similar to:

```text
CONTAINER ID   IMAGE   COMMAND                  CREATED        STATUS        PORTS     NAMES
a8f3c2...      nginx   "/docker-entrypoint..."  5 seconds ago Up 4 seconds  80/tcp    ...
```

The exact values will be different on your machine.

---

# Understanding `docker ps`

Let's examine the output.

## CONTAINER ID

The unique identifier of the Container.

For example:

```text
a8f3c2...
```

---

## IMAGE

The Image from which the Container was created.

For example:

```text
nginx
```

---

## COMMAND

The process that was started inside the Container.

---

## CREATED

How long ago the Container was created.

---

## STATUS

The current state of the Container.

For example:

```text
Up 10 seconds
```

means that the Container is currently running.

---

## PORTS

The ports associated with the Container.

At this stage you may see:

```text
80/tcp
```

We will study Port Mapping in more detail shortly.

---

## NAMES

Docker automatically generates a name for a Container.

It may look like:

```text
beautiful_turing
```

However, we can choose the name ourselves.

---

# Naming a Container

Use `--name` to assign a custom name:

```bash
docker run -d --name my-nginx nginx
```

Now run:

```bash
docker ps
```

You should see:

```text
my-nginx
```

under the `NAMES` column.

---

# Why Are Container Names Useful?

Imagine that you have ten Containers:

```text
my-nginx
django-app
postgres-db
redis-cache
node-api
frontend
backend
nginx-proxy
worker
scheduler
```

Managing them is much easier than using long Container IDs.

For example:

```bash
docker stop my-nginx
```

is much easier to understand than:

```bash
docker stop a8f3c2...
```

---

# Running a Named Container

Remove the previous Container first:

```bash
docker rm -f my-nginx
```

Then:

```bash
docker run -d --name my-nginx nginx
```

Now run:

```bash
docker ps
```

---

# `docker ps` vs `docker ps -a`

This is one of the most important concepts in Docker.

The command:

```bash
docker ps
```

shows only running Containers.

While:

```bash
docker ps -a
```

shows all Containers.

In other words:

```text
docker ps
    ↓
Running Containers

docker ps -a
    ↓
All Containers
```

---

# Stopping a Container

To stop a Container:

```bash
docker stop my-nginx
```

Now run:

```bash
docker ps
```

The Container should no longer appear.

But has it been deleted?

No.

Run:

```bash
docker ps -a
```

You should still see the Container.

Its status will probably look similar to:

```text
Exited (0)
```

---

# Stop Is Not Remove

These commands perform completely different operations.

```bash
docker stop my-nginx
```

stops the Container.

But:

```bash
docker rm my-nginx
```

removes the Container.

Therefore:

```text
STOP
↓
Container remains
```

while:

```text
REMOVE
↓
Container is deleted
```

---

# Starting a Stopped Container

If a Container has been stopped, we can start it again:

```bash
docker start my-nginx
```

Now:

```bash
docker ps
```

should show the Container as running again.

---

# `docker run` vs `docker start`

This distinction is extremely important.

## `docker run`

Creates a new Container and starts it.

```bash
docker run nginx
```

## `docker start`

Starts an existing stopped Container.

```bash
docker start my-nginx
```

So conceptually:

```text
docker run
    ↓
Create + Start

docker start
    ↓
Start Existing Container
```

---

# Restarting a Container

Sometimes we want to restart a Container:

```bash
docker restart my-nginx
```

Docker stops the Container and starts it again.

Restarting can be useful when a service temporarily becomes unhealthy or needs to be restarted after a configuration change.

---

# Removing a Container

To remove a stopped Container:

```bash
docker rm my-nginx
```

Then:

```bash
docker ps -a
```

The Container should no longer exist.

---

# Why Can't We Remove a Running Container?

If the Container is running and you execute:

```bash
docker rm my-nginx
```

Docker normally refuses to remove it.

You should first stop it:

```bash
docker stop my-nginx
```

Then:

```bash
docker rm my-nginx
```

---

# Force Removal

You can forcefully remove a Container using:

```bash
docker rm -f my-nginx
```

This stops and removes the Container.

However, avoid using `-f` unnecessarily.

---

# Viewing Container Logs

Containers often run applications that produce output.

To view the logs:

```bash
docker logs my-nginx
```

If there is a lot of output, you can display only the last 50 lines:

```bash
docker logs --tail 50 my-nginx
```

---

# Following Logs in Real Time

To follow new log output:

```bash
docker logs -f my-nginx
```

The option:

```text
-f
```

means:

```text
follow
```

New log entries will be displayed as they appear.

Press:

```text
Ctrl + C
```

to leave the log-following mode.

---

# Executing Commands Inside a Container

One of Docker's most useful features is the ability to execute commands inside a running Container.

For example:

```bash
docker exec -it my-nginx sh
```

The two important options are:

```text
-i
```

and:

```text
-t
```

They are commonly combined as:

```text
-it
```

Conceptually:

```text
-i
Interactive

-t
TTY
```

If the command succeeds, you will enter a Shell inside the Container.

Try:

```bash
ls
```

or:

```bash
pwd
```

or:

```bash
cat /etc/os-release
```

---

# Exiting the Container

To leave the Shell:

```bash
exit
```

An important detail:

`exit` normally exits the Shell opened by `docker exec`; it does not necessarily stop the Container itself.

After exiting, run:

```bash
docker ps
```

The Container should still be running.

---

# Why Is `docker exec` Important?

In real projects, we will frequently need to execute commands inside Containers.

For example, in a Django project we may need to run:

```bash
python manage.py migrate
```

inside the application Container.

Or we may need to inspect files inside a Node.js Container.

Therefore, `docker exec` will become one of your everyday Docker commands.

---

# Port Mapping

Now we reach one of the most important Docker concepts.

Suppose Nginx is running inside a Container on Port:

```text
80
```

But opening a browser on our host machine does not automatically give us access to that Port.

Why?

Because a Port inside the Container is not automatically the same as a Port on the host.

---

# Mapping a Host Port to a Container Port

Use `-p` to create a Port Mapping:

```bash
docker run -d --name my-nginx -p 8080:80 nginx
```

The syntax is:

```text
-p HOST_PORT:CONTAINER_PORT
```

Therefore:

```text
8080:80
```

means:

```text
Host
8080
  │
  ▼
Container
80
```

---

# Accessing Nginx

Open your browser and go to:

```text
http://localhost:8080
```

If everything is configured correctly, you should see the default Nginx page.

---

# Understanding Port Mapping

Think about the connection like this:

```text
Browser
   │
   │ localhost:8080
   ▼
Host Port 8080
   │
   │ Docker Port Mapping
   ▼
Container Port 80
   │
   ▼
Nginx
```

This concept will be extremely important in our future projects.

For example:

```text
Django
8000

PostgreSQL
5432

Redis
6379

Nginx
80
```

---

# Viewing Port Mappings

Run:

```bash
docker ps
```

You may see something similar to:

```text
0.0.0.0:8080->80/tcp
```

This means Host Port `8080` is mapped to Container Port `80`.

---

# Removing the Previous Container

If the previous Container still exists:

```bash
docker rm -f my-nginx
```

Then create it again:

```bash
docker run -d --name my-nginx -p 8080:80 nginx
```

---

# Checking the Container

Run:

```bash
docker ps
```

and:

```bash
docker logs my-nginx
```

Then open:

```text
http://localhost:8080
```

in your browser.

---

# Container Lifecycle

We have now learned a large part of the Container lifecycle.

Conceptually:

```text
             docker run
                  │
                  ▼
              Created
                  │
                  ▼
               Running
               /     \
              /       \
     docker stop     docker restart
          │              │
          ▼              │
        Stopped ◄────────┘
          │
          │ docker start
          ▼
       Running
          │
          │ docker rm
          ▼
       Removed
```

The actual Docker lifecycle contains more details, but this model is very useful for beginners.

---

# Complete Hands-On Exercise

Now perform the following steps without simply copying the previous examples.

## Step 1

Create an Nginx Container named:

```text
training-nginx
```

---

## Step 2

Run it in Detached Mode.

---

## Step 3

Map Host Port `8081` to Container Port `80`.

---

## Step 4

Open Nginx in your browser.

---

## Step 5

View the Container logs.

---

## Step 6

Enter the Container.

---

## Step 7

Run these commands inside the Container:

```bash
pwd
```

```bash
ls
```

```bash
cat /etc/os-release
```

---

## Step 8

Exit the Container.

---

## Step 9

Stop the Container.

---

## Step 10

Start the Container again.

---

## Step 11

Remove the Container.

---

# Challenge

Now solve this more realistic challenge:

Run an Nginx Container with:

```text
Name:
docker-web

Host Port:
9090

Container Port:
80
```

Then access it through:

```text
http://localhost:9090
```

Finally, run:

```bash
docker ps
```

and identify the Port Mapping in the output.

---

# Conceptual Question

Consider this question:

> If we have two Nginx Containers, can both of them use Port `80` inside their Containers at the same time?

Yes.

For example:

```text
Container A
Port 80

Container B
Port 80
```

There is no problem with this.

However, we cannot publish both Containers on the same Host Port:

```text
Host 8080 → Container A 80
Host 8080 → Container B 80
```

The same Host Port cannot be assigned to two Containers simultaneously.

Instead, we can use:

```text
Host 8080 → Container A 80

Host 8081 → Container B 80
```

---

# Summary

In this lesson, we learned:

* `docker run`
* `docker ps`
* `docker ps -a`
* `docker start`
* `docker stop`
* `docker restart`
* `docker rm`
* `docker logs`
* `docker exec`
* Detached Mode with `-d`
* Custom Container names with `--name`
* Port Mapping with `-p`
* The Container lifecycle

We also learned that:

```text
docker run
```

creates and starts a new Container.

While:

```text
docker start
```

starts an existing Container.

And:

```text
docker stop
```

stops a Container without deleting it.

Finally:

```text
docker rm
```

removes the Container.

---

# Next Lesson

In the next lesson, we will explore one of the most important concepts in Docker:

# Docker Images

We will learn:

* What an Image is
* How Images are structured
* What Docker Hub is
* How to download Images
* `docker pull`
* `docker images`
* Image Tags
* The meaning of `latest`
* How to remove Images
* How to manage multiple Image versions

After that, we will gradually move toward building our own Images.
