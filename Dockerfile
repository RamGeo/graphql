# Use nginx Alpine as base image
FROM nginx:alpine

# Update packages and install wget for healthcheck
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache wget && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx files
RUN rm -rf ./*

# Copy application files
COPY public/ .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and make config generation script executable
COPY generate-config.sh /usr/local/bin/generate-config.sh
RUN chmod +x /usr/local/bin/generate-config.sh

# Set proper permissions for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Expose port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Create entrypoint script (generates config.js then starts nginx)
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo '/usr/local/bin/generate-config.sh' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]

