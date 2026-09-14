using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InventarioApi.Data;
using InventarioApi.Models;
using InventarioApi.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventarioApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly InventarioDbContext _context;

        public InventarioController(InventarioDbContext context)
        {
            _context = context;
        }

        // GET: /api/inventario
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InventarioItemDto>>> GetInventarios([FromQuery] int? sucursalId)
        {
            var query = _context.Inventarios.Include(i => i.Producto).AsQueryable();

            if (sucursalId.HasValue)
            {
                query = query.Where(i => i.SucursalId == sucursalId.Value);
            }

            var items = await query.Select(i => new InventarioItemDto
            {
                Id = i.Id,
                ProductoId = i.ProductoId,
                ProductoNombre = i.Producto != null ? i.Producto.Nombre : "Desconocido",
                Sku = i.Producto != null ? i.Producto.SKU : "",
                Precio = i.Producto != null ? i.Producto.Precio : 0,
                SucursalId = i.SucursalId,
                Cantidad = i.Cantidad,
                UltimaActualizacion = i.UltimaActualizacion
            }).ToListAsync();

            return Ok(items);
        }

        // GET: /api/inventario/{id}
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<InventarioItemDto>> GetInventarioById(Guid id)
        {
            var item = await _context.Inventarios
                .Include(i => i.Producto)
                .Where(i => i.Id == id)
                .Select(i => new InventarioItemDto
                {
                    Id = i.Id,
                    ProductoId = i.ProductoId,
                    ProductoNombre = i.Producto != null ? i.Producto.Nombre : "Desconocido",
                    Sku = i.Producto != null ? i.Producto.SKU : "",
                    Precio = i.Producto != null ? i.Producto.Precio : 0,
                    SucursalId = i.SucursalId,
                    Cantidad = i.Cantidad,
                    UltimaActualizacion = i.UltimaActualizacion
                })
                .FirstOrDefaultAsync();

            if (item == null)
            {
                return NotFound(new { mensaje = $"No se encontró registro de inventario con ID {id}" });
            }

            return Ok(item);
        }

        // POST: /api/inventario
        [HttpPost]
        public async Task<ActionResult<InventarioItemDto>> CrearInventario([FromBody] CrearInventarioDto dto)
        {
            var productoExiste = await _context.Productos.AnyAsync(p => p.Id == dto.ProductoId);
            if (!productoExiste)
            {
                return BadRequest(new { mensaje = "El ProductoId especificado no existe." });
            }

            var nuevo = new Inventario
            {
                ProductoId = dto.ProductoId,
                SucursalId = dto.SucursalId,
                Cantidad = dto.Cantidad,
                UltimaActualizacion = DateTime.UtcNow
            };

            _context.Inventarios.Add(nuevo);
            await _context.SaveChangesAsync();

            return await GetInventarioById(nuevo.Id);
        }

        // PUT: /api/inventario/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> ActualizarStock(Guid id, [FromBody] ActualizarStockDto dto)
        {
            var inventario = await _context.Inventarios.FindAsync(id);
            if (inventario == null)
            {
                return NotFound(new { mensaje = $"Inventario con ID {id} no encontrado." });
            }

            inventario.Cantidad = dto.Cantidad;
            inventario.UltimaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Stock actualizado correctamente",
                inventarioId = inventario.Id,
                nuevaCantidad = inventario.Cantidad,
                ultimaActualizacion = inventario.UltimaActualizacion
            });
        }

        // DELETE: /api/inventario/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> EliminarInventario(Guid id)
        {
            var inventario = await _context.Inventarios.FindAsync(id);
            if (inventario == null)
            {
                return NotFound(new { mensaje = $"Inventario con ID {id} no encontrado." });
            }

            _context.Inventarios.Remove(inventario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: /api/inventario/productos (Catálogo de productos)
        [HttpGet("productos")]
        public async Task<ActionResult<IEnumerable<Producto>>> GetProductos()
        {
            var productos = await _context.Productos.ToListAsync();
            return Ok(productos);
        }

        // POST: /api/inventario/productos (Dar de alta nuevo producto)
        [HttpPost("productos")]
        public async Task<ActionResult<Producto>> CrearProducto([FromBody] CrearProductoDto dto)
        {
            if (await _context.Productos.AnyAsync(p => p.SKU == dto.SKU))
            {
                return Conflict(new { mensaje = $"Ya existe un producto con el SKU {dto.SKU}" });
            }

            var nuevoProducto = new Producto
            {
                Nombre = dto.Nombre,
                Precio = dto.Precio,
                SKU = dto.SKU,
                FechaCreacion = DateTime.UtcNow
            };

            _context.Productos.Add(nuevoProducto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProductos), new { id = nuevoProducto.Id }, nuevoProducto);
        }
    }
}
