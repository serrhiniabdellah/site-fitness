FROM nginx:alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

# Copy local files to the container
COPY ./healthcheck.html /usr/share/nginx/html/healthcheck.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]