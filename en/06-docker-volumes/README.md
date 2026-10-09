[🇮🇷 فارسی](/fa/06-docker-volumes/README.md)

# Lesson 6 — Docker Volumes and Persistent Data

## Introduction

In previous lessons, we learned how to build Docker Images and run Containers.

But an important question remains:

**What happens to the data stored inside a Container when that Container is removed?**

To answer this question, we need to understand Persistent Data.

Imagine an application that stores user information in a file. If that file exists only in the Container's writable layer, removing the Container can cause the information to be lost.

Docker provides storage mechanisms that allow data to exist independently of a Container's lifecycle.

In this lesson, we will explore the most important options.

---

## 🎯 Learning Objectives

By the end of this lesson, you should be able to:

* Explain Persistent Data.
* Understand the difference between Images, Containers, and Volumes.
* Create Docker Volumes.
* Attach Volumes to Containers.
* Preserve data after removing a Container.
* Use Named Volumes.
* Explain the difference between Volumes and Bind Mounts.
* Make Host files available inside a Container.
* Store PostgreSQL data in a Volume.
* Identify and manage unused Volumes.
* Troubleshoot common Docker storage problems.

---

# 1. The Problem with Storing Data Inside a Container

Suppose we create a Container:

```bash
docker run -d --name data-demo nginx
```

Now enter the Container:

```bash
docker exec -it data-demo sh
```

Create a test file inside it:

```sh
echo "Important data" > /tmp/example.txt
```

Exit the Container:

```sh
exit
```

Now remove it:

```bash
docker rm -f data-demo
```

When a Container is removed, its writable layer is removed as well.

As a result, the test file stored only in that layer is no longer available.

**Note:** Removing a Container does not automatically remove every Volume associated with it. The exact behavior depends on the mount type and how the Container is removed.

---

# 2. Why Do We Need Persistent Data?

Many applications need data to survive longer than an individual Container.

Examples include:

* User information
* Store orders
* Uploaded files
* Database records
* Application logs
* Processed files

A Container may have a short lifecycle, while its application data must remain available for much longer.

For this reason, we need to separate data storage from the Container lifecycle.

---

# 3. Main Docker Storage Options

Three important storage concepts are:

| Method         | Purpose                                                                |
| -------------- | ---------------------------------------------------------------------- |
| Writable Layer | Stores changes made in a Container's writable layer                    |
| Volume         | Stores data managed by Docker independently of a Container's lifecycle |
| Bind Mount     | Connects a specific Host path to a path inside a Container             |

Conceptually:

```text
Docker Host
│
├── Container
│   └── Writable Layer
│
├── Docker Volume
│   └── Persistent Data
│
└── Host Directory
    └── Bind Mount
```

Let's examine each option.

---

# 4. What Is a Docker Volume?

A Volume is a mechanism for storing data managed by Docker.

Unlike a Container's writable layer, a Volume can survive independently of the Container.

Conceptually:

```text
             Docker Host
                  │
          ┌───────┴────────┐
          │                │
      Container          Volume
          │                │
          └───────┬────────┘
                  │
          Application Data
```

When a Volume is mounted into a Container, the application can store data in it.

If the Container is removed and the Volume is retained, the data remains available.

---

# 5. Creating Your First Volume

Create a Volume named `app-data`:

```bash
docker volume create app-data
```

If successful, Docker displays the Volume name:

```text
app-data
```

Now list the available Volumes:

```bash
docker volume ls
```

The output may look like this:

```text
DRIVER    VOLUME NAME
local     app-data
```

Here:

* `DRIVER` identifies the storage driver.
* `VOLUME NAME` displays the Volume name.

In this course, we will mostly use the default `local` driver.

---

# 6. Inspecting a Volume

To inspect a Volume:

```bash
docker volume inspect app-data
```

The JSON output includes information such as:

* Volume name
* Driver
* Mountpoint
* Volume configuration

On many Linux installations, local Docker Volumes are stored under a directory such as:

```text
/var/lib/docker/volumes/
```

However, you should not assume this path is identical in every environment.

Use `docker volume inspect` to find the actual Mountpoint.

With Docker Desktop, Docker data may be stored inside a managed virtual environment, so paths can differ from those on a native Linux installation.

---

# 7. Mounting a Volume into a Container

Let's attach our Volume to a Container.

Run:

```bash
docker run -d \
  --name volume-demo \
  --mount source=app-data,target=/usr/share/nginx/html \
  -p 8080:80 \
  nginx
```

