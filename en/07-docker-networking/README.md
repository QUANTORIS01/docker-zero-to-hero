[🇮🇷 فارسی](/fa/07-docker-networking//README.md)

# Lesson 7: Docker Networking

## 🎯 Learning Objectives

By the end of this lesson, you will be able to:

- Explain how Docker networking works.
- Identify the main Docker network drivers.
- Understand the difference between the default bridge and a user-defined bridge.
- Connect containers without publishing a port to the host.
- Use container names for network communication.
- Publish container ports with `-p`.
- Test a client connection to PostgreSQL over a private Docker network.
- Inspect, manage, and clean up Docker networks.

---

## 1. What Is Docker Networking?

Docker containers run in isolated environments. When a project uses multiple containers, those containers may need to communicate with each other.

For example, a web application may include:

- **Frontend:** The user interface
- **Backend:** Application logic and APIs
- **Database:** Data storage
- **Reverse proxy:** Receives requests and routes them to the appropriate service

These components can run in separate containers.

Docker networking allows containers to communicate and gives you control over which containers can reach each other.

### An important example

Suppose you have two containers:

- `web`: A web server
- `db`: A database

If both containers are connected to the same user-defined Docker network, the `web` container can reach the database using the name `db`.

You generally do not need to publish the database port on the host for this internal communication.

---

## 2. Docker Network Types

List the available networks:

```bash
docker network ls
```

The output typically includes networks such as:

```text
NETWORK ID     NAME      DRIVER    SCOPE
...            bridge    bridge    local
...            host      host      local
...            none      null      local
```

### 2.1. Bridge Network

The `bridge` driver is used for container networking on a single Docker host.

It is a common choice for applications whose containers run on the same machine.

There are two important cases:

- **Default bridge:** The network Docker typically uses when no other network is specified.
- **User-defined bridge:** A network that you create yourself, providing more control over network membership and communication.

User-defined bridge networks support Docker's embedded DNS, allowing containers to discover other attached containers by name or network alias.

Do not assume that automatic name-based DNS works in the same way on the default bridge network.

**Recommendation:** For communication between services in a local multi-container project, a user-defined bridge network is usually the better choice.

### 2.2. Host Network

With `host` networking, a container uses the host's network namespace and does not have the usual network isolation provided by bridge networking.

Example:

```bash
docker run --rm --network host nginx:alpine
```

Port behavior differs from bridge networking with `-p`; host networking generally does not require port publishing in the same way.

**Note:** Support and behavior depend on the operating system and Docker environment. Docker Desktop behavior may differ from Docker Engine running directly on Linux, depending on the version and configuration.

### 2.3. None Network

The `none` network disables ordinary networking for the container, leaving only local interfaces such as loopback.

```bash
docker run --rm --network none alpine:3.20 ip addr
```

This can be useful for isolated tasks, but it is not a complete replacement for other security controls.

### 2.4. Overlay Network

The `overlay` driver supports communication between containers running on multiple Docker hosts, commonly in environments such as Docker Swarm.

In this lesson, we focus on bridge networking because it is a practical starting point for local development.

---

## 3. Default Bridge vs. User-Defined Bridge

This is one of the most important distinctions in Docker networking.

| Feature | Default Bridge | User-Defined Bridge |
|---|---|---|
| Created automatically | Yes | Usually created manually |
| Container networking | Yes | Yes |
| Automatic DNS discovery by container name | Not in the same way as a user-defined bridge | Yes |
| Control over network membership | More limited | More flexible |
| Recommended for local multi-container projects | Usually not | Usually yes |

Create a custom network:

```bash
docker network create app-network
```

List the networks:

```bash
docker network ls
```

Inspect the new network:

```bash
docker network inspect app-network
```

If no containers have joined the network, the connected-container section will be empty.

---

## 4. Run Two Containers on the Same Network

Let's try a practical example.

### Step 1: Create a network

```bash
docker network create lesson7-net
```

### Step 2: Start a web server

```bash
docker run -d \
  --name web \
  --network lesson7-net \
  nginx:alpine
```

This starts an Nginx container and attaches it to `lesson7-net`.

Notice that we have deliberately not used `-p`.

### Step 3: Test communication from another container

```bash
docker run --rm \
  --network lesson7-net \
  busybox:1.36 \
  wget -qO- http://web
```

If everything works, you should see the HTML for the default Nginx page.

What happened?

1. The `web` container started on `lesson7-net`.
2. A temporary BusyBox container joined the same network.
3. BusyBox sent an HTTP request to `http://web`.
4. Docker's embedded DNS resolved `web` to the appropriate network address.
5. The request reached port 80 inside the Nginx container.
6. The HTML response was printed in the terminal.

The temporary BusyBox container is automatically removed when the command finishes because we used `--rm`.

### Key takeaway

Containers on an appropriate Docker network can communicate without publishing the destination port on the host.

In this example, BusyBox reached port 80 inside `web` directly.

---

## 5. Internal Communication vs. Published Ports

These are different concepts.

### Internal communication

Suppose two containers share a network:

```text
Container A  ───────►  Container B:80
```

Container A can connect to port 80 on Container B using its network name.

This does not require publishing the port on the host.

### Publish a port

If you want to reach the web server from a browser or application running on the host, publish a port:

```bash
docker run -d \
  --name web-public \
  --network lesson7-net \
  -p 127.0.0.1:8080:80 \
  nginx:alpine
```

Open the following address on the same host:

```text
http://127.0.0.1:8080
```

The `-p` syntax is:

```text
-p HOST_PORT:CONTAINER_PORT
```

In this example:

- `127.0.0.1`: The host's loopback interface
- `8080`: The host port
- `80`: The port inside the container

Binding to `127.0.0.1` restricts the published port to the host's loopback interface. If other machines need access, choose the bind address and firewall rules deliberately.

To inspect published ports:

```bash
docker port web-public
```

Or:

```bash
docker ps
```

**Security warning:** Publishing a port can make a service accessible from the host or network. Publish only the ports you actually need.

---

## 6. What Does EXPOSE Do?

You may see this instruction in a Dockerfile:

```dockerfile
EXPOSE 80
```

It declares the port that the application is expected to use as image metadata.

However, **`EXPOSE` does not publish the port on the host by itself.**

To publish a port when starting a container, use a command such as:

```bash
docker run -p 8080:80 nginx:alpine
```

Therefore:

- `EXPOSE 80`: Documents the expected application port.
- `-p 8080:80`: Publishes container port 80 on host port 8080.

They serve different purposes.

---

## 7. An Important Note About localhost

One of the most common mistakes in multi-container applications is using `localhost` incorrectly.

Suppose your backend runs in one container and PostgreSQL runs in another.

If the backend tries to connect to:

```text
localhost:5432
```

it attempts to connect to port 5432 **inside the backend container itself**, not inside the database container.

On a user-defined Docker network, the connection address would normally use the database container's network name:

```text
db:5432
```

Here:

- `db`: The database container name
- `5432`: PostgreSQL's default internal port

Similarly, an application running on the host would typically use a host address such as `127.0.0.1:5432` if that port had been published.

The correct address depends on where the client is running:

| Client location | Example address |
|---|---|
| Another container on the same network | `db:5432` |
| Inside the database container | `localhost:5432` |
| An application on the host, if the port is published | `127.0.0.1:5432` |

---

## 8. Practical Project: Connect to PostgreSQL on a Private Network

In this project, we'll start PostgreSQL and connect to it from a second, temporary container.

We will not publish the database port on the host because internal network communication is sufficient for this test.

### Step 1: Create a network and a volume

```bash
docker network create lesson7-db-net
docker volume create lesson7-postgres-data
```

The network handles container communication, while the volume stores database data.

### Step 2: Start PostgreSQL

```bash
docker run -d \
  --name db \
  --network lesson7-db-net \
  --mount source=lesson7-postgres-data,target=/var/lib/postgresql/data \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=local-dev-password \
  -e POSTGRES_DB=appdb \
  postgres:16
```

This command:

- Creates a container named `db`.
- Connects it to `lesson7-db-net`.
- Stores PostgreSQL data in a named volume.
- Creates a database and user for the exercise.
- Does not publish any database port on the host.

**Warning:** This password is for a local educational example only. Do not reuse it or place real production credentials in terminal history, repository files, or hard-coded project settings. Use an appropriate secret-management mechanism for real deployments.

### Step 3: Check database readiness

Starting a container does not mean the database is ready. PostgreSQL may need a few seconds before accepting connections.

Run:

```bash
docker exec db pg_isready -U appuser -d appdb
```

When the database is ready, you should see output similar to:

```text
/var/run/postgresql:5432 - accepting connections
```

If it is not ready yet, wait a few seconds and run the command again.

### Step 4: Connect from another container

```bash
docker run --rm -it \
  --network lesson7-db-net \
  -e PGPASSWORD=local-dev-password \
  postgres:16 \
  psql -h db -U appuser -d appdb \
  -c "SELECT current_database(), current_user;"
```

The output should show the database name `appdb` and user `appuser`.

This test demonstrates several concepts:

1. The client container is attached to the same network.
2. Docker's embedded DNS resolves the name `db`.
3. PostgreSQL uses its internal port 5432.
4. Publishing the database port on the host is not required for container-to-container communication.

The `PGPASSWORD` variable is used here only to simplify the exercise. Use an appropriate secret-management mechanism in production.

### Step 5: Inspect the network

```bash
docker network inspect lesson7-db-net
```

Look for the containers attached to the network.

### Step 6: Inspect database logs

```bash
docker logs db
```

To follow logs continuously:

```bash
docker logs -f db
```

Press `Ctrl+C` to stop following the logs. This normally does not stop the container.

---

## 9. Managing Docker Networks

Let's review common network commands.

### List networks

```bash
docker network ls
```

### Inspect a network

```bash
docker network inspect lesson7-net
```

### Create a network

```bash
docker network create my-network
```

### Connect an existing container to a network

```bash
docker network connect my-network web
```

The container must exist and be in a suitable state for network attachment.

### Disconnect a container from a network

```bash
docker network disconnect my-network web
```

### Remove a network

```bash
docker network rm my-network
```

Docker generally will not remove a network while containers remain attached to it. Disconnect or remove those containers first.

### Remove unused networks

```bash
docker network prune
```

This removes unused custom networks. Review the resources that Docker proposes to remove before confirming.

**Note:** `docker network prune` cleans up networks; it does not remove volumes.

---

## 10. Connecting and Disconnecting Networks at Runtime

Sometimes a container is already running, and you want to attach it to another network.

For example:

```bash
docker network create monitoring-net
docker network connect monitoring-net web
```

The `web` container is now attached to two networks.

Inspect its configuration:

```bash
docker inspect web
```

Find the `NetworkSettings` section.

To disconnect the second network:

```bash
docker network disconnect monitoring-net web
```

This approach is useful for testing and network management. In real projects, however, it is often better to define service networking in a repeatable configuration. Docker Compose will make this easier in a later lesson.

---

## 11. Troubleshooting Common Network Problems

### Problem 1: Containers cannot find each other

Possible causes include:

- The containers are attached to different networks.
- The destination name is incorrect.
- The containers use the default bridge, and you expect user-defined bridge DNS behavior.
- The destination container is stopped or its application is not ready.

Inspect the environment:

```bash
docker network ls
docker network inspect lesson7-net
docker ps
```

### Problem 2: Using localhost to connect to a database

If the backend and database run in separate containers, `localhost` is usually the wrong destination.

Use the database container name on the user-defined network, for example:

```text
db:5432
```

### Problem 3: The host cannot access a container

If you want to connect from a browser or application running on the host, check whether the port has been published:

```bash
docker ps
docker port web-public
```

Direct access from the host may fail when the port is not published, even if container-to-container communication works correctly.

### Problem 4: The database is not ready yet

A container may be running while the application inside it is still starting up.

For PostgreSQL, use:

```bash
docker exec db pg_isready -U appuser -d appdb
```

Real applications should also handle temporary connection failures and startup delays appropriately.

### Problem 5: A port is not accessible

Check the following:

- Is the application listening on the expected port?
- Did you specify the correct mapping with `-p`?
- Is the host port already in use by another process?
- Are firewall rules or operating-system settings blocking access?

---

## 12. Lesson Exercises

### Exercise 1: Create a network

Create a network named `practice-net` and inspect it using Docker commands.

**Goal:** Learn how to create and inspect networks.

### Exercise 2: Connect two containers

Run an Nginx container named `practice-web` on `practice-net`.

Then use BusyBox to retrieve the Nginx page through the container name.

Use this command for the second step:

```bash
docker run --rm \
  --network practice-net \
  busybox:1.36 \
  wget -qO- http://practice-web
```

**Goal:** Understand Docker's embedded DNS and container-to-container communication.

### Exercise 3: Publish a port

Start another Nginx container and publish its port on host port `8081`. For local testing, preferably bind it to `127.0.0.1`.

**Goal:** See the difference between internal communication and published ports.

### Exercise 4: Test DNS

Attach two containers to the same user-defined network. From one container, send an HTTP request to the other using its container name.

**Goal:** Understand why container names can be used on a user-defined bridge network.

---

## 13. Final Challenge

Build a test environment with the following requirements:

1. Create a network named `final-network`.
2. Run an Nginx container named `frontend`.
3. Run a PostgreSQL container named `database`.
4. Store PostgreSQL data in a volume.
5. Attach both containers to `final-network`.
6. Do not publish the database port on the host.
7. Connect to PostgreSQL from a temporary client container and inspect the database and user names.
8. Use `docker network inspect` to verify the network membership.

### Success criteria

- Internal communication works using the container name.
- The database port is not published on the host.
- Database data is stored in a volume.
- You can explain the difference between networks, volumes, and port publishing.

---

## 14. Clean Up the Exercise Environment

When you finish, remove the resources created for the examples.

First, stop and remove the example containers:

```bash
docker rm -f web web-public db
```

If some of these containers do not exist, Docker will report errors for those names. Remove only the containers that are present.

Remove the example networks:

```bash
docker network rm lesson7-net lesson7-db-net
```

Remove the database volume only if you are certain you no longer need its data:

```bash
docker volume rm lesson7-postgres-data
```

**Warning:** Removing a volume can permanently delete stored database data. Removing a container alone does not necessarily remove its volume.

---

## 15. Summary

In this lesson, you learned that:

- Docker networks enable communication between containers.
- User-defined bridge networks are suitable for many local multi-container projects.
- Docker's embedded DNS allows containers on a user-defined network to discover one another by name.
- `localhost` inside a container refers to that same container.
- Internal container communication generally does not require publishing ports on the host.
- `-p` publishes a container port on the host.
- `EXPOSE` does not publish a port by itself.
- Networks and volumes have different purposes.

**Golden rule:** Publish only the ports that genuinely need to be accessible from the host. For internal service-to-service communication, use an appropriate Docker network and the service or container name.

In the next lesson, we'll introduce Docker Compose and learn how to manage multiple services, networks, and volumes using a repeatable configuration file.
