[🇮🇷 فارسی](/fa/08-docker-compose/README.md)

# Lesson 8: Docker Compose

## 🎯 Learning Objectives

By the end of this lesson, you will be able to:

- Explain Docker Compose and when to use it.
- Write a `compose.yaml` file.
- Start and stop multiple services with a single command.
- Distinguish between `services`, `networks`, and `volumes`.
- Configure environment variables in Compose.
- Inspect service status, logs, and published ports.
- Run a multi-container project with a web server and PostgreSQL.
- Troubleshoot common Compose problems.

---

## 1. What Is Docker Compose?

So far, we have started containers using commands such as `docker run`.

For a simple web server, this command is enough:

```bash
docker run -d --name web -p 8080:80 nginx:alpine
```

But imagine a real application with several components:

- Django backend
- PostgreSQL database
- JavaScript frontend
- Nginx reverse proxy
- Redis cache

Writing and maintaining long, separate commands for each service makes it harder to start the project, manage networking, configure volumes, and share the environment with teammates.

**Docker Compose** makes this easier.

Compose lets you define your application's services and related configuration in a YAML file, then manage them with a small set of commands.

For example:

```bash
docker compose up -d
```

This command creates or starts the services defined in the Compose file.

To stop the project:

```bash
docker compose down
```

### Docker vs. Docker Compose

- **Docker Engine** runs and manages containers, networks, and volumes.
- **Docker Compose** defines and manages multi-service applications through a configuration file.

Compose uses Docker Engine to perform these operations.

---

## 2. Check Docker Compose Installation

Recent versions of Docker Desktop usually include Compose.

Check the installed version:

```bash
docker compose version
```

Notice the space between `docker` and `compose`. Modern installations use `docker compose`, rather than the older standalone `docker-compose` command with a hyphen.

If the command is unavailable, check your Docker installation and whether the Compose plugin is installed and accessible.

---

## 3. Compose File Structure

Compose commonly uses a file named `compose.yaml`.

A simple project may look like this:

```text
my-project/
├── compose.yaml
└── README.md
```

The `compose.yaml` file stores the configuration for the project's services.

### Your First Compose File

Create `compose.yaml` with the following content:

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
```

Run the project from the directory containing the file:

```bash
docker compose up -d
```

Open your browser and visit:

```text
http://localhost:8080
```

You should see the default Nginx page.

### Understanding the Configuration

```yaml
services:
```

This is the main section for defining application services.

```yaml
web:
```

This is the Compose service name. It does not necessarily have to match the container name.

```yaml
image: nginx:alpine
```

This specifies the image used by the service.

```yaml
ports:
  - "8080:80"
```

This publishes container port 80 on host port 8080.

In this example, the port is published on all host network interfaces. If you only need local access, use:

```yaml
ports:
  - "127.0.0.1:8080:80"
```

This is often more appropriate for local development because it binds the published port to the host's loopback interface.

---

## 4. Essential Docker Compose Commands

Run these commands from the directory containing `compose.yaml`.

### Start services

```bash
docker compose up
```

To run them in the background:

```bash
docker compose up -d
```

The `-d` flag means detached mode, so your terminal does not remain attached to continuous service output.

### List running services

```bash
docker compose ps
```

### View logs

```bash
docker compose logs
```

Follow logs continuously:

```bash
docker compose logs -f
```

View logs for one service:

```bash
docker compose logs -f web
```

Press `Ctrl+C` to stop following the logs. This normally does not stop the services.

### Stop services

```bash
docker compose stop
```

This stops the containers without removing them.

### Start stopped services again

```bash
docker compose start
```

### Stop and remove project containers and networks

```bash
docker compose down
```

By default, `down` removes the project's containers and networks but retains named volumes.

**Warning:** The `-v` option can also remove Compose-managed volumes. Check your data before using it.

---

## 5. Practical Project: Nginx and PostgreSQL

Let's create a project with two services:

- `web`: Nginx web server
- `db`: PostgreSQL database

These services run independently in this example. The goal is to learn how to define multiple services, create internal networking, and persist database data.

### Project Structure

```text
compose-demo/
└── compose.yaml
```

### Complete `compose.yaml`

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "127.0.0.1:8080:80"
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: local-dev-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Security note:** The password above is only for local practice. Do not hard-code real credentials in a Compose file or commit them to Git. Use an appropriate secret-management mechanism for real deployments.

### Start the project

Run this from `compose-demo`:

```bash
docker compose up -d
```

Check service status:

```bash
docker compose ps
```

Inspect logs:

```bash
docker compose logs
```

To inspect only PostgreSQL:

```bash
docker compose logs db
```

Nginx should now be available at:

```text
http://127.0.0.1:8080
```

### What did Compose create?

Compose manages the resources required by the configuration:

- A container for the `web` service
- A container for the `db` service
- The project's default network
- A volume named `postgres_data`

Compose typically prefixes resource names with the project name. The exact resource names may depend on the project directory or explicit project-name settings.

---

## 6. Service Communication in Compose

By default, Compose creates a network for the project and attaches its services to it.

Services can communicate using their service names as network hostnames.

In the example above, an application running in another container would typically use these PostgreSQL connection settings:

```text
Host: db
Port: 5432
Database: appdb
Username: appuser
```

The important point is that **the Compose service name `db` is the network hostname used to reach PostgreSQL**.

You do not need to publish port 5432 on the host for this internal communication. Services attached to the Compose network can access the database's internal port.

If a tool running on the host needs to connect to PostgreSQL, you can add this mapping to the `db` service:

```yaml
ports:
  - "127.0.0.1:5432:5432"
