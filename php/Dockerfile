# il_mio_progetto_docker/php/Dockerfile
FROM php:8.2-fpm 
FROM python:3.10-slim

# Installa le estensioni PHP necessarie, inclusa pdo_mysql
RUN docker-php-ext-install pdo pdo_mysql mysqli
RUN pip install --no-cache-dir poetry

# Installa altre estensioni comuni se ne hai bisogno
# RUN docker-php-ext-install gd mbstring exif pcntl

# Imposta la directory di lavoro all'interno del container
WORKDIR /var/www/html