In this command:

* `--name volume-demo` sets the Container name.
* `--mount` defines a mount.
* `source=app-data` identifies the Volume.
* `target=/usr/share/nginx/html` specifies the path inside the Container.
* `-p 8080:80` publishes the application port.

The following Container path is now backed by the Volume:

```text
/usr/share/nginx/html
```

Data written by the application to this path is stored in the Volume.

**Important:** Mounting a Volume over a non-empty directory in an Image normally hides the existing directory contents from the Container. In some circumstances, Docker can copy existing contents into a newly created Volume on its first use, unless that behavior is disabled. Understand the target directory before attaching a Volume to it.

---

# 8. Testing Data Persistence

Let's verify that our data survives Container removal.

Start a Container:

```bash
docker run -d \
  --name volume-test \
  --mount source=app-data,target=/data \
  nginx
```

Create a file inside the Volume:

```bash
docker exec volume-test sh -c 'echo "Persistent Docker data" > /data/message.txt'
```

Read the file:

```bash
docker exec volume-test cat /data/message.txt
```

Expected output:

```text
Persistent Docker data
```

Remove the Container:

```bash
docker rm -f volume-test
```

Now create a new Container using the same Volume:

```bash
docker run -d \
  --name volume-test-2 \
  --mount source=app-data,target=/data \
  nginx
```

Read the file again:

```bash
docker exec volume-test-2 cat /data/message.txt
```

The output should still be:

```text
Persistent Docker data
```

**Result:** The data survived Container removal because it was stored in a Volume.

---

# 9. What Is a Named Volume?

In the previous example, we used a Volume with an explicit name:

```text
app-data
```

This is commonly called a Named Volume.

Advantages include:

* A clear, recognizable name.
* Reuse across different Containers.
* Easier management.
* Independence from the Container lifecycle.
* Suitability for persistent database data.

Create a Volume:

```bash
docker volume create postgres-data
```

Use it:

```bash
docker run -d \
  --name postgres-db \
  --mount source=postgres-data,target=/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=local-dev-password \
  postgres:16
```

This example is intended for learning. In real environments, do not place passwords directly in commands that may be stored in shell history or in public files. Also verify that the storage path matches the database Image version and configuration.

We will examine a more complete PostgreSQL example later.

---

# 10. What Is an Anonymous Volume?

Docker can create Volumes without a user-specified name.

For example:

```bash
docker run -d \
  --name anonymous-volume-demo \
  -v /data \
  nginx
```

Docker creates a Volume with an automatically generated name and mounts it at `/data`.

List the Volumes:

```bash
docker volume ls
```

Anonymous Volumes are useful in some scenarios, but they are generally harder to identify and manage than Named Volumes.

For important application data, a Named Volume is usually easier to manage explicitly.

**Note:** Removing a Container does not necessarily remove its Anonymous Volume. To remove Volumes associated with removed Containers, understand the cleanup policy and the commands you are using.

---

# 11. What Is a Bind Mount?

A Bind Mount connects a specific path on the Host to a path inside a Container.

Suppose our local project looks like this:

```text
my-project/
├── app.py
└── data/
```

We want to mount the local `data` directory at `/app/data` inside the Container.

Using `--mount`:

```bash
docker run -d \
  --name bind-demo \
  --mount type=bind,source="$(pwd)/data",target=/app/data \
  python:3.12-slim \
  sleep infinity
```

This command is suitable for Unix-style shells such as Linux and macOS. On Windows, adjust the Source path for the shell and environment you are using.

Create a file inside the Container:

```bash
docker exec bind-demo sh -c 'echo "Hello from Container" > /app/data/message.txt'
```

Now inspect the `data` directory on the Host.

You should find `message.txt` containing:

```text
Hello from Container
```

Remove the Container:

```bash
docker rm -f bind-demo
```

The file remains on the Host unless you explicitly delete it.

---

# 12. Volume vs Bind Mount

These concepts are similar, but they are not identical.

| Feature                   | Volume                                        | Bind Mount                                |
| ------------------------- | --------------------------------------------- | ----------------------------------------- |
| Data location             | Managed by Docker                             | A specific Host path                      |
| Host path selection       | Usually managed by Docker                     | Chosen by the user                        |
| Direct Host file access   | Depends on the environment; often less direct | Directly accessible through the Host path |
| Database storage          | Very common                                   | Possible, but requires additional care    |
| Local development         | Useful                                        | Very common                               |
| Dependency on Host layout | Lower                                         | Higher                                    |

