FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install \
    gd \
    intl \
    mysqli \
    pdo_mysql \
    zip

# Enable Apache modules
RUN a2enmod rewrite headers

# Set working directory
WORKDIR /var/www/html

# Configure Apache
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Setup PHP
RUN echo "error_reporting = E_ALL" >> /usr/local/etc/php/conf.d/docker-php-ext-error-reporting.ini \
    && echo "display_errors = On" >> /usr/local/etc/php/conf.d/docker-php-ext-error-reporting.ini \
    && echo "display_startup_errors = On" >> /usr/local/etc/php/conf.d/docker-php-ext-error-reporting.ini \
    && echo "log_errors = On" >> /usr/local/etc/php/conf.d/docker-php-ext-error-reporting.ini \
    && echo "error_log = /dev/stderr" >> /usr/local/etc/php/conf.d/docker-php-ext-error-reporting.ini \
    && echo "upload_max_filesize = 20M" >> /usr/local/etc/php/conf.d/docker-php-ext-upload-limits.ini \
    && echo "post_max_size = 20M" >> /usr/local/etc/php/conf.d/docker-php-ext-upload-limits.ini

# Create a simple health check file
RUN echo "<?php echo json_encode(['status' => 'healthy', 'timestamp' => time()]); ?>" > /var/www/html/health.php

EXPOSE 80

CMD ["apache2-foreground"]