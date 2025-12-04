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

# Ensure proper permissions for nginx to read files
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Note: nginx master process runs as root to bind to port 80
# but worker processes run as nginx user (configured in nginx.conf)
# This is the standard nginx security model

# Expose port 80 (standard HTTP port)
EXPOSE 80

# Add healthcheck to monitor container health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx server (master runs as root, workers as nginx user)
CMD ["nginx", "-g", "daemon off;"]

