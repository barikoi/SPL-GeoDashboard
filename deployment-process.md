# Deployment Guide for Opportunity Finder

This guide provides step-by-step instructions for deploying the Opportunity Finder application on a Linux server.

## Prerequisites

- Node.js 20.18.0
- npm 10.8.2
- Linux server with sudo access
- SSH access to the server
- Nginx (will be installed during the process)

## Local Machine Steps

1. **Build the Project**
   ```bash
   # Navigate to project directory
   cd opportunity-finder

   # Install dependencies
   npm install

   # Create production build
   npm run build
   ```
   This will create an `out` directory containing the production build.

2. **Create Deployment Package**
   ```bash
   # Create a zip file of the out directory
   zip -r out.zip out/
   ```

## Server Setup

1. **Create Deployment Directory**
   ```bash
   # SSH into your server
   ssh user@your-server-ip

   # Create deployment directory
   sudo mkdir -p /var/www/html/opportunity-finder

   # Set directory permissions
   sudo chmod 700 /var/www/html/opportunity-finder
   ```

2. **Transfer Build Files**
   ```bash
   # From your local machine, transfer the zip file
   scp out.zip user@your-server-ip:/var/www/html/opportunity-finder/
   ```

3. **Extract and Clean Up**
   ```bash
   # SSH into server if not already connected
   ssh user@your-server-ip

   # Navigate to deployment directory
   cd /var/www/html/opportunity-finder

   # Extract the zip file
   unzip out.zip

   # Remove the zip file
   rm out.zip
   ```

## Nginx Installation and Configuration

1. **Install Nginx**
   ```bash
   # Update package list
   sudo apt update

   # Install Nginx
   sudo apt install nginx
   ```

2. **Check Port 80 Availability**
   ```bash
   # Check if port 80 is in use
   sudo lsof -i :80

   # If port 80 is in use, you can stop the service using it
   # For example, if Apache is using it:
   sudo systemctl stop apache2
   ```

3. **Create Nginx Configuration**
   ```bash
   # Create a new configuration file
   sudo nano /etc/nginx/sites-available/opportunity-finder
   ```

4. **Add the Following Configuration**
   ```nginx
   server {
       listen 8011;
       listen [::]:8011;

       server_name _;

       root /var/www/html/opportunity-finder/out;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. **Enable the Configuration**
   ```bash
   # Create symbolic link
   sudo ln -s /etc/nginx/sites-available/opportunity-finder /etc/nginx/sites-enabled/

   # Test Nginx configuration
   sudo nginx -t

   # If test is successful, restart Nginx
   sudo systemctl restart nginx
   ```

## Verify Deployment

1. **Check Nginx Status**
   ```bash
   sudo systemctl status nginx
   ```

2. **Access the Application**
   Open your web browser and navigate to:
   ```
   http://your-server-ip:8011
   ```

## Troubleshooting

1. **If Nginx fails to start:**
   ```bash
   # Check Nginx error logs
   sudo tail -f /var/log/nginx/error.log
   ```

2. **If files are not accessible:**
   ```bash
   # Check directory permissions
   ls -la /var/www/html/opportunity-finder

   # Adjust permissions if needed
   sudo chown -R www-data:www-data /var/www/html/opportunity-finder
   sudo chmod -R 755 /var/www/html/opportunity-finder
   ```

## Maintenance

1. **Updating the Application**
   - Follow the same process as initial deployment
   - Replace the contents of `/var/www/html/opportunity-finder/out` with new build

2. **Nginx Logs**
   - Access logs: `/var/log/nginx/access.log`
   - Error logs: `/var/log/nginx/error.log`

3. **Backup**
   ```bash
   # Create backup of the application
   sudo tar -czf opportunity-finder-backup.tar.gz /var/www/html/opportunity-finder
   ```