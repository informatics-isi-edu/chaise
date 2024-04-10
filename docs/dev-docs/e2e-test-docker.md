# End to End Testing using Docker

This guide outlines the process to containerize chaise using docker to facilitate quick and easy end to end testing.

## Table of contents

- [1. Install dependencies](#1-install-dependencies)
   * [1.1 Install Docker](#11-install-docker)
      + [What is Docker?](#what-is-docker)
      + [Different ways to install Docker](#different-ways-to-install-docker)
   * [1.2 Install X11 server](#12-install-x11-server)
      + [What is X11 server?](#what-is-x11-server)
      + [Different ways to install X11 server](#different-ways-to-install-x11-server)
- [2. Build a Docker image using Dockerfile](#2-build-a-docker-image-using-dockerfile)
      + [What is a Dockerfile](#what-is-a-dockerfile)
      + [Chaise Dockerfiles](#chaise-dockerfiles)
      + [How to build a Docker image](#how-to-build-a-docker-image)
- [3. Run the container](#3-run-the-container)
- [4. Run the tests](#4-run-the-tests)
- [5. Cleanup](#5-cleanup)

## 1. Install dependencies

### 1.1 Install Docker

#### What is Docker?

Docker is a platform that allows you to package, distribute, and run applications within containers. Containers provide a lightweight, portable environment that ensures consistency across different environments. Docker simplifies the deployment process by enabling developers to encapsulate their applications and all their dependencies into a single unit called a container.


#### Different ways to install Docker

There are several methods to install Docker depending on your operating system:

  1. **Docker Desktop (for Windows and macOS) `recommended`:** Docker Desktop is an easy-to-install application that provides a Docker environment for Windows and macOS users. It includes Docker Engine, Docker CLI client, Docker Compose, Docker Content Trust, Kubernetes, and Credential Helper. [Download Docker Desktop Here](https://www.docker.com/products/docker-desktop/)

  2. **Docker Engine (for Linux):** Docker Engine is available for Linux distributions like Ubuntu, Debian, CentOS, and others. You can install Docker Engine using package managers like apt, yum, or dnf, depending on your Linux distribution.

Choose the installation method that best suits your requirements and operating system.

### 1.2 Install X11 server

#### What is X11 server?

[X11](https://en.wikipedia.org/wiki/X_Window_System), also known as X Window System or X, is a graphical windowing system that provides a framework for building graphical user interfaces (GUIs) on Unix-like operating systems. The X11 server is a crucial component of this system. The X11 server serves as a mediator between the hardware (graphics hardware) and software (applications) layers, facilitating the display of graphical elements on the screen and handling user input events such as mouse clicks and keyboard input.

Using an X11 server is necessary to run graphical applications within the container and display their graphical output on the host system. This way we can support **Headful Testing**

#### Different ways to install X11 server

1. **Microsoft Windows** - Download and install VcXsrv [here](https://sourceforge.net/projects/vcxsrv/).
2. **Mac and Linux** - will be updated soon

## 2. Build a Docker image using Dockerfile

#### What is a Dockerfile

A Dockerfile is a text file that contains instructions for building a Docker image. It specifies the base image, commands to install dependencies, configure the environment, and run applications within the container. Dockerfiles streamline the process of creating reproducible and portable Docker images for deploying applications in containerized environments.

#### Chaise Dockerfiles

You have a choice between two Dockerfiles:

1. `Dockerfile.chaise-test-env`: @aniket explain

2. `Dockerfile.chaise-test-env.local`: @aniket explain

<details>
  <summary>Click here for step by step explanation of Dockerfile</summary>

  This following provides an in-depth explanation of each step in the provided Dockerfile. It also highlights commonly faced problems and solutions.

  ##### Step 1: Base Image
  ```dockerfile
  FROM ubuntu:20.04
  ```
  This line sets the base image as Ubuntu 20.04 for the Docker container.

  ##### Step 2: Update package repository and install dependencies
  ```dockerfile
  RUN apt-get update \
      && apt-get install -y wget gnupg \
      && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
      && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
      && apt-get update \
      && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 \
        --no-install-recommends \
      && service dbus start \
      && rm -rf /var/lib/apt/lists/*
  ```
  Notes:
  - This step updates the package repository and installs necessary dependencies including `wget`, `gnupg`, and Google Chrome Stable.
  - It adds Google Chrome's GPG key to ensure the integrity of the downloaded packages.
  - Fonts and other necessary packages for Google Chrome are installed.
  - `dbus` service is started. DBus, or Desktop Bus, is a message bus system that provides a simple way for applications to communicate with each other. It's a communication mechanism between software components within the same system or even across different systems.
    1. Google Chrome Stability: Here, DBus is started explicitly before installing Google Chrome. This is crucial because Chrome relies on DBus for certain functionalities like accessing the system's notification system or interacting with hardware devices.

    2. Graphical User Interface (GUI) Applications: Since our containerized application requires interaction with graphical elements or desktop services, DBus becomes essential. It enables the containerized application to communicate with the host's desktop environment.

  - Finally, it cleans up temporary files to reduce the image size.

  Common Problems:
  - If the Google Chrome installation fails, it could be due to network issues or an expired GPG key. Ensure that the network connection is stable and try updating the key or using an alternative mirror for downloading Google Chrome.

  ##### Step 3: Install additional dependencies
  ```dockerfile
  RUN apt-get update && \
      apt-get install -y \
      curl \
      make \
      rsync \
      git \
      sudo \
      openjdk-8-jdk
  ```
  This step installs additional dependencies required for the subsequent steps including `curl`, `make`, `rsync`, `git`, `sudo`, and `openjdk-8-jdk`.

  ##### Step 4: Install Node.js
  ```dockerfile
  RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
  RUN apt-get install -y nodejs
  ```
  - It downloads and executes the Node.js setup script for version 16.x.
  - Node.js is installed using `apt-get`.

  ##### Step 5: Set working directory and copy application files
  ```dockerfile
  WORKDIR /app
  COPY ./chaise /app/chaise
  ```
  - Sets the working directory as `/app`.
  - Copies application files `chaise` from the host to the container's `/app` directory.

  ##### Step 6: Install test dependencies
  ```dockerfile
  RUN cd chaise && \
      make deps-test
  ```
  Changes directory to `/app/chaise` and installs test dependencies using `make`.

  ##### Step 7: Add user and set permissions
  ```dockerfile
  RUN echo 'chaiseuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers.d/chaiseuser

  RUN groupadd -r chaiseuser && useradd -rm -g chaiseuser -G audio,video chaiseuser && \
      echo 'chaiseuser:test' | chpasswd && \
      chmod -R 777 /app && \
      chmod -R 777 /home
  ```
  - Adds `chaiseuser` to sudoers without requiring a password.
  - Creates a user `chaiseuser`, assigns it to groups `audio` and `video`, and sets its password.
  - Adjusts permissions for `/app` and `/home`.

  ##### Step 8: Set environment variables
  ```dockerfile
  ENV DBUS_SESSION_BUS_ADDRESS autolaunch:
  ENV DISPLAY host.docker.internal:0.0
  ```
  - `DBUS_SESSION_BUS_ADDRESS`:
    - Specifies the address of the DBus session bus. The session bus is responsible for communication between user applications.
    - Setting this variable ensures that applications running within the Docker container can communicate with the DBus session bus on the host system.
    - In this Dockerfile, `autolaunch:` is set as the value, indicating that the DBus session bus address should be determined automatically based on the current session.

  - `DISPLAY`:
    - Specifies the X11 display server to use.
    - When running GUI applications within a Docker container, it's crucial to set the `DISPLAY` variable correctly so that the application can display its graphical user interface on the host system's display.
    - In this Dockerfile, `host.docker.internal:0.0` is set as the value, telling the application within the container to display its GUI on the X11 server running on the host system.

  ##### Step 9: Set User
  ```dockerfile
  USER chaiseuser
  ```
  Sets the user for subsequent commands to `chaiseuser`. We cannot run chrome inside a container as root user.

  ##### Step 10: Define default command
  ```dockerfile
  CMD ["/bin/bash"]
  ```
  Specifies the default command to run when the container starts, in this case, it opens a Bash shell.

</details>


#### How to build a Docker image

To build a Docker image follow these steps:

1. Open a terminal or command prompt.
2. Navigate to the directory containing `chaise`.
    ```
      parent_dir
      └── chaise
    ```

3. Run the following command to build the Docker image:
    ```
    docker build -t chaise-test-env -f chaise/test/e2e/docker/Dockerfile.chaise-test-env .
    ```
    or
    ```
    docker build -t chaise-test-env -f chaise/test/e2e/docker/Dockerfile.chaise-test-env.local .
    ```
  - `docker build`: This is the Docker command used to build Docker images.
  - `-t chaise-test-env`: The `-t` flag is used to specify a tag for the image being built. In this case, the tag is `chaise-test-env`. Tags are used to identify different versions or variations of an image.
  - `-f chaise/test/e2e/docker/Dockerfile.chaise-test-env`: The `-f` flag is used to specify the path to the Dockerfile to be used for building the image.
  - `.`: The dot `.` at the end of the command specifies the build context. It tells Docker to use the current directory as the build context. The build context includes the Dockerfile and any files or directories referenced by the Dockerfile (e.g., files copied into the image using `COPY` instructions).

4. After building, you can verify that the image was created successfully by running:
     ```
     docker images
     ```

## 3. Run the container

1. Once the image is built, you can run a container by using the following command:
    ```
    docker run --name <container_name> -d -i chaise-test-env
    ```

    Or if running tests locally, you can run a container by using the following command:
      ```
      docker run --name <container_name> -d -i \
      -v <path-to-chaise>/chaise:/app/chaise \
      -v <path-to-ssh-directory>:/etc/ssh \
      chaise-test-local
      ```
    Notes
    - `docker run`: Command to run a Docker container.
    - `--name <container_name>`: Specifies the name of the container.
    - `-d`: Runs the container in detached mode, meaning it runs in the background.
    - `-i`: Keeps STDIN open even if not attached, allowing interaction.
    - `-v <path-to-chaise>/chaise:/app/chaise`: Mounts the local directory "<path-to-chaise>/chaise" to "/app/chaise" in the container.
    - `-v <path-to-ssh-directory>:/etc/ssh`: Mounts the local "ssh" directory to "/etc/ssh" in the container.
    - `chaise-test-local`: Specifies the Docker image used to create and run the container.


2. To see the running containers, use the following command:
     ```
     docker ps
     ```
     This command will show the container ID, name, status, ports, etc.

3. You can interact with the container using various Docker commands:
     - `docker exec -it <container_name> bash`: This command opens a bash shell inside the running container, allowing you to execute commands.
     - `docker logs <container_name>`: Use this command to view the logs of the container.
     - `docker stop <container_name>`: Stops the running container.
     - `docker start <container_name>`: Starts a stopped container.
     - `docker rm <container_name>`: Removes a stopped container.

## 4. Run the tests

To run the test cases,

1. Open a terminal and run the following command which will give you bash access to the container
    ```
    docker exec -it <container_name> bash
    ```

2. Add your private key to the ssh-agent
    ```
    ssh-agent bash
    ssh-add sshKey
    ```

3. Set the environemnt variables that are needed for running test cases:
    ```
    HOST=dev.derivacloud.org
    USERNAME=aniketl  # Replace with your username
    export CHAISE_BASE_URL=https://${HOST}/~${USERNAME}/chaise
    export ERMREST_URL=https://${HOST}/ermrest
    export REMOTE_CHAISE_DIR_PATH=${USERNAME}@${HOST}:public_html/chaise
    export WEB_AUTH_TOKEN="E19wWB1Mh0S5pv04NcI0CcpS" #Replace with your token
    export AUTH_COOKIE="webauthn=${WEB_AUTH_TOKEN};"
    export RESTRICTED_AUTH_COOKIE="webauthn=${WEB_AUTH_TOKEN};"
    export SHARDING=false
    export HEADLESS=false
    ```

4. change directory to chaise:

    ```
    cd chaise
    ```

5. Run the test cases. For example:

    ```
    make testnavbar
    ```

## 5. Cleanup

After you're done with the container, you can remove it using:

```
docker rm <container_name>
```

You can also remove the Docker image using:

```
docker rmi <image_name>:<tag>
```
