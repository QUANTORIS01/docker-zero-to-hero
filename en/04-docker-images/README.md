[🇮🇷 فارسی](/fa/04-docker-images/README.md)

# Lesson 4 — Docker Images

In the previous lesson, we learned about Containers and their lifecycle.

In this lesson, we will learn one of the most important concepts in Docker: **Images**.

The basic relationship between the concepts can be simplified as:

**Image → Container**

A Container is usually created and started from an Image.

---

## 🎯 Learning Objectives

By the end of this lesson, you should be able to:

* Explain what a Docker Image is.
* Understand the difference between an Image and a Container.
* Pull Images from a Docker Registry.
* List Images available locally.
* Understand Image Tags.
* Understand the `latest` Tag.
* Inspect Image information.
* View Image layers.
* Remove unused Images.
* Manage multiple versions of an Image.
* Explain the relationship between Images, Containers, and Registries.

---

# 1. What Is a Docker Image?

A Docker Image can be thought of as a **template used to create Containers**.

An Image contains the components required to run an application, such as:

* filesystem contents
* libraries
* dependencies
* application files
* configuration
* metadata

An Image itself is not normally a running application.

To run an Image, we create a Container from it.

Conceptually:

```text
Docker Image
     │
     │ docker run
     ▼
Docker Container
```

For example, we can pull the Nginx Image and create a Container from it.

---

# 2. Image vs Container

One of the most important distinctions in Docker is the difference between an Image and a Container.

| Image                                | Container                      |
| ------------------------------------ | ------------------------------ |
| A template                           | A runtime instance             |
| Normally treated as immutable        | Has runtime state              |
| Used to create Containers            | Runs the application           |
| Can be shared by multiple Containers | Has its own identity and state |

For example:

```text
nginx Image
   │
   ├── Container 1
   ├── Container 2
   └── Container 3
```

Multiple Containers can be created from the same Image.

---

# 3. Where Do Images Come From?

Images are commonly stored and distributed through a **Container Registry**.

One of the most popular registries is:

**Docker Hub**

When we run:

```bash
docker pull nginx
```

Docker attempts to retrieve the `nginx` Image from the default Registry.

---

# 4. Pulling an Image

Let's download the Nginx Image:

```bash
docker pull nginx
```

You may see output similar to:

```text
Using default tag: latest
latest: Pulling from library/nginx
...
Status: Downloaded newer image for nginx:latest
```

A Docker Image can consist of multiple layers.

Therefore, pulling an Image may download several different layers.

---

# 5. Listing Local Images

To list Images available locally:

```bash
docker image ls
```

The older command below is also available:

```bash
docker images
```

Example:

```text
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
nginx        latest    abc123456789   2 weeks ago   190MB
```

Important columns include:

### REPOSITORY

The Image name.

For example:

```text
nginx
```

### TAG

The Image version or label.

For example:

```text
latest
```

### IMAGE ID

The Image identifier.

### CREATED

When the Image was created.

### SIZE

The Image size.

---

# 6. What Is an Image Tag?

An Image can have different Tags.

For example:

```text
nginx:latest
nginx:1.27
nginx:1.27.5
```

The general format is:

```text
repository:tag
```

For example:

```text
nginx:1.27
```

Here:

```text
repository = nginx
tag        = 1.27
```

---

# 7. Understanding latest

If we run:

```bash
docker pull nginx
```

Docker uses the `latest` Tag by default:

```text
nginx:latest
```

However, there is an important point:

**`latest` does not necessarily mean the newest software version.**

`latest` is simply a Tag that can point to a particular Image version.

For production projects, it is often better to explicitly specify the version you want.

For example:

```bash
docker pull nginx:1.27
```

instead of:

```bash
docker pull nginx
```

---

# 8. Running an Image

Now that we have the Nginx Image, we can create a Container from it:

```bash
docker run -d --name my-nginx nginx
```

Conceptually:

```text
nginx Image
     │
     │ docker run
     ▼
my-nginx Container
```

If the Image does not exist locally, Docker will normally attempt to pull it first.

---

# 9. Multiple Containers From One Image

Suppose we have:

