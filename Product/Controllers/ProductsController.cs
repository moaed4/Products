using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Product.Data;
using ProductApp.Models;
using System.Linq;

namespace ProductApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ProductContext _context;

        public ProductsController(ProductContext context)
        {
            _context = context;
        }

        // GET: api/Productss
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            int page = 1,
            int pageSize = 100,
            string sortColumn = "Name",
            string sortOrder = "asc",
            string search = "",
            string category = "",
            decimal? minPrice = null,
            decimal? maxPrice = null)
        {
            try
            {
                // Base query
                var query = _context.Products.AsQueryable();

                // Search filter
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p =>
                        p.Name.Contains(search) ||
                        p.Description.Contains(search) ||
                        (p.Category != null && p.Category.Contains(search)) ||
                        (p.Manufacturer != null && p.Manufacturer.Contains(search)));
                }

                // Category filter
                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(p => p.Category == category);
                }

                // Price range filter
                if (minPrice.HasValue)
                {
                    query = query.Where(p => p.Price >= minPrice.Value);
                }

                if (maxPrice.HasValue)
                {
                    query = query.Where(p => p.Price <= maxPrice.Value);
                }

                // Sorting
                query = sortOrder.ToLower() == "desc" ?
                    SortByDescending(query, sortColumn) :
                    SortByAscending(query, sortColumn);

                // Total count before pagination
                var totalCount = await query.CountAsync();

                // Pagination
                var Products = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Return response with pagination metadata
                var response = new
                {
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    Data = Products
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private IQueryable<Products> SortByAscending(IQueryable<Products> query, string sortColumn)
        {
            switch (sortColumn.ToLower())
            {
                case "name":
                    return query.OrderBy(p => p.Name);
                case "description":
                    return query.OrderBy(p => p.Description);
                case "price":
                    return query.OrderBy(p => p.Price);
                case "stockquantity":
                    return query.OrderBy(p => p.StockQuantity);
                case "category":
                    return query.OrderBy(p => p.Category);
                case "manufacturer":
                    return query.OrderBy(p => p.Manufacturer);
                default:
                    return query.OrderBy(p => p.Name);
            }
        }

        private IQueryable<Products> SortByDescending(IQueryable<Products> query, string sortColumn)
        {
            switch (sortColumn.ToLower())
            {
                case "name":
                    return query.OrderByDescending(p => p.Name);
                case "description":
                    return query.OrderByDescending(p => p.Description);
                case "price":
                    return query.OrderByDescending(p => p.Price);
                case "stockquantity":
                    return query.OrderByDescending(p => p.StockQuantity);
                case "category":
                    return query.OrderByDescending(p => p.Category);
                case "manufacturer":
                    return query.OrderByDescending(p => p.Manufacturer);
                default:
                    return query.OrderByDescending(p => p.Name);
            }
        }

        // GET: api/Productss/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Products>> GetProduct(int id)
        {
            var Products = await _context.Products.FindAsync(id);

            if (Products == null)
            {
                return NotFound();
            }

            return Products;
        }

        // PUT: api/Productss/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Products Products)
        {
            if (id != Products.Id)
            {
                return BadRequest();
            }

            _context.Entry(Products).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductsExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Productss
        [HttpPost]
        public async Task<ActionResult<Products>> PostProducts(Products Products)
        {
            _context.Products.Add(Products);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProducts", new { id = Products.Id }, Products);
        }

        // DELETE: api/Productss/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducts(int id)
        {
            var Products = await _context.Products.FindAsync(id);
            if (Products == null)
            {
                return NotFound();
            }

            _context.Products.Remove(Products);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Productss/Categories
        [HttpGet("Categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            return await _context.Products
                .Select(p => p.Category)
                .Distinct()
                .ToListAsync();
        }

        private bool ProductsExists(int id)
        {
            return _context.Products.Any(e => e.Id == id);
        }
    }
}