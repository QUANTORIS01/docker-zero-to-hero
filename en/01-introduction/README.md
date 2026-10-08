[🇮🇷 فارسی](/fa/01-introduction/README.md)

# Lesson 01 - What Is Docker?

## Introduction

If you have ever developed or deployed software, you have probably encountered situations like these:

* The application works on your machine but fails on someone else's.
* The application runs perfectly on Windows but crashes on Linux.
* Different library versions cause unexpected issues.
* Installing a new dependency breaks another application.
* Moving a project from development to production becomes complicated and time-consuming.

For many years, developers struggled with these problems. Docker was created to solve a large portion of them.

In this lesson, you will learn what Docker is, why it was created, how it works, and how it differs from traditional Virtual Machines.

---

# What Is Docker?

Docker is an open-source platform that allows developers to build, package, distribute, and run applications inside environments called **Containers**.

In simple terms:

Docker enables you to package your application together with all of its dependencies so it can run consistently across different environments.

Imagine you have a Django project that requires:

* Python 3.12
* Django 5
* PostgreSQL
* Redis
* Several third-party libraries

Instead of manually installing and configuring all of these components on every machine, Docker bundles everything into a standardized containerized environment.

As a result:

> If the application works on your machine, it will work on other machines as well.

---

# The Traditional Problem

Before Docker, software deployment typically involved the following steps:

1. Install the operating system
2. Install the programming language
3. Install the database
4. Install required libraries
5. Configure environment variables
6. Configure services

This process often introduced compatibility issues.

For example:

Developer A:

```text
Python 3.10
PostgreSQL 14
```

Developer B:

```text
Python 3.12
PostgreSQL 16
```

The application might work correctly on one machine and fail on another.

This issue became so common that it inspired the famous phrase:

> It works on my machine.

Docker was designed specifically to eliminate this problem.

---

# What Is a Container?

To understand Docker, you first need to understand the concept of a Container.

A Container is an isolated environment used to run an application.

It contains:

* Application code
* Libraries
* Dependencies
* Configuration files
* Runtime environment

Each Container operates independently from other Containers.

For example:

```text
Container A
└── Python 3.10

Container B
└── Python 3.12
```

Both Containers can run simultaneously on the same machine without interfering with one another.

---

# How Does Docker Work?

Docker is built around several core concepts.

## Docker Engine

Docker Engine is the core component of Docker.

It is responsible for:

* Building containers
* Running containers
* Managing resources

---

## Docker Client

The Docker Client is the interface developers use to communicate with Docker.

Examples:

```bash
docker ps
```

```bash
docker run nginx
```

These commands are sent from the Docker Client to the Docker Engine.

---

## Docker Image

An Image is a blueprint used to create Containers.

Think of it as a template containing everything required to run an application.

Examples:

```bash
nginx
ubuntu
postgres
redis
python
```

These are all Docker Images.

---

## Docker Container

A Container is a running instance of an Image.

Example:

```bash
docker run nginx
```

Here:

```text
nginx
```

is the Image, and Docker creates a running Container from it.

---

# Image vs Container

One of the most common beginner mistakes is confusing Images with Containers.

Think about cooking:

Image:

```text
Recipe
```

Container:

```text
Prepared Meal
```

The recipe describes how to prepare the meal.

The meal is the actual result.

Similarly:

* An Image is a template.
* A Container is a running instance created from that template.

A single Image can be used to create multiple Containers.

---

# What Is a Virtual Machine?

Before Docker became popular, Virtual Machines (VMs) were the standard way to isolate environments.

A Virtual Machine emulates an entire operating system.

Example:

```text
Host OS
│
├── VM 1 (Ubuntu)
├── VM 2 (Windows)
└── VM 3 (CentOS)
```

Each VM contains its own:

* Kernel
* Drivers
* Libraries
* Operating System

This provides strong isolation but comes with significant overhead.

---

# Docker vs Virtual Machines

## Virtual Machines

Advantages:

* Strong isolation
* Ability to run different operating systems

Disadvantages:

* High RAM usage
* High CPU usage
* Large storage requirements
* Slow startup times

---

## Docker

Advantages:

* Lightweight
* Fast startup
* Lower resource consumption
* Easy portability

Disadvantages:

* Less isolation compared to VMs
* Shares the host operating system kernel

---

# Architectural Comparison

Virtual Machine Architecture:

```text
Application
Application
Application
│
Guest OS
│
Hypervisor
│
Host OS
│
Hardware
```

Docker Architecture:

```text
Application
Application
Application
│
Docker Engine
│
Host OS
│
Hardware
```

Notice that Docker eliminates the Guest Operating System layer, making it significantly more lightweight and efficient.

---

# Why Did Docker Become So Popular?

Docker gained massive adoption because it solves several important challenges.

## Portability

Build once:

```text
Build Once
```

Run anywhere:

```text
Run Anywhere
```

---

## Speed

Containers typically start within seconds.

Virtual Machines often require much longer startup times.

---

## Dependency Management

All dependencies are packaged inside the Container.

This helps avoid:

```text
Dependency Hell
```

where conflicting libraries and versions cause application failures.

---

## Team Collaboration

Every team member works in the same environment.

Benefits include:

* Fewer environment-related bugs
* Easier onboarding
* More predictable deployments

---

# Docker in the Real World

Today, Docker is used by organizations of all sizes.

Common use cases include:

### Backend Development

* Django
* Flask
* FastAPI
* Spring Boot
* ASP.NET

---

### Frontend Development

* React
* Vue
* Angular
* Next.js

---

### Databases

* PostgreSQL
* MySQL
* MongoDB
* Redis

---

### DevOps

* CI/CD Pipelines
* GitHub Actions
* GitLab CI
* Jenkins

---

### Cloud Platforms

* AWS
* Microsoft Azure
* Google Cloud Platform

---

# What Will You Learn in This Course?

By the end of this course, you will be able to:

* Use Docker professionally
* Write efficient Dockerfiles
* Build multi-container applications with Docker Compose
* Dockerize Django applications
* Dockerize Node.js applications
* Manage PostgreSQL and MongoDB containers
* Configure Nginx
* Deploy real-world applications
* Configure SSL and domains
* Build CI/CD pipelines

---

# Exercises

1. Research Docker and learn about its primary use cases.
2. Write down three advantages of Docker.
3. Explain the difference between a Container and a Virtual Machine in your own words.
4. Think about why modern software companies use Docker extensively.

---

# Summary

In this lesson, you learned:

* What Docker is
* Why Docker was created
* What Containers are
* What Images are
* How Docker works
* The difference between Docker and Virtual Machines
* The main advantages and use cases of Docker

In the next lesson, we will install Docker on Windows, Linux, and macOS and take our first practical step into the world of containers.