```

Only do this when host access is actually needed.

If host port 5432 is already in use, choose a different host port.

### An Important Note About Service Readiness

Starting the database container does not mean PostgreSQL is immediately ready to accept connections.

If a backend depends on the database, we must account for database readiness. We will introduce health checks and `depends_on` next.

---

## 7. `depends_on` vs. Actual Service Readiness

Suppose a backend depends on PostgreSQL.

You can define the dependency like this:

```yaml
services:
  db:
    image: postgres:16

  backend:
    image: my-backend:latest
    depends_on:
      - db
```

This specifies the service startup order, but it does not guarantee that PostgreSQL is ready to accept connections.

For that, you can use a health check and the `service_healthy` condition.

A more complete example:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: local-dev-password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

  backend:
    image: my-backend:latest
    depends_on:
      db:
        condition: service_healthy
```

With this configuration, Compose waits for the database health check to succeed before starting the backend.

This is an example of the concept. The `my-backend:latest` image must actually exist, and its application must be configured to connect to the database.

Even with a health check, your application should handle temporary connection failures.

---

## 8. Managing Environment Variables

You can configure environment variables with `environment`.

Example:

```yaml
services:
  backend:
    image: my-backend:latest
    environment:
      APP_ENV: development
      DB_HOST: db
      DB_PORT: "5432"
      DB_NAME: appdb
```

This passes database connection settings to the application through environment variables.

However, Compose does not automatically convert these variables into application settings. Your application code must read and use them.

### Use a `.env` File

You can put values in a `.env` file.

For example, `.env`:

```dotenv
POSTGRES_DB=appdb
POSTGRES_USER=appuser
POSTGRES_PASSWORD=local-dev-password
```

Then reference them in `compose.yaml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

Compose typically uses a `.env` file in the project directory to substitute variables in the Compose configuration.

**Important warning:** A `.env` file is not a secure secret store by itself. If it contains real credentials, do not commit it to Git. Use an appropriate secret-management mechanism for production.

For a repository, it is usually better to include a `.env.example` file containing sample values without confidential information.

---

## 9. Recreating and Rebuilding Services

If you change `compose.yaml`, you can run:

```bash
docker compose up -d
```

Compose checks the configuration and recreates containers when necessary.

If you have changed your backend image and want to rebuild it:

```bash
docker compose up -d --build
```

This builds images for services that define a `build` configuration.

For example:

```yaml
services:
  backend:
    build:
      context: ./backend
    ports:
      - "127.0.0.1:8000:8000"
```

Compose uses the Dockerfile in the `backend` directory to build the image.

If a service is defined only with `image` and has no `build` configuration, `--build` does not build a local image from source for that service.

---

## 10. More Useful Commands

### Display the resolved Compose configuration

```bash
docker compose config
```

This validates the configuration and displays its resolved form.

The output may contain substituted environment-variable values, so review it for secrets before sharing it.

### List images used by the project

```bash
docker compose images
```

### Run a command inside a service

For example:

```bash
docker compose exec db psql -U appuser -d appdb
```

This opens an interactive `psql` session inside the `db` service container, provided the database is ready.

To exit `psql`:

```sql
\q
```

### Run a temporary command

If you do not want to enter a running container, use `run`:

```bash
docker compose run --rm db psql -U appuser -d appdb -c "SELECT current_database();"
```

This starts a temporary container for the `db` service and removes it when the command finishes. In this example, the temporary container uses the service configuration to execute `psql`.

---

## 11. Common Docker Compose Problems

### Problem 1: The host port is already in use

If you see an error such as `port is already allocated`, another service is probably using the host port.

Possible solutions:

- Stop the conflicting service; or
- Choose another host port.

For example:

```yaml
ports:
  - "127.0.0.1:8081:80"
