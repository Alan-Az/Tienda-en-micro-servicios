-- ==========================================================
-- SCRIPT DE BASE DE DATOS: erp_clientes (PostgreSQL 15)
-- Microservicio: PHP 8.2 Laravel 11 - Portal Clientes & Auth
-- ==========================================================

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    puntos_lealtad INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de usuarios semilla para pruebas iniciales
-- Contraseña 'Password123!' en hash bcrypt: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO clientes (nombre, email, password, puntos_lealtad)
VALUES 
('Administrador Retail', 'admin@retail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 500),
('Juan Pérez', 'cliente@retail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 120)
ON CONFLICT (email) DO NOTHING;