### When should you use a Volume?

Common use cases include:

* PostgreSQL data
* MySQL data
* Persistent application files
* Storage that should be independent of individual Containers

### When should you use a Bind Mount?

Common use cases include:

* Local development
* Mounting source code into a Container
* Inspecting files generated by an application
* Editing files on the Host and seeing the changes inside a Container

The right choice depends on the application and deployment environment.

---

# 13. The Shorter -v Syntax

You can also use `-v` to mount a Volume.

For example:

```bash
docker run -d \
  --name volume-short-demo \
  -v app-data:/data \
  nginx
```

In this command:

```text
app-data:/data
```

means that the Volume named `app-data` is mounted at `/data` inside the Container.

You can also use `-v` for a Bind Mount:

```bash
docker run -d \
  --name bind-short-demo \
  -v "$(pwd)/data:/data" \
  nginx
```

However, `--mount` generally makes the mount configuration more explicit and easier to read, so it is often preferable for teaching and documentation.

---

# 14. Practical Project: Persistent PostgreSQL Data

Let's run PostgreSQL with a Volume.

First, create the Volume:

```bash
docker volume create postgres-data
```

Then start the Container:

```bash
docker run -d \
  --name postgres-demo \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=local-dev-password \
  -e POSTGRES_DB=appdb \
  --mount source=postgres-data,target=/var/lib/postgresql/data \
  postgres:16
```

This example is intended for local learning. In a real project, manage passwords securely and choose an Image version that meets your project's requirements.

Check the Container:

```bash
docker ps
```

View the logs:

```bash
docker logs postgres-demo
```

Wait until PostgreSQL is ready to accept connections.

You can check readiness with:

```bash
docker exec postgres-demo pg_isready -U appuser -d appdb
```

When PostgreSQL is ready, the output normally includes a message indicating that it is accepting connections.

---

# 15. Testing PostgreSQL Persistence

Open a PostgreSQL session:

```bash
docker exec -it postgres-demo psql -U appuser -d appdb
```

Create a table:

```sql
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL
);
```

Insert a record:

```sql
INSERT INTO notes (message)
VALUES ('Data survives container replacement');
```

Read the records:

```sql
SELECT * FROM notes;
```

Exit the PostgreSQL shell:

```sql
\q
```

Now remove the Container:

```bash
docker rm -f postgres-demo
```

Create a new Container using the same Volume:

```bash
docker run -d \
  --name postgres-demo \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=local-dev-password \
  -e POSTGRES_DB=appdb \
  --mount source=postgres-data,target=/var/lib/postgresql/data \
  postgres:16
```

After the database is ready, reconnect:

```bash
docker exec -it postgres-demo psql -U appuser -d appdb
```

Run:

```sql
SELECT * FROM notes;
```

The previous record should still exist.

**Why?** Because the database files were stored in the Volume, rather than only in the Container's writable layer.

> Operational note: A Volume is not a substitute for a backup. Important databases still require backups and tested recovery procedures.

---

# 16. Managing Volumes

### List Volumes

```bash
docker volume ls
```

### Inspect a Volume

```bash
docker volume inspect postgres-data
```

### Remove a Volume

```bash
docker volume rm postgres-data
```

Docker will normally prevent you from removing a Volume that is still in use by a Container.

Before removing a Volume, inspect the related Containers.

### List Containers

```bash
docker ps -a
```

### Remove the Test Container

```bash
docker rm -f postgres-demo
```

Once the Container has been removed and the Volume is no longer in use, you can remove the Volume separately.

**Warning:** Removing a Volume can permanently delete data. Confirm that the data is no longer needed and create a backup when appropriate.

---

# 17. The docker volume prune Command

Docker can clean up unused Volumes.

```bash
docker volume prune
```

In current Docker versions, this command removes unused local Volumes and may prompt for confirmation.

To skip the confirmation prompt:

```bash
docker volume prune -f
```

Use this command carefully. A Volume that is not currently attached to a Container may still contain important data.

**Unused from Docker's perspective does not mean unimportant from your application's perspective.**

---

# 18. Inspecting a Container's Mounts

To inspect a Container's mount configuration:

```bash
docker inspect postgres-demo
```

The output contains a `Mounts` section.

To display only the mount information:

```bash
docker inspect --format '{{json .Mounts}}' postgres-demo
```

You can inspect fields such as Source and Destination.

