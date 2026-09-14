using System.Text;
using InventarioApi.Data;
using InventarioApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Configurar puerto 5084 según especificación técnica
builder.WebHost.UseUrls("http://*:5084");

// 1. Configuración de Base de Datos (In-Memory por defecto o SQL Server si se configura)
builder.Services.AddDbContext<InventarioDbContext>(options =>
{
    var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
    // Usar InMemory para portabilidad inmediata y desarrollo ágil
    options.UseInMemoryDatabase("ErpInventarioDb");
});

// 2. Configuración de CORS para el Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. Configuración de Autenticación JWT (Validación con clave compartida de PHP Laravel)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ClaveSecretaCompartidaERPRetail2026!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// 4. Semilla de datos en memoria para pruebas
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<InventarioDbContext>();
    if (!context.Productos.Any())
    {
        var prod1 = new Producto { Nombre = "Laptop Gamer Asus TUF 15.6", Precio = 1299.99m, SKU = "LAP-ASUS-001" };
        var prod2 = new Producto { Nombre = "Monitor Curvo Samsung 27 144Hz", Precio = 289.50m, SKU = "MON-SAM-002" };
        var prod3 = new Producto { Nombre = "Teclado Mecánico RGB Switch Blue", Precio = 75.00m, SKU = "TEC-MEC-003" };

        context.Productos.AddRange(prod1, prod2, prod3);
        context.SaveChanges();

        context.Inventarios.AddRange(
            new Inventario { ProductoId = prod1.Id, SucursalId = 1, Cantidad = 15 },
            new Inventario { ProductoId = prod1.Id, SucursalId = 2, Cantidad = 8 },
            new Inventario { ProductoId = prod2.Id, SucursalId = 1, Cantidad = 30 },
            new Inventario { ProductoId = prod2.Id, SucursalId = 2, Cantidad = 12 },
            new Inventario { ProductoId = prod3.Id, SucursalId = 1, Cantidad = 50 },
            new Inventario { ProductoId = prod3.Id, SucursalId = 2, Cantidad = 25 }
        );
        context.SaveChanges();
    }
}

app.Run();
