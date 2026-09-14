using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace InventarioApi.Models
{
    public class Producto
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 1000000.00)]
        public decimal Precio { get; set; }

        [Required]
        [MaxLength(50)]
        public string SKU { get; set; } = string.Empty;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public ICollection<Inventario> Inventarios { get; set; } = new List<Inventario>();
    }
}