This is especially useful when troubleshooting storage issues.

---

# 19. Common Problems

## Problem 1: Data Disappears After Container Removal

Possible cause:

The data was stored in the Container's writable layer rather than a Volume or Bind Mount.

Solution:

Use an appropriate mount for important data.

## Problem 2: Files Are Missing Inside the Container

Possible cause:

A Volume or Bind Mount is hiding the existing contents of the target directory.

Solution:

Inspect the Container's mounts:

```bash
docker inspect <container-name>
```

## Problem 3: Permission Denied

Possible causes:

The process inside the Container does not have permission to write to the mounted path.

Solutions:

* Check file ownership and permissions.
* Check which user runs the application.
* Consider mount-related security settings when using SELinux.
* Do not apply overly broad permissions without understanding the security implications.

## Problem 4: A Volume Cannot Be Removed

Possible cause:

One or more Containers are still using it.

Solution:

Inspect the Containers:

```bash
docker ps -a
```

## Problem 5: Assuming Container Removal Also Removes the Volume

This assumption is not always correct.

Volumes have their own lifecycle and must be managed explicitly.

---

# 20. Hands-On Exercise 1

Create a Volume named `lesson6-data`:

```bash
docker volume create lesson6-data
```

List the Volumes:

```bash
docker volume ls
```

Then inspect the Volume:

```bash
docker volume inspect lesson6-data
```

---

# 21. Hands-On Exercise 2

Run a Container with the Volume mounted at `/data`:

```bash
docker run -d \
  --name lesson6-container \
  --mount source=lesson6-data,target=/data \
  nginx
```

Create a file:

```bash
docker exec lesson6-container sh -c 'echo "Lesson 6 completed" > /data/result.txt'
```

Read it:

```bash
docker exec lesson6-container cat /data/result.txt
```

Now remove the Container:

```bash
docker rm -f lesson6-container
```

Start another Container using the same Volume:

```bash
docker run -d \
  --name lesson6-container-2 \
  --mount source=lesson6-data,target=/data \
  nginx
```

Read the file again:

```bash
docker exec lesson6-container-2 cat /data/result.txt
```

You should see the previous contents.

---

# 22. Hands-On Exercise 3

Create a directory named `shared-data` in your project.

Inside it, create:

```text
message.txt
```

Add this content:

```text
Hello from the Host!
```

Now mount the directory into a Container using a Bind Mount.

On Linux or macOS:

```bash
docker run --rm \
  --mount type=bind,source="$(pwd)/shared-data",target=/data \
  alpine:3.21 \
  cat /data/message.txt
```

If Docker can pull the required Image, the output should be:

```text
Hello from the Host!
```

On Windows, you may need to adjust the Source path depending on whether you use PowerShell, CMD, or Git Bash.

---

# 23. Final Challenge

Without looking at the previous steps, complete this scenario:

1. Create a Volume named `challenge-data`.
2. Run an Nginx Container.
3. Mount the Volume at `/data`.
4. Create a file named `challenge.txt` inside the Volume.
5. Read the file's contents.
6. Remove the Container.
7. Create a new Container using the same Volume.
8. Verify that the file still exists.
9. Inspect the mount configuration using `docker inspect`.
10. Clean up the test Containers and Volume deliberately.

Main commands:

```bash
docker volume create
docker volume ls
docker volume inspect
docker run
docker exec
docker inspect
docker rm
docker volume rm
```

### Conceptual Question

If a Container is removed but its Volume remains, should the data inside that Volume disappear?

Expected answer:

**No. The data remains independent of the Container's removal, provided the Volume and its contents have not themselves been deleted or corrupted.**

---

# 24. Summary

In this lesson, we learned:

* Why Container data can be lost.
* What Persistent Data means.
* What Docker Volumes are.
* How to create and inspect Volumes.
* How to mount Volumes into Containers.
* The difference between Named and Anonymous Volumes.
* What Bind Mounts are.
* When to use Volumes versus Bind Mounts.
* How to preserve PostgreSQL data.
* How to inspect Container mounts.
* How to manage unused Volumes.
* Why backups are still essential.

The most important concept is:

```text
Container Lifecycle ≠ Data Lifecycle
```

A Container's lifecycle does not have to match the lifecycle of the application's data.

In the next lesson, we will cover another essential Docker concept:

# Lesson 7 — Docker Networking

We will learn how Containers communicate with each other, explore Docker network types, and connect an application to a database.
