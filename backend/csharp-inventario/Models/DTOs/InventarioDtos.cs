using System;
using System.ComponentModel.DataAnnotations;

namespace InventarioApi.Models.DTOs
{
    public class InventarioItemDto
    {
        public Guid Id { get; set; }
        public Guid ProductoId { get; set; }
        public string ProductoNombre { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public int SucursalId { get; set; }
        public int Cantidad { get; set; }
        public DateTime UltimaActualizacion { get; set; }
    }

    public class CrearInventarioDto
    {
        [Required]
        public Guid ProductoId { get; set; }

        [Required]
        public int SucursalId { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Cantidad { get; set; }
    }

    public class ActualizarStockDto
    {
        [Required]
        [Range(0, int.MaxValue)]
        public int Cantidad { get; set; }
    }

    public class CrearProductoDto
    {
        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public decimal Precio { get; set; }

        [Required]
        [MaxLength(50)]
        public string SKU { get; set; } = string.Empty;
    }
}
