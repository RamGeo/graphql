# Use nginx Alpine as base image (lightweight web server)
FROM nginx:alpine

# Set working directory in container
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy all project files to nginx html directory
COPY index.html .
COPY profile.html .
COPY css/ ./css/
COPY js/ ./js/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard HTTP port)
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]

