using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventarioApi.Models
{
    public class Inventario
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ProductoId { get; set; }

        [ForeignKey("ProductoId")]
        public Producto? Producto { get; set; }

        [Required]
        public int SucursalId { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Cantidad { get; set; }

        public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;
    }
}
