[🇮🇷 فارسی](/fa/05-dockerfile/README.md)

# Lesson 5 — Dockerfile

In the previous lessons, we learned about Docker Images and Containers.

So far, we have mostly used ready-made Images such as `nginx`.

However, in real-world projects, we usually need an Image specifically designed for our own application.

For example, imagine that we have a Python project:

```text
my-project/
├── app.py
├── requirements.txt
└── Dockerfile
```

We want Docker to know:

1. Which Image to start from.
2. Where to put our project files.
3. How to install dependencies.
4. How to run the application.

This is where the **Dockerfile** comes in.

---

# 🎯 Learning Objectives

By the end of this lesson, you should be able to:

* Explain what a Dockerfile is.
* Write a basic Dockerfile.
* Build a custom Docker Image.
* Run a Container from your custom Image.
* Understand the Build Context.
* Understand the most important Dockerfile instructions.
* Explain the difference between `RUN`, `CMD`, and `ENTRYPOINT`.
* Use `.dockerignore`.
* Understand Docker Build Cache.
* Identify and fix common Dockerfile problems.

---

# 1. What Is a Dockerfile?

A Dockerfile is a text file containing instructions that Docker uses to build a Docker Image.

In simple terms:

```text
Dockerfile
     │
     │ docker build
     ▼
 Docker Image
     │
     │ docker run
     ▼
 Docker Container
```

A Dockerfile is not a Container.

It is not an Image either.

A Dockerfile is an **instruction set used to build an Image**.

---

# 2. Your First Dockerfile

Let's create the simplest Dockerfile possible.

Create a directory:

```bash
mkdir docker-demo
cd docker-demo
```

Then create a file named exactly:

```text
Dockerfile
```

Put the following content inside it:

```dockerfile
FROM nginx:latest
```

That's it!

This Dockerfile tells Docker:

> Build my Image based on the Nginx Image.

---

# 3. Why FROM?

Most Dockerfiles start with a `FROM` instruction.

For example:

```dockerfile
FROM nginx:latest
```

Or:

```dockerfile
FROM python:3.12
```

Or:

```dockerfile
FROM node:22
```

Or:

```dockerfile
FROM ubuntu:24.04
```

`FROM` specifies the Base Image from which our Image will be built.

---

# 4. Building an Image

Now that we have a Dockerfile, we can build an Image.

Run this command from the same directory:

```bash
docker build -t my-nginx .
```

Let's break it down.

```text
docker build
```

Tells Docker to build an Image.

```text
-t my-nginx
```

Assigns a name and Tag to the Image.

```text
.
```

Specifies the current directory as the Build Context.

---

# 5. What Is the Build Context?

One of the important concepts in Docker is the `.` at the end of the build command.

When we run:

```bash
docker build -t my-nginx .
```

the dot means:

> Use the current directory as the Build Context.

For example, if our project looks like this:

```text
docker-demo/
├── Dockerfile
├── index.html
└── app.js
```

and we run:

```bash
docker build -t my-image .
```

Docker uses this directory as the Build Context.

This is why files such as `index.html` can later be copied into the Image using `COPY`.

---

# 6. A Simple Project Structure

For our first exercise:

```text
docker-demo/
└── Dockerfile
```

Dockerfile:

```dockerfile
FROM nginx:latest
```

Now run:

```bash
docker build -t my-nginx .
```

After the build finishes:

```bash
docker image ls
```

You should see the new Image:

```text
REPOSITORY   TAG       IMAGE ID
my-nginx     latest    ...
```

---

# 7. Running Our Custom Image

Now create a Container from the Image we just built:

```bash
docker run -d --name my-nginx-container -p 8080:80 my-nginx
```

Then:

```bash
docker ps
```

Open the following address in your browser:

```text
http://localhost:8080
```

You should see the default Nginx page.

---

# 8. The Relationship Between Dockerfile, Image, and Container

At this point, you should understand this workflow:

```text
Dockerfile
    │
    │ docker build
    ▼
my-nginx Image
    │
    │ docker run
    ▼
my-nginx-container
```

This is one of the most important concepts in the entire Docker course.

---

# 9. The COPY Instruction

Now let's put our own file into the Image.

Project structure:

```text
docker-demo/
├── Dockerfile
└── index.html
```

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Docker App</title>
</head>
<body>
    <h1>Hello from Docker!</h1>
</body>
</html>
```

Update the Dockerfile:

```dockerfile
FROM nginx:latest

COPY index.html /usr/share/nginx/html/index.html
```

The `COPY` instruction copies files from the Build Context into the Image.

---

# 10. Rebuilding the Image

First, remove the previous Container:

```bash
docker rm -f my-nginx-container
```

Then rebuild the Image:

```bash
docker build -t my-nginx .
```

Run the Container:

```bash
docker run -d \
  --name my-nginx-container \
  -p 8080:80 \
  my-nginx