```text
nginx:latest
```

We can create several Containers from it:

```bash
docker run -d --name nginx-1 nginx
```

```bash
docker run -d --name nginx-2 nginx
```

```bash
docker run -d --name nginx-3 nginx
```

The result is conceptually:

```text
              nginx:latest
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
     nginx-1    nginx-2    nginx-3
```

Each Container is independent.

If all three Containers need to expose Nginx through the Host, however, they need different Host ports.

---

# 10. What Are Image Layers?

Docker Images are generally composed of multiple layers.

Conceptually:

```text
┌──────────────────────────────┐
│ Application                  │
├──────────────────────────────┤
│ Application Dependencies     │
├──────────────────────────────┤
│ Runtime / Libraries          │
├──────────────────────────────┤
│ Base Image                   │
└──────────────────────────────┘
```

Layers are one of the important mechanisms behind Docker's efficiency.

Layers can be shared between different Images.

This means Docker does not always need to download data that already exists locally.

---

# 11. Viewing Image Layers

To view the history of an Image:

```bash
docker image history nginx
```

You can also use:

```bash
docker history nginx
```

The output provides information about the Image's layers.

For example:

```text
IMAGE        CREATED       CREATED BY
abc123       2 weeks ago   ...
def456       2 weeks ago   ...
```

This command is particularly useful when debugging Images.

---

# 12. Inspecting an Image

To inspect detailed information about an Image:

```bash
docker image inspect nginx
```

The output usually contains JSON information such as:

* Architecture
* Operating system
* Configuration
* Entrypoint
* Cmd
* Environment variables
* Root filesystem information
* Image metadata

For example:

```bash
docker image inspect nginx
```

The output can be quite large.

We can use `--format` when we only need a specific value.

For example:

```bash
docker image inspect nginx --format '{{.Os}}'
```

Or:

```bash
docker image inspect nginx --format '{{.Architecture}}'
```

---

# 13. Removing an Image

If we no longer need an Image, we can remove it:

```bash
docker image rm nginx
```

Or:

```bash
docker rmi nginx
```

Both commands can be used to remove Images.

However, if a Container still depends on an Image, Docker may not allow the Image to be removed immediately.

In that situation, first inspect your Containers:

```bash
docker ps -a
```

Then remove the relevant Container if necessary.

---

# 14. Removing an Image by Tag

Suppose we have:

```text
nginx:1.27
```

We can explicitly remove that version:

```bash
docker image rm nginx:1.27
```

This is useful when multiple versions of the same Repository exist locally.

---

# 15. Image ID

Suppose `docker image ls` returns:

```text
REPOSITORY   TAG       IMAGE ID
nginx        latest    abc123456789
```

We can also remove the Image by its ID:

```bash
docker image rm abc123456789
```

However, using the Repository and Tag is often easier to read:

```bash
docker image rm nginx:latest
```

---

# 16. What Is a Registry?

A Registry is a location used to store and distribute container Images.

A simple architecture looks like this:

```text
             Docker Registry
                    │
             docker pull
                    │
                    ▼
             Local Machine
                    │
                    │ docker run
                    ▼
                Container
```

A Registry can be public or private.

Docker Hub is one of the best-known public Registries.

In enterprise environments, organizations often use private Registries.

---

# 17. Full Image Names

When we write:

```bash
docker pull nginx
```

we are using a short Image name.

The official Nginx Image on Docker Hub is stored in the:

```text
library/nginx
```

Repository.

Therefore, a more explicit form can be represented as:

```text
docker.io/library/nginx
```

We can also include the Tag:

```text
docker.io/library/nginx:latest
```

This naming structure becomes especially important when working with private Registries.

---

# 18. Pull vs Run

Do not confuse these commands:

```bash
docker pull nginx
```

and:

```bash
docker run nginx
```

### docker pull

Downloads an Image.

```text
Registry
   │
   │ pull
   ▼
Local Image
```

### docker run

Creates and starts a Container from an Image:

```text
Image
  │
  │ run
  ▼
Container
```

An important point:

If the requested Image is not available locally, `docker run` will normally attempt to pull it first.

---

