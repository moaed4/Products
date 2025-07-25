using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Product.Data;
using ProductApp.Models;
using System.Linq;
using System.Threading.Tasks;

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

        // GET: api/Products
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            int page = 1,
            int pageSize = 100,
            string sortColumn = "Name",
            string sortOrder = "asc",
            string search = "",
            string category = "",
            decimal? minPrice = null,
            decimal? maxPrice = null,
            bool? isActive = null,
            bool includeDeleted = false)
        {
            try
            {
                // Base query - exclude deleted items by default
                var query = _context.Products.AsQueryable();

                if (!includeDeleted)
                {
                    query = query.Where(p => !p.IsDeleted);
                }

                // Apply filters
                query = ApplyFilters(query, search, category, minPrice, maxPrice, isActive);

                // Get total count before pagination
                var totalCount = await query.CountAsync();

                // Apply sorting
                query = ApplySorting(query, sortColumn, sortOrder);

                // Apply pagination
                var products = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Return response with pagination metadata
                return Ok(new
                {
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    Data = products
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Products/Stats/Summary
        [HttpGet("Stats/Summary")]
        public async Task<IActionResult> GetProductsSummary(bool includeDeleted = false)
        {
            try
            {
                var query = _context.Products.AsQueryable();

                if (!includeDeleted)
                {
                    query = query.Where(p => !p.IsDeleted);
                }

                var stats = await query
                    .GroupBy(x => 1) // Single group for all products
                    .Select(g => new
                    {
                        TotalProducts = g.Count(),
                        ActiveProducts = g.Count(p => p.IsActive),
                        InactiveProducts = g.Count(p => !p.IsActive),
                        DeletedProducts = g.Count(p => p.IsDeleted),
                        TotalValue = g.Sum(p => p.Price * p.StockQuantity),
                        TotalStock = g.Sum(p => p.StockQuantity),
                        TotalCategories = g.Select(p => p.Category).Distinct().Count()
                    })
                    .FirstOrDefaultAsync();

                return Ok(stats ?? new
                {
                    TotalProducts = 0,
                    ActiveProducts = 0,
                    InactiveProducts = 0,
                    DeletedProducts = 0,
                    TotalValue = 0m,
                    TotalStock = 0,
                    TotalCategories = 0
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Products/Stats/ByCategory
        [HttpGet("Stats/ByCategory")]
        public async Task<IActionResult> GetStatsByCategory(bool includeDeleted = false)
        {
            try
            {
                var query = _context.Products.AsQueryable();

                if (!includeDeleted)
                {
                    query = query.Where(p => !p.IsDeleted);
                }

                var categoryStats = await query
                    .GroupBy(p => p.Category)
                    .Select(g => new
                    {
                        Category = g.Key,
                        Count = g.Count(),
                        ActiveCount = g.Count(p => p.IsActive),
                        InactiveCount = g.Count(p => !p.IsActive),
                        TotalValue = g.Sum(p => p.Price * p.StockQuantity),
                        TotalStock = g.Sum(p => p.StockQuantity),
                        AvgPrice = g.Average(p => p.Price)
                    })
                    .OrderByDescending(x => x.TotalValue)
                    .ToListAsync();

                return Ok(categoryStats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Products/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Products>> GetProduct(int id, bool includeDeleted = false)
        {
            var query = _context.Products.AsQueryable();

            if (!includeDeleted)
            {
                query = query.Where(p => !p.IsDeleted);
            }

            var product = await query.FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }
            return product;
        }

        // PUT: api/Products/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Products product)
        {
            if (id != product.Id)
            {
                return BadRequest();
            }

            // Prevent modifying IsDeleted through this endpoint
            var existingProduct = await _context.Products.FindAsync(id);
            if (existingProduct == null)
            {
                return NotFound();
            }

            // Preserve the IsDeleted and IsActive status unless explicitly changed
            product.IsDeleted = existingProduct.IsDeleted;
            product.IsActive = existingProduct.IsActive;

            _context.Entry(existingProduct).CurrentValues.SetValues(product);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
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

        // POST: api/Products
        [HttpPost]
        public async Task<ActionResult<Products>> PostProduct(Products product)
        {
            // Ensure new products are active and not deleted by default
            product.IsActive = true;
            product.IsDeleted = false;

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProduct", new { id = product.Id }, product);
        }

        // DELETE: api/Products/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            // Soft delete instead of removing
            product.IsDeleted = true;
            product.IsActive = false;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/Products/5/Restore
        [HttpPatch("{id}/Restore")]
        public async Task<IActionResult> RestoreProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            product.IsDeleted = false;
            product.IsActive = true;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/Products/5/SetActive
        [HttpPatch("{id}/SetActive")]
        public async Task<IActionResult> SetProductActiveStatus(int id, [FromBody] bool isActive)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            product.IsActive = isActive;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Products/Categories
        [HttpGet("Categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories(bool includeDeleted = false)
        {
            var query = _context.Products.AsQueryable();

            if (!includeDeleted)
            {
                query = query.Where(p => !p.IsDeleted);
            }

            return await query
                .Select(p => p.Category)
                .Distinct()
                .ToListAsync();
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.Id == id);
        }

        private IQueryable<Products> ApplyFilters(
            IQueryable<Products> query,
            string search,
            string category,
            decimal? minPrice,
            decimal? maxPrice,
            bool? isActive)
        {
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p =>
                    p.Name.Contains(search) ||
                    p.Description.Contains(search) ||
                    (p.Category != null && p.Category.Contains(search)));
            }

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(p => p.Category == category);
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(p => p.IsActive == isActive.Value);
            }

            return query;
        }

        private IQueryable<Products> ApplySorting(
            IQueryable<Products> query,
            string sortColumn,
            string sortOrder)
        {
            return (sortColumn.ToLower(), sortOrder.ToLower()) switch
            {
                ("name", "desc") => query.OrderByDescending(p => p.Name),
                ("description", "asc") => query.OrderBy(p => p.Description),
                ("description", "desc") => query.OrderByDescending(p => p.Description),
                ("price", "asc") => query.OrderBy(p => p.Price),
                ("price", "desc") => query.OrderByDescending(p => p.Price),
                ("stockquantity", "asc") => query.OrderBy(p => p.StockQuantity),
                ("stockquantity", "desc") => query.OrderByDescending(p => p.StockQuantity),
                ("category", "asc") => query.OrderBy(p => p.Category),
                ("category", "desc") => query.OrderByDescending(p => p.Category),
                ("isactive", "asc") => query.OrderBy(p => p.IsActive),
                ("isactive", "desc") => query.OrderByDescending(p => p.IsActive),
                _ => query.OrderBy(p => p.Name) // Default sort
            };
        }
    }
}