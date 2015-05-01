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

To install from the Subversion repository:

  1. From a source directory run:
     svn co https://svn2.misd.isi.edu/repos/tagfiler/ermrest-ui/trunk ermrest-ui

  2. From the source directory run the following command as root:
     rsync -av --delete --exclude=".*" --exclude="README" ermrest-ui /var/www/html/

# Accessing the Application

  1. In a browser type the following URL by replacing <hostname> with the one 
     you have the installation:

     http://<hostname>/ermrest-ui

