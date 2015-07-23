# Chaise

This is a Web UI for the ERMrest service.

## System Requirements

 * CentOS 6.x
 * Apache Httpd 2.x
 * ERMrest (trunk)

The installation instructions assume directory paths based on a CentOS 6 
installation of these components. However, the UI is independent of the
system or httpd.
 
# Installation

To install from the repository:

1. From a source directory run:

   ```sh
   git clone https://github.com/informatics-isi-edu/chaise.git
   ```

2. From the source directory run the following command as root:

   ```sh
   rsync -av --delete --exclude=".*" --exclude="README.md" chaise /var/www/html/
   ```

# Accessing the Application

In a browser enter this URL and replace <hostname>:

   ```
   http://<hostname>/chaise/app.html
   ```
