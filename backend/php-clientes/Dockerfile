FROM php:8.2-cli-alpine

WORKDIR /var/www/html

# Instalar extensiones de PostgreSQL y utilidades
RUN apk add --no-cache postgresql-dev \
    && docker-php-ext-install pdo pdo_pgsql

COPY . /var/www/html

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
