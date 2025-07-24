using Microsoft.EntityFrameworkCore;
using ProductApp.Models;

namespace Product.Data
{
    public class ProductContext : DbContext
    {
        public ProductContext(DbContextOptions<ProductContext> options) : base(options) { }

        public DbSet<Products> Products { get; set; }
    }
}
