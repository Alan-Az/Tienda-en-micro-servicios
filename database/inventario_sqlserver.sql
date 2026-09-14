-- ==========================================================
-- SCRIPT DE BASE DE DATOS: erp_inventario (SQL Server)
-- Microservicio: C# .NET 10 - Gestión de Sucursales e Inventario
-- ==========================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'erp_inventario')
BEGIN
    CREATE DATABASE erp_inventario;
END
GO

USE erp_inventario;
GO

-- 1. Tabla de Catálogo de Productos
IF OBJECT_ID(N'dbo.Productos', N'U') IS NULL
BEGIN
    CREATE TABLE Productos (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Nombre VARCHAR(100) NOT NULL,
        Precio DECIMAL(18,2) NOT NULL,
        SKU VARCHAR(50) UNIQUE NOT NULL,
        FechaCreacion DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 2. Tabla de Existencias por Sucursal
IF OBJECT_ID(N'dbo.Inventario', N'U') IS NULL
BEGIN
    CREATE TABLE Inventario (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ProductoId UNIQUEIDENTIFIER NOT NULL,
        SucursalId INT NOT NULL,
        Cantidad INT NOT NULL DEFAULT 0,
        UltimaActualizacion DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Inventario_Productos FOREIGN KEY (ProductoId) 
            REFERENCES Productos(Id) ON DELETE CASCADE
    );
END
GO

-- 3. Datos Semilla Iniciales
IF NOT EXISTS (SELECT 1 FROM Productos)
BEGIN
    DECLARE @Prod1 UNIQUEIDENTIFIER = NEWID();
    DECLARE @Prod2 UNIQUEIDENTIFIER = NEWID();
    DECLARE @Prod3 UNIQUEIDENTIFIER = NEWID();

    INSERT INTO Productos (Id, Nombre, Precio, SKU) VALUES
    (@Prod1, 'Laptop Gamer Asus TUF 15.6', 1299.99, 'LAP-ASUS-001'),
    (@Prod2, 'Monitor Curvo Samsung 27 144Hz', 289.50, 'MON-SAM-002'),
    (@Prod3, 'Teclado Mecánico RGB Switch Blue', 75.00, 'TEC-MEC-003');

    INSERT INTO Inventario (ProductoId, SucursalId, Cantidad) VALUES
    (@Prod1, 1, 15),
    (@Prod1, 2, 8),
    (@Prod2, 1, 30),
    (@Prod2, 2, 12),
    (@Prod3, 1, 50),
    (@Prod3, 2, 25);
END
GO
