using System;
using InventarioApi.Models;
using Microsoft.EntityFrameworkCore;

namespace InventarioApi.Data
{
    public class InventarioDbContext : DbContext
    {
        public InventarioDbContext(DbContextOptions<InventarioDbContext> options)
            : base(options)
        {
        }

        public DbSet<Producto> Productos => Set<Producto>();
        public DbSet<Inventario> Inventarios => Set<Inventario>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Producto>()
                .HasIndex(p => p.SKU)
                .IsUnique();

            modelBuilder.Entity<Inventario>()
                .HasOne(i => i.Producto)
                .WithMany(p => p.Inventarios)
                .HasForeignKey(i => i.ProductoId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
