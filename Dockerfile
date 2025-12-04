# Use nginx Alpine as base image (lightweight web server)
FROM nginx:alpine

# Update Alpine packages to fix security vulnerabilities (including libpng)
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Set working directory in container
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy all public files to nginx html directory
COPY public/ .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard HTTP port)
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]

