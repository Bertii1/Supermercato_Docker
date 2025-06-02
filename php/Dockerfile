# il_mio_progetto_docker/php/Dockerfile
FROM php:8.2-fpm 

# Installa le estensioni PHP necessarie, inclusa pdo_mysql
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Installa altre estensioni comuni se ne hai bisogno
# RUN docker-php-ext-install gd mbstring exif pcntl

# Imposta la directory di lavoro all'interno del container
WORKDIR /var/www/html