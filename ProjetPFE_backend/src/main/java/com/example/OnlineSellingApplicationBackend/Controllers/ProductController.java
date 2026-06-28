
        package com.example.OnlineSellingApplicationBackend.Controllers;
import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Services.ProductService;
import com.example.OnlineSellingApplicationBackend.entities.Produits;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/Products")
public class ProductController {
    @Autowired
    private ProductService productService;
    @Autowired
    private ObjectMapper objectMapper;
    @GetMapping
    public ResponseEntity<List<ProduitAdminDTO>> getAllProducts() {
        List<ProduitAdminDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }
    @GetMapping("/available")
    public ResponseEntity<List<ProduitAdminDTO>> getAllAvailableProducts() {
        List<ProduitAdminDTO> products = productService.getAllAvailableProducts();
        return ResponseEntity.ok(products);
    }
    @GetMapping("/{id}")
    public ResponseEntity<ProduitAdminDTO> getProductDetails(@PathVariable Long id) {
        ProduitAdminDTO product = productService.getProductDetails(id);
        return ResponseEntity.ok(product);
    }
    @GetMapping("/recent")
    public ResponseEntity<List<ProduitAdminDTO>> getRecentProducts() {
        List<ProduitAdminDTO> products = productService.getRecentProducts();
        return ResponseEntity.ok(products);
    }
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProductAndItsCategories(
            @PathVariable Long id,
            @RequestPart("product") String productJson,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos) {

        try {
            ProductCreateUpdateRequest request = objectMapper.readValue(productJson, ProductCreateUpdateRequest.class);
            ProductUpdateCategoriesResponse response = productService.updateProductAndItsCategories(id, request, photos);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        }
    }
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            @RequestPart("product") String productJson,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos) {

        try {
            ProductCreateUpdateRequest request = objectMapper.readValue(productJson, ProductCreateUpdateRequest.class);
            Produits createdProduct = productService.createProductWithCategories(request, photos);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        }
    }
    @GetMapping("/distribution")
    public ResponseEntity<List<CategoryDistributionDTO>> getCategoryDistribution() {
        List<CategoryDistributionDTO> distribution = productService.getCategoryDistribution();
        return ResponseEntity.ok(distribution);
    }
    @GetMapping("/stats")
    public ResponseEntity<ProductStatsDTO> getProductStats() {
        ProductStatsDTO stats = productService.getProductStats();
        return ResponseEntity.ok(stats);
    }
    @GetMapping("/sales")
    public ResponseEntity<List<SalesDataDTO>> getSalesData(
            @RequestParam String range,
            @RequestParam(required = false) String timezone) {
        return ResponseEntity.ok(productService.getSalesData(range));
    }
    @GetMapping("/{id}/reviews")
    public ResponseEntity<?> getProductReviews(@PathVariable Long id) {
        try {
            List<ReviewDTO> reviews = productService.getProductReviews(id);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}