```

Now open:

```text
http://localhost:8080
```

You should see the page we created ourselves.

---

# 11. The WORKDIR Instruction

`WORKDIR` defines the working directory inside the Image.

For example:

```dockerfile
FROM python:3.12

WORKDIR /app
```

From this point onward, subsequent instructions use `/app` as the working directory.

For example:

```dockerfile
FROM python:3.12

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt
```

Defining a working directory makes Dockerfiles easier to understand and maintain.

---

# 12. The RUN Instruction

`RUN` executes a command while the Image is being built.

For example:

```dockerfile
RUN apt-get update
```

Or:

```dockerfile
RUN pip install -r requirements.txt
```

Or:

```dockerfile
RUN npm install
```

An important point:

`RUN` executes during the **Image build process**, not when the Container starts.

For example:

```dockerfile
FROM python:3.12

WORKDIR /app

RUN pip install requests
```

The `pip install requests` command is executed during `docker build`.

---

# 13. RUN vs CMD

Do not confuse these two instructions.

### RUN

Used to execute commands during the build:

```dockerfile
RUN pip install -r requirements.txt
```

### CMD

Used to define the default command when the Container starts:

```dockerfile
CMD ["python", "app.py"]
```

Conceptually:

```text
docker build
     │
     └── RUN

docker run
     │
     └── CMD
```

---

# 14. The CMD Instruction

`CMD` defines the default command for the Container.

For example:

```dockerfile
FROM python:3.12

WORKDIR /app

COPY app.py .

CMD ["python", "app.py"]
```

When we run:

```bash
docker run my-python-app
```

Docker will execute:

```bash
python app.py
```

by default.

---

# 15. Why Use the JSON Form of CMD?

It is recommended to use the Exec Form of `CMD`:

```dockerfile
CMD ["python", "app.py"]
```

instead of:

```dockerfile
CMD python app.py
```

The JSON/Exec Form provides better process handling and is generally preferable for Dockerized applications.

---

# 16. The ENTRYPOINT Instruction

`ENTRYPOINT` defines the main executable of the Container.

For example:

```dockerfile
FROM python:3.12

WORKDIR /app

COPY app.py .

ENTRYPOINT ["python", "app.py"]
```

Here, `python app.py` becomes the main entry point of the Container.

---

# 17. CMD vs ENTRYPOINT

A useful mental model is:

```text
ENTRYPOINT = main executable

CMD = default arguments
```

For example:

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
```

Normally:

```bash
docker run my-app
```

will effectively execute:

```bash
python app.py
```

If we run:

```bash
docker run my-app other.py
```

the provided argument replaces the default `CMD`.

This pattern becomes useful in real-world Docker applications.

---

# 18. The EXPOSE Instruction

For example:

```dockerfile
EXPOSE 80
```

This declares that the application inside the Container uses Port `80`.

However, an important point:

**`EXPOSE` does not publish the Port on the Host.**

To make the application accessible from the Host, we still need Port Mapping:

```bash
docker run -p 8080:80 my-nginx
```

Which means:

```text
Host 8080 → Container 80
```

---

# 19. The ENV Instruction

We can define Environment Variables using `ENV`.

For example:

```dockerfile
ENV APP_ENV=production
```

Or:

```dockerfile
ENV PORT=8000
```

The application can then read these values from the environment.

For example, in Python:

```python
import os

port = os.getenv("PORT", "8000")
print(port)
```

Environment Variables are extremely important in real-world applications.

---

# 20. A Complete Python Project

Now let's build a small real-world example.

Project structure:

```text
python-docker-demo/
├── Dockerfile
├── requirements.txt
└── app.py
```

`requirements.txt`:

```text
flask==3.1.2
```

`app.py`:

```python
from flask import Flask

app = Flask(__name__)


@app.get("/")
def home():
    return "Hello from Docker!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
```

Dockerfile:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

---

# 21. Building the Python Image

Run this command inside the project directory:

```bash
docker build -t python-docker-demo .
```

Then:

```bash
docker image ls
```

You should see the new Image.

---

# 22. Running the Python Application

Now run:

```bash
docker run -d \
  --name python-demo-container \
  -p 8000:8000 \
  python-docker-demo
```

Check the Container:

```bash
docker ps
```

Then open:

```text
http://localhost:8000
```

You should see:

```text
Hello from Docker!
```

---

# 23. Checking Container Logs

If the application does not start correctly:

```bash
docker logs python-demo-container
```

Or follow the logs in real time:

```bash
docker logs -f python-demo-container
```

This command is extremely important when debugging Containers.

---

# 24. Docker Build Cache

Docker can reuse previously built layers through the Build Cache.

Consider this Dockerfile:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

CMD ["python", "app.py"]
```

Suppose we only modify `app.py`.

During the next build, Docker can reuse the previous layers related to:

```dockerfile
COPY requirements.txt .
```

and:

```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```

Therefore, Docker does not need to reinstall all dependencies every time.

---

# 25. Why Does Instruction Order Matter?

Consider this Dockerfile:

```dockerfile
COPY . .

RUN pip install --no-cache-dir -r requirements.txt
```

A small source-code change can invalidate the cache for the dependency installation step.

A better structure is:

```dockerfile
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
```

Why?

Because dependency files usually change less frequently than application source code.

This allows Docker to reuse the dependency-installation layer more effectively.

---

# 26. .dockerignore

Not every project file needs to be sent as part of the Build Context.

For example, we usually do not want files such as:

```text
node_modules/
.git/
.env
__pycache__/
*.pyc
.venv/
```

to be included.

For this purpose, create:

```text
.dockerignore
```

For a Python project:

```text
__pycache__/
*.pyc
.venv/
.env
.git/
.gitignore
```

This can reduce the Build Context and prevent unnecessary files from being sent to the build process.

---

# 27. A Better Dockerfile

A better version of our Python project:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

`.dockerignore`:

```text
__pycache__/
*.pyc
.venv/
.env
.git/
.gitignore
```

Final structure:

```text
python-docker-demo/
├── Dockerfile
├── .dockerignore
├── requirements.txt
└── app.py
```

---

# 28. Common Mistake: Dockerfile.txt

On Windows, it is possible to accidentally create:

```text
Dockerfile.txt
```

instead of:

```text
Dockerfile
```

The correct filename is:

```text
Dockerfile
```

Docker looks for a file with this name by default.

---

# 29. Choosing a Base Image

For example:

```dockerfile
FROM python:3.12
```

versus:

```dockerfile
FROM python:3.12-slim
```

The `slim` variant is generally smaller.

However, smaller does not automatically mean better.

Some applications require additional tools, system packages, or libraries that may not be included in smaller Base Images.

Therefore, choose a Base Image according to your application's actual requirements.

---

# 30. An Important Security Note

Avoid putting Secrets directly inside a Dockerfile.

For example, this is not appropriate:

```dockerfile
ENV DATABASE_PASSWORD=my-secret-password
```

Sensitive information such as:

* Passwords
* API Keys
* Tokens
* Secrets

should be handled using appropriate secret-management and environment mechanisms.

We will cover this topic in more detail in the advanced sections of the course.

---

# 31. Debugging a Dockerfile

If the build fails:

```bash
docker build -t my-image .
```

start by identifying the last successful build step.

You can also inspect available Images:

```bash
docker image ls
```

And inspect Image history:

```bash
docker image history my-image
```

If the Container was created but does not run correctly:

```bash
docker ps -a
```

Then inspect its logs:

```bash
docker logs <container-name>
```

---

# 32. Challenge

Build a Python project that responds to:

```text
GET /
```

The project should contain:

```text
my-python-app/
├── Dockerfile
├── .dockerignore
├── requirements.txt
└── app.py
```

Requirements:

1. Use `python:3.12-slim`.
2. Set `WORKDIR` to `/app`.
3. Install the dependencies.
4. Copy the application.
5. `EXPOSE` Port `8000`.
6. Start the application using `CMD`.
7. Build the Image with the name `my-python-app`.
8. Run a Container named `my-python-container`.
9. Publish Port `8000` on the Host.
10. Test the application using a browser or `curl`.

---

# 33. Summary

In this lesson, we learned:

* What a Dockerfile is.
* What `FROM` does.
* What the Build Context is.
* How `docker build` works.
* What `COPY` does.
* What `WORKDIR` does.
* When `RUN` is executed.
* When `CMD` is executed.
* What `ENTRYPOINT` is.
* The difference between `CMD` and `ENTRYPOINT`.
* What `EXPOSE` does.
* What `ENV` does.
* How Docker Build Cache works.
* What `.dockerignore` is.
* How to Dockerize a Python application.

The most important workflow to remember is:

```text
             Dockerfile
                  │
                  │ docker build
                  ▼
              Docker Image
                  │
                  │ docker run
                  ▼
             Docker Container
                  │
                  ▼
             Running App
```

In the next lesson, we will move to another extremely important Docker concept:

# Lesson 6 — Docker Volumes & Persistent Data

We will learn why data stored only inside a Container should not be treated as permanent data, and how to use **Volumes** to persist application data.