```

### Problem 2: The database service does not start

Check the logs:

```bash
docker compose logs db
```

Also inspect the service status:

```bash
docker compose ps
```

### Problem 3: The backend cannot find the database

Check that:

- Both services are attached to the appropriate project network.
- `DB_HOST` contains the database service name, such as `db`.
- The correct internal port, such as `5432`, is used.
- The database is ready to accept connections.

Do not use `localhost` to reach a separate database container from the backend.

### Problem 4: Changing the password in Compose has no effect

Official database images typically process variables such as `POSTGRES_PASSWORD` when initializing an empty data directory.

If the volume has already been initialized, changing an environment variable does not necessarily change the password of an existing database user.

In this situation, follow the database's password-change procedure. Simply removing and recreating the container may not be enough because the data remains in the volume.

**Do not delete important data without a backup just to troubleshoot a password issue.**

### Problem 5: Changes to the Compose file do not seem to apply

First, inspect the resolved configuration:

```bash
docker compose config
```

Then check service status:

```bash
docker compose ps
```

If the application image has changed and the service uses `build`, run:

```bash
docker compose up -d --build
```

### Problem 6: Data is lost

Removing a container does not necessarily remove its volume.

However, this command can remove Compose-managed volumes:

```bash
docker compose down -v
```

Do not run it without checking whether the data is still needed.

---

## 12. Lesson Exercises

### Exercise 1: Run Nginx

Create a Compose file that runs Nginx on local port `8080`.

Goal: Learn `services`, `image`, and `ports`.

### Exercise 2: Run PostgreSQL

Define a PostgreSQL service with a test database, username, and password. Store its data in a named volume.

Goal: Learn `environment` and `volumes`.

### Exercise 3: Internal communication

Define two services that communicate over the project's default network.

Goal: Understand Compose's internal DNS and service-name resolution.

### Exercise 4: Inspect logs

Start the services and inspect the logs for each service separately.

Goal: Practice using `docker compose logs`.

### Exercise 5: Stop the project

Stop and remove the project with `docker compose down`. Then check whether the volume data still exists.

Goal: Understand the difference between the container lifecycle and the volume lifecycle.

---

## 13. Final Challenge

Create a project with this structure:

```text
compose-final/
├── compose.yaml
└── .env.example
```

Project requirements:

1. The `web` service uses the Nginx image.
2. The web server is accessible through local port `8080`.
3. The `db` service uses PostgreSQL.
4. PostgreSQL uses a named volume.
5. The database port is not published on the host unless there is a real need.
6. Connection settings are supplied through environment variables.
7. The services can be started with `docker compose up -d`.
8. You can inspect service status and logs.
9. You can run `docker compose down` without unintentionally deleting the database volume.

### Success Criteria

- The Compose file is valid.
- Services start with one command.
- The web server is accessible from the host.
- PostgreSQL stores data in a volume.
- The database port is not published unnecessarily.
- You can explain the difference between `stop`, `down`, and `down -v`.

---

## 14. Clean Up the Exercise Environment

Run this command from the project directory:

```bash
docker compose down
```

This normally removes the containers and default project network while retaining the named volume.

If you also want to delete the test data, first make sure you no longer need it. Then you can run:

```bash
docker compose down -v
```

**Warning:** This can remove data stored in Compose-managed volumes.

---

## 15. Summary

In this lesson, you learned that:

- Docker Compose manages multi-service applications.
- Service configuration is defined in `compose.yaml`.
- `docker compose up -d` starts services in the background.
- `docker compose ps` displays service status.
- `docker compose logs` helps you inspect service output.
- `docker compose down` normally removes the project's containers and networks.
- Named volumes keep data outside the container lifecycle.
- Services can communicate using their service names on the project network.
- A running container does not necessarily mean its application is ready.
- Credentials and persistent data must be managed carefully.

**Golden rule:** Define your project infrastructure in a repeatable Compose file, publish ports only when needed, and store important data in appropriate volumes.

In the next lesson, we'll build a more realistic application and apply Docker concepts to an actual development workflow.
