# Continuous Deployment (CD) Pipeline Instructions

**Version**: 1.0
**Date**: 2025-12-11
**Target Environment**: Ubuntu 24.04 LTS (Web Server) + Ubuntu 24.04 LTS (Database Server)

## Overview 

This document outlines the deployment architecture and operational procedures for the Modular House web application. The pipeline utilizes GitHub Actions for CI/CD, GitHub Container Registry (GHCR) for artifact storage, and SSH for deployment orchestration.

## Architecture

1.  **Source**: GitHub Repository (`main` branch).
2.  **Build**: GitHub Actions builds Docker images for `web` and `api` services.
3.  **Registry**: Images are pushed to GHCR (`ghcr.io`).
4.  **Deployment**: GitHub Actions connects to the Web Server via SSH, updates the `docker-compose.prod.yml`, and restarts containers.
5.  **Runtime**: Docker Compose manages the application lifecycle on the Web Server, connecting to the remote Database Server via a private network.


## Prerequisites

### 1. Web Server Configuration

Ensure the following are installed and configured on the Web Server:

* **Docker Engine**

  1. Set up Docker's `apt` repository.

     ```bash
     # Add Docker's official GPG key:
     sudo apt update
     sudo apt install ca-certificates curl
     sudo install -m 0755 -d /etc/apt/keyrings
     sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
     sudo chmod a+r /etc/apt/keyrings/docker.asc
     
     # Add the repository to Apt sources:
     sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
     Types: deb
     URIs: https://download.docker.com/linux/ubuntu
     Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
     Components: stable
     Signed-By: /etc/apt/keyrings/docker.asc
     EOF
     
     sudo apt update
     ```

  2. Install the Docker packages.

     Latest Specific version

     To install the latest version, run:

     ```bash
     sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
     ```

     > Note
     >
     > The Docker service starts automatically after installation. To verify that Docker is running, use:
     >
     > ```console
     >  sudo systemctl status docker
     > ```
     >
     > Some systems may have this behavior disabled and will require a manual start:
     >
     > ```console
     >  sudo systemctl start docker
     > ```

  3. Verify that the installation is successful by running the `hello-world` image:

     ```bash
      sudo docker run hello-world
     ```

* **Docker Compose Plugin**: Included with modern Docker installations.

*   **Directory Structure**: Ensure a deployment directory exists (default: `~/app`).
    
    ```bash
    mkdir -p ~/app
    ```

### 2. Environment Configuration (`.env`)

Create a `.env` file in the deployment directory (`~/app/.env`) on the Web Server. This file stores runtime secrets and configuration.

```bash
# ~/app/.env

# Database Connection (Use Private IP of DB Server)
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_PRIVATE_IP>:5432/<DB_NAME>"

# Application Secrets
NODE_ENV="production"
# Add other API secrets here (e.g., JWT_SECRET, etc.)
```

### 3. Registry Authentication

The Web Server must be authenticated to pull images from GHCR.

1.  Generate a GitHub Personal Access Token (PAT) with `read:packages` scope.
2.  Run the login command on the Web Server:
    ```bash
    echo <YOUR_GITHUB_PAT> | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin
    ```

## GitHub Repository Configuration

Configure the following **Secrets** in the GitHub Repository settings (*Settings -> Secrets and variables -> Actions -> Secrets -> New Repository secrete (Name: `PROD_HOST`, Value: `example.com`)*).

| Secret Name | Description |
| :--- | :--- |
| `SERVER_HOST` | The Public IP address of the Web Server. |
| `SERVER_USER` | The SSH username for the Web Server (e.g., `ubuntu`). |
| `SERVER_SSH_KEY` | The private SSH key (PEM format) used to authenticate with the Web Server. |

**Note**: The `GITHUB_TOKEN` is automatically provided by GitHub Actions and does not need to be manually configured.

## Deployment Process

### Automatic Deployment

The pipeline is triggered automatically on every push to the `main` branch.

1.  **Build & Push**:
    *   Code is checked out.
    *   Docker images are built for `apps/api` and `apps/web`.
    *   Images are tagged with `latest` and pushed to GHCR.

2.  **Deploy**:
    *   The `docker-compose.prod.yml` file is copied from the repository to `~/app/` on the Web Server.
    *   An SSH connection is established.
    *   `docker compose pull` fetches the new images.
    *   `docker compose up -d` recreates the containers with the new images.
    *   `docker image prune -f` cleans up unused image layers to save disk space.

### Manual Rollback

If a deployment fails or introduces a critical bug, you can rollback by reverting the commit on the `main` branch and pushing the change. This will trigger a new deployment with the previous code.

Alternatively, to manually redeploy a specific version on the server:

1.  SSH into the server.
2.  Edit `docker-compose.prod.yml` to point to a specific image tag (if tagged versions are implemented) or ensure the previous image is available.
3.  Run `docker compose up -d`.

## Troubleshooting

*   **SSH Connection Failed**: Verify `SERVER_HOST`, `SERVER_USER`, and `SERVER_SSH_KEY` secrets. Ensure the Web Server's firewall allows SSH (Port 22) from GitHub Actions IPs (or open to 0.0.0.0/0).
*   **Image Pull Failed**: Verify the Web Server is logged into GHCR (`docker login ghcr.io`). Ensure the repository permissions allow package access.
*   **Database Connection Failed**: Verify `DATABASE_URL` in `~/app/.env` uses the correct Private IP and credentials. Ensure the Database Server's firewall allows traffic on Port 5432 from the Web Server's Private IP.