# 19. The Docker Workflow

At this point, we can visualize the basic Docker workflow:

```text
                Registry
                   │
                   │ docker pull
                   ▼
                 Image
                   │
                   │ docker run
                   ▼
               Container
                   │
                   ▼
                Running
```

In real projects, there is another extremely important step:

```text
Dockerfile
     │
     │ docker build
     ▼
   Image
     │
     │ docker run
     ▼
 Container
```

This is one of the most important Docker workflows, and we will cover it in detail in the next lesson.

---

# 20. Hands-On Exercise 1

First, pull the Nginx Image:

```bash
docker pull nginx:latest
```

Then list your local Images:

```bash
docker image ls
```

You should see the Nginx Image.

---

# 21. Hands-On Exercise 2

Inspect the Image:

```bash
docker image inspect nginx:latest
```

Then:

```bash
docker image history nginx:latest
```

Try to understand the difference between the information provided by these two commands.

### Question

Which command is more appropriate for viewing Image layers?

```text
docker image inspect
```

or:

```text
docker image history
```

---

# 22. Hands-On Exercise 3

Create a Container from the Nginx Image:

```bash
docker run -d --name image-test nginx:latest
```

Then run:

```bash
docker ps
```

and:

```bash
docker image ls
```

Notice that an:

```text
Image
```

and a:

```text
Container
```

are different entities.

---

# 23. Hands-On Exercise 4 — Multiple Containers From One Image

Create three Containers from the same Image:

```bash
docker run -d --name web-1 nginx:latest
```

```bash
docker run -d --name web-2 nginx:latest
```

```bash
docker run -d --name web-3 nginx:latest
```

Then:

```bash
docker ps
```

You should see three different Containers.

For cleanup:

```bash
docker rm -f web-1 web-2 web-3
```

---

# 24. Challenge

Without looking at the previous sections, complete this scenario:

1. Pull Nginx with Tag `1.27`.
2. List your local Images.
3. Inspect the Image.
4. View the Image layer history.
5. Create a Container from it.
6. Stop the Container.
7. Remove the Container.
8. Finally, remove the Image.

The main commands you will probably need are:

```bash
docker pull
docker image ls
docker image inspect
docker image history
docker run
docker stop
docker rm
docker image rm
```

The goal is not simply to copy commands.

The goal is to understand the **relationship between an Image and a Container**.

---

# 25. An Important Question

Suppose we have:

```text
nginx:latest
```

and three Containers created from it:

```text
web-1
web-2
web-3
```

If we remove `web-1`:

```bash
docker rm web-1
```

Will the Nginx Image also be deleted?

**No.**

Images and Containers are separate entities.

The Image remains until we explicitly remove it.

---

# 26. Changes Inside a Container

A common beginner mistake is assuming:

> Every change made inside a Container becomes part of the original Image.

That is not how it works.

A Container has a writable runtime layer.

Conceptually:

```text
        Docker Image
      ┌───────────────┐
      │   Image       │
      │   Layers      │
      └───────────────┘
              │
              ▼
      ┌───────────────┐
      │ Container     │
      │ Writable      │
      │ Layer         │
      └───────────────┘
```

This becomes particularly important when we learn about:

* Volumes
* Dockerfiles
* Container persistence
* Images

---

# 27. Summary

In this lesson, we learned:

* What a Docker Image is.
* What a Container is.
* The difference between Images and Containers.
* What a Registry is.
* How to pull Images.
* How to list local Images.
* What Image Tags are.
* What `latest` means.
* How to inspect Images.
* How to view Image layers.
* How to remove Images.
* How to create multiple Containers from one Image.
* The relationship between Registries, Images, and Containers.

The most important concept is:

```text
Registry
    │
    │ docker pull
    ▼
  Image
    │
    │ docker run
    ▼
Container
```

And for creating custom Images:

```text
Dockerfile
    │
    │ docker build
    ▼
  Image
    │
    │ docker run
    ▼
Container
```

In the next lesson, we will move into one of the most important parts of Docker:

# Lesson 5 — Dockerfile

We will learn how to **build our own custom Docker Image** and eventually containerize a real application.
