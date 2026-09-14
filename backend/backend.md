# Especificación Técnica de Backend: Microservicios ERP Retail (v2)

Este documento detalla la implementación, estructura de código, contratos de datos, seguridad y configuración de los **6 microservicios** del backend distribuidos entre el ecosistema propietario (Windows / IIS) y el ecosistema de software libre (Linux / Docker).

---

## Índice de Microservicios

1. [Microservicio 1: C# .NET 10 - Gestión de Sucursales e Inventario (REST)](#1-microservicio-1-c-net-10---gestión-de-sucursales-e-inventario-rest)
2. [Microservicio 2: VB.NET WCF - Facturación Electrónica (SOAP)](#2-microservicio-2-vbnet-wcf---facturación-electrónica-soap)
3. [Microservicio 3: Java 21 JAX-WS - Procesamiento de Pagos (SOAP)](#3-microservicio-3-java-21-jax-ws---procesamiento-de-pagos-soap)
4. [Microservicio 4: PHP 8.2 Laravel 11 - Portal de Clientes y Auth (REST)](#4-microservicio-4-php-82-laravel-11---portal-de-clientes-y-auth-rest)
5. [Microservicio 5: Python 3.12 FastAPI - Analítica y Predicción (REST)](#5-microservicio-5-python-312-fastapi---analítica-y-predicción-rest)
6. [Microservicio 6: Node.js 20 Express - Notificaciones (REST)](#6-microservicio-6-nodejs-20-express---notificaciones-rest)
7. [Infraestructura y Orquestación Docker Compose](#7-infraestructura-y-orquestación-docker-compose)

---

## 1. Microservicio 1: C# .NET 10 - Gestión de Sucursales e Inventario (REST)

- **Directorio:** `backend/csharp-inventario/`
- **Paradigma:** RESTful
- **Puerto:** `5084`
- **Base de Datos:** SQL Server (`erp_inventario`)
- **Host:** Windows Server 2025 (IIS) / Kestrel

### 1.1. Estructura de Carpetas
```text
backend/csharp-inventario/
├── Controllers/
│   ├── InventarioController.cs
│   └── ProductosController.cs
├── Data/
│   └── InventarioDbContext.cs
├── Models/
│   ├── Producto.cs
│   ├── Inventario.cs
│   └── DTOs/
│       ├── CrearProductoDto.cs
│       └── ActualizarStockDto.cs
├── appsettings.json
├── appsettings.Development.json
├── Program.cs
└── InventarioApi.csproj
```

### 1.2. Esquema de Base de Datos (SQL Server)
```sql
CREATE DATABASE erp_inventario;
GO

USE erp_inventario;
GO

CREATE TABLE Productos (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Nombre VARCHAR(100) NOT NULL,
    Precio DECIMAL(18,2) NOT NULL,
    SKU VARCHAR(50) UNIQUE NOT NULL,
    FechaCreacion DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Inventario (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProductoId UNIQUEIDENTIFIER NOT NULL,
    SucursalId INT NOT NULL,
    Cantidad INT NOT NULL DEFAULT 0,
    UltimaActualizacion DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Inventario_Productos FOREIGN KEY (ProductoId) REFERENCES Productos(Id) ON DELETE CASCADE
);
```

### 1.3. Contratos de API (Endpoints)

#### `GET /api/inventario`
- **Descripción:** Obtiene la lista completa de inventarios por sucursal y producto.
- **Cabeceras:** `Authorization: Bearer <jwt_token>`
- **Respuesta 200 OK:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productoId": "e1a90c42-2615-46f3-a15d-318eec2e3f55",
    "productoNombre": "Laptop Gamer 15 pulgadas",
    "sku": "LAP-GAM-001",
    "precio": 1299.99,
    "sucursalId": 1,
    "cantidad": 45,
    "ultimaActualizacion": "2026-09-13T18:30:00Z"
  }
]
```

#### `GET /api/inventario/{id}`
- **Descripción:** Obtiene el detalle de un registro de stock específico por su UUID.
- **Respuesta 200 OK / 404 Not Found**

#### `POST /api/inventario`
- **Descripción:** Registra nuevo stock o da de alta un producto en una sucursal.
- **Payload Request:**
```json
{
  "productoId": "e1a90c42-2615-46f3-a15d-318eec2e3f55",
  "sucursalId": 1,
  "cantidad": 20
}
```
- **Respuesta 201 Created**

#### `PUT /api/inventario/{id}`
- **Descripción:** Modifica las existencias disponibles (ej. decremento tras una compra).
- **Payload Request:**
```json
{
  "cantidad": 15
}
```
- **Respuesta 200 OK:** Objeto actualizado.

#### `DELETE /api/inventario/{id}`
- **Descripción:** Elimina un registro de existencias.
- **Respuesta 204 No Content**

### 1.4. Configuración de Seguridad JWT en `Program.cs`
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });
```

---

## 2. Microservicio 2: VB.NET WCF - Facturación Electrónica (SOAP)

- **Directorio:** `backend/vbnet-facturacion/`
- **Paradigma:** SOAP
- **Puerto:** `80` (HTTP) / `443` (HTTPS)
- **Protocolo:** WS-Security (UsernameToken Profile)
- **Host:** Windows Server 2025 (IIS con rol WCF activado)

### 2.1. Estructura de Carpetas
```text
backend/vbnet-facturacion/
├── App_Code/
│   ├── IFacturacion.vb
│   ├── FacturacionService.svc.vb
│   ├── Models/
│   │   ├── GenerarFacturaRequest.vb
│   │   └── GenerarFacturaResponse.vb
│   └── Security/
│       └── CustomValidator.vb
├── FacturacionService.svc
├── Web.config
└── FacturacionWcf.vbproj
```

### 2.2. Contrato de Servicio (`IFacturacion.vb`)
```vb
Imports System.ServiceModel
Imports System.Runtime.Serialization

<ServiceContract(Namespace:="http://erp.retail.com/facturacion")>
Public Interface IFacturacion

    <OperationContract>
    Function Timbrar(request As GenerarFacturaRequest) As GenerarFacturaResponse

End Interface

<DataContract(Namespace:="http://erp.retail.com/facturacion")>
Public Class GenerarFacturaRequest
    <DataMember> Public Property RfcReceptor As String
    <DataMember> Public Property RazonSocial As String
    <DataMember> Public Property MontoTotal As Decimal
    <DataMember> Public Property Subtotal As Decimal
    <DataMember> Public Property Iva As Decimal
    <DataMember> Public Property Conceptos As List(Of ConceptoItem)
End Class

<DataContract(Namespace:="http://erp.retail.com/facturacion")>
Public Class ConceptoItem
    <DataMember> Public Property Descripcion As String
    <DataMember> Public Property Cantidad As Integer
    <DataMember> Public Property PrecioUnitario As Decimal
End Class

<DataContract(Namespace:="http://erp.retail.com/facturacion")>
Public Class GenerarFacturaResponse
    <DataMember> Public Property Exitoso As Boolean
    <DataMember> Public Property UuidFolioFiscal As String
    <DataMember> Public Property SelloDigitalSAT As String
    <DataMember> Public Property XmlComprobante As String
    <DataMember> Public Property FechaTimbrado As DateTime
    <DataMember> Public Property MensajeError As String
End Class
```

### 2.3. Mensaje SOAP de Ejemplo (Petición)
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fac="http://erp.retail.com/facturacion">
   <soapenv:Header>
      <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
         <wsse:UsernameToken>
            <wsse:Username>erp_admin</wsse:Username>
            <wsse:Password>SecretWS2025!</wsse:Password>
         </wsse:UsernameToken>
      </wsse:Security>
   </soapenv:Header>
   <soapenv:Body>
      <fac:Timbrar>
         <fac:request>
            <fac:RfcReceptor>XAXX010101000</fac:RfcReceptor>
            <fac:RazonSocial>Publico General</fac:RazonSocial>
            <fac:MontoTotal>1299.99</fac:MontoTotal>
            <fac:Subtotal>1120.68</fac:Subtotal>
            <fac:Iva>179.31</fac:Iva>
            <fac:Conceptos>
               <fac:ConceptoItem>
                  <fac:Cantidad>1</fac:Cantidad>
                  <fac:Descripcion>Laptop Gamer 15 pulgadas</fac:Descripcion>
                  <fac:PrecioUnitario>1120.68</fac:PrecioUnitario>
               </fac:ConceptoItem>
            </fac:Conceptos>
         </fac:request>
      </fac:Timbrar>
   </soapenv:Body>
</soapenv:Envelope>
```

---

## 3. Microservicio 3: Java 21 JAX-WS - Procesamiento de Pagos (SOAP)

- **Directorio:** `backend/java-pagos/`
- **Paradigma:** SOAP
- **Puerto:** `8081`
- **Host:** Linux (Contenedor Docker)
- **Tecnología:** Java 21, Jakarta EE 10 / JAX-WS (Apache CXF o Metro)

### 3.1. Estructura de Carpetas
```text
backend/java-pagos/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/erp/pagos/
│       │       ├── PagosPublisher.java
│       │       ├── PagosWebService.java
│       │       ├── PagosWebServiceImpl.java
│       │       └── model/
│       │           ├── CargoRequest.java
│       │           └── CargoResponse.java
│       └── resources/
│           └── logging.properties
├── pom.xml
└── Dockerfile
```

### 3.2. Contrato de Servicio JAX-WS
```java
package com.erp.pagos;

import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.jws.WebResult;
import jakarta.jws.WebService;

@WebService(targetNamespace = "http://pagos.erp.com/")
public interface PagosWebService {

    @WebMethod(operationName = "ProcesarCargo")
    @WebResult(name = "ResultadoPago")
    CargoResponse procesarCargo(
        @WebParam(name = "NumeroTarjeta") String numeroTarjeta,
        @WebParam(name = "CVV") String cvv,
        @WebParam(name = "Monto") double monto,
        @WebParam(name = "FechaExpiracion") String fechaExpiracion
    );
}
```

### 3.3. Envelope SOAP de Respuesta
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:ProcesarCargoResponse xmlns:ns2="http://pagos.erp.com/">
      <ResultadoPago>
        <Aprobado>true</Aprobado>
        <NumeroAutorizacion>AUTH-89217462</NumeroAutorizacion>
        <CodigoRespuesta>00</CodigoRespuesta>
        <Mensaje>Transacción bancaria aprobada exitosamente</Mensaje>
        <FechaTransaccion>2026-09-13T21:20:00Z</FechaTransaccion>
      </ResultadoPago>
    </ns2:ProcesarCargoResponse>
  </soap:Body>
</soap:Envelope>
```

---

## 4. Microservicio 4: PHP 8.2 Laravel 11 - Portal de Clientes y Auth (REST)

- **Directorio:** `backend/php-clientes/`
- **Paradigma:** RESTful
- **Puerto:** `8000`
- **Base de Datos:** PostgreSQL 15 (`erp_clientes`)
- **Host:** Linux (Contenedor Docker)
- **Librería de Seguridad:** `tymon/jwt-auth`

### 4.1. Estructura de Carpetas
```text
backend/php-clientes/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   └── ClienteController.php
│   │   └── Middleware/
│   ├── Models/
│   │   └── Cliente.php
├── config/
│   └── jwt.php
├── database/
│   └── migrations/
│       └── 2026_09_13_000000_create_clientes_table.php
├── routes/
│   └── api.php
├── composer.json
└── Dockerfile
```

### 4.2. Esquema Relacional (PostgreSQL)
```sql
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    puntos_lealtad INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3. Endpoints REST

#### `POST /api/auth/login`
- **Descripción:** Valida credenciales contra PostgreSQL y emite el JWT maestro.
- **Request Body:**
```json
{
  "email": "cliente@retail.com",
  "password": "Password123!"
}
```
- **Response 200 OK:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "cliente@retail.com",
    "puntos_lealtad": 120
  }
}
```

#### `GET /api/clientes/perfil`
- **Cabeceras:** `Authorization: Bearer <jwt>`
- **Response 200 OK:** Retorna datos del usuario autenticado y saldo de puntos de lealtad.

#### `GET /api/clientes/compras`
- **Cabeceras:** `Authorization: Bearer <jwt>`
- **Response 200 OK:** Historial de compras registradas.

---

## 5. Microservicio 5: Python 3.12 FastAPI - Analítica y Predicción (REST)

- **Directorio:** `backend/python-analitica/`
- **Paradigma:** RESTful
- **Puerto:** `8001`
- **Base de Datos:** MongoDB 6.0 (`erp_analytics`)
- **Host:** Linux (Contenedor Docker)

### 5.1. Estructura de Carpetas
```text
backend/python-analitica/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models/
│   │   ├── venta.py
│   │   └── tendencia.py
│   ├── routers/
│   │   └── analitica.py
│   └── services/
│       └── predictor.py
├── requirements.txt
└── Dockerfile
```

### 5.2. Colecciones en MongoDB (`erp_analytics`)
- `ventas`: Documentos de ventas ingeridas en formato BSON.
- `predicciones`: Resultados de tendencias calculadas por SKU/Sucursal.

### 5.3. Endpoints REST

#### `POST /api/analitica/ingestar`
- **Descripción:** Ingesta masiva o individual de transacciones de venta.
- **Request Body:**
```json
[
  {
    "ventaId": "V-2026-001",
    "clienteId": 1,
    "sku": "LAP-GAM-001",
    "sucursalId": 1,
    "cantidad": 2,
    "precioTotal": 2599.98,
    "timestamp": "2026-09-13T20:15:00Z"
  }
]
```
- **Response 201 Created:** `{"status": "success", "registros_procesados": 1}`

#### `GET /api/analitica/tendencias`
- **Query Params:** `sucursalId=1&dias_horizonte=7`
- **Response 200 OK:**
```json
{
  "sucursalId": 1,
  "horizonteDias": 7,
  "predicciones": [
    {
      "sku": "LAP-GAM-001",
      "demandaEstimada": 18,
      "sugerenciaReabastecimiento": 25,
      "confianza": 0.92
    }
  ]
}
```

---

## 6. Microservicio 6: Node.js 20 Express - Notificaciones (REST)

- **Directorio:** `backend/node-notificaciones/`
- **Paradigma:** RESTful
- **Puerto:** `3000`
- **Tecnologías:** Node 20, Express, Nodemailer
- **Host:** Linux (Contenedor Docker)

### 6.1. Estructura de Carpetas
```text
backend/node-notificaciones/
├── src/
│   ├── server.js
│   ├── routes/
│   │   └── notificaciones.js
│   ├── controllers/
│   │   └── notificacionController.js
│   ├── services/
│   │   ├── mailerService.js
│   │   └── smsService.js
│   └── templates/
│       └── reciboCompra.html
├── package.json
└── Dockerfile
```

### 6.2. Endpoints REST

#### `POST /api/notificaciones/email`
- **Request Body:**
```json
{
  "destinatario": "cliente@retail.com",
  "asunto": "Confirmación de Compra - Folio AUTH-89217462",
  "clienteNombre": "Juan Pérez",
  "monto": 1299.99,
  "uuidFactura": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "xmlComprobante": "<xml>...</xml>"
}
```
- **Response 200 OK:**
```json
{
  "status": "enviado",
  "messageId": "<abcd.1234@retail.com>",
  "timestamp": "2026-09-13T21:22:00Z"
}
```

#### `POST /api/notificaciones/sms`
- **Request Body:**
```json
{
  "telefono": "+528112345678",
  "mensaje": "ERP Retail: Su compra de $1299.99 ha sido procesada con éxito."
}
```
- **Response 200 OK:** `{"status": "sms_enviado"}`

---

## 7. Infraestructura y Orquestación Docker Compose

El archivo `backend/docker-compose.yml` centraliza los 4 microservicios libres y sus 2 bases de datos sobre una red interna común:

```yaml
version: '3.8'

networks:
  erp_network:
    driver: bridge

volumes:
  pg_data:
    driver: local
  mongo_data:
    driver: local

services:
  postgres-db:
    image: postgres:15
    container_name: erp-postgres
    restart: always
    environment:
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: rootpassword
      POSTGRES_DB: erp_clientes
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    networks:
      - erp_network

  mongo-db:
    image: mongo:6.0
    container_name: erp-mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - erp_network

  php-laravel:
    build:
      context: ./php-clientes
      dockerfile: Dockerfile
    container_name: erp-php-clientes
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DB_CONNECTION=pgsql
      - DB_HOST=postgres-db
      - DB_PORT=5432
      - DB_DATABASE=erp_clientes
      - DB_USERNAME=erp_user
      - DB_PASSWORD=rootpassword
      - JWT_SECRET=ClaveSecretaCompartidaERPRetail2026!
    depends_on:
      - postgres-db
    networks:
      - erp_network

  python-fastapi:
    build:
      context: ./python-analitica
      dockerfile: Dockerfile
    container_name: erp-python-analitica
    restart: always
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongo-db:27017
      - MONGO_DB=erp_analytics
      - JWT_SECRET=ClaveSecretaCompartidaERPRetail2026!
    depends_on:
      - mongo-db
    networks:
      - erp_network

  node-express:
    build:
      context: ./node-notificaciones
      dockerfile: Dockerfile
    container_name: erp-node-notificaciones
    restart: always
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - SMTP_HOST=smtp.mailtrap.io
      - SMTP_PORT=2525
    networks:
      - erp_network

  java-soap:
    build:
      context: ./java-pagos
      dockerfile: Dockerfile
    container_name: erp-java-pagos
    restart: always
    ports:
      - "8081:8081"
    networks:
      - erp_network
```

---

## 8. Guía de Despliegue de Servicios Propietarios (IIS)

1. **C# .NET 10 (Puerto 5084):**
   - Instalar *.NET Core Hosting Bundle* en Windows Server 2025.
   - Publicar el proyecto: `dotnet publish -c Release -o C:\inetpub\wwwroot\erp-inventario`.
   - Crear Application Pool sin código administrado (*No Managed Code*) y asignar el puerto `5084`.
2. **VB.NET WCF (Puertos 80 / 443):**
   - Activar la característica de Windows: *WCF Services -> HTTP Activation*.
   - Publicar la solución WCF en `C:\inetpub\wwwroot\erp-facturacion`.
   - Configurar el binding con certificado SSL para WS-Security.
