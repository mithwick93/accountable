# Use an official Nginx image from Docker Hub
FROM nginx

# Copy the SSL certificate and private key into the container
COPY infrastructure/ssl/server.crt /etc/nginx/certs/
COPY infrastructure/ssl/server.key /etc/nginx/certs/

# Copy the React app build into the Nginx directory
COPY build /usr/share/nginx/html

# Copy the Nginx configuration file into the container
COPY infrastructure/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the HTTPS port
EXPOSE 3443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]