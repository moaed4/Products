using System.ComponentModel.DataAnnotations;

namespace ProductApp.Models
{

    public class Products
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required, Range(0.01, 1000000)]
        public decimal Price { get; set; }

        [Required, Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        [Required, StringLength(50)]
        public string Category { get; set; } = string.Empty;

       

    }

   
}