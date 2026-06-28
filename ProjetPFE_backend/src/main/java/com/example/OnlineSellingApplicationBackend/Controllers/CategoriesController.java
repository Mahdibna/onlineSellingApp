package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Services.CategoriesService;
import com.example.OnlineSellingApplicationBackend.entities.Categories;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoriesController {

    @Autowired
    private CategoriesService categoriesService;

    @PostMapping
    public ResponseEntity<?> addCategory(
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            Categories category = new Categories();
            category.setNom(name);
            category.setDescription(description);

            if (image != null && !image.isEmpty()) {
                String imagePath = saveImage(image);
                category.setPhoto(imagePath);
            }

            Categories createdCategory = categoriesService.addCategory(category, parentId);
            return ResponseEntity.ok(createdCategory);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to create category: " + ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            Long processedParentId = (parentId != null && parentId == 0L) ? null : parentId;

            updateCategoryParent updatedCategory = new updateCategoryParent();
            updatedCategory.setName(name);
            updatedCategory.setDescription(description);
            updatedCategory.setParentId(processedParentId);

            if (image != null && !image.isEmpty()) {
                String imagePath = saveImage(image);
                updatedCategory.setPhoto(imagePath);
            }

            Categories modifiedCategory = categoriesService.modiferCategory(id, updatedCategory);
            return ResponseEntity.ok(modifiedCategory);

        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Category or Parent not found: " + ex.getMessage()));
        }
    }

    private String saveImage(MultipartFile image) {
        try {
            String uploadDir = "uploads/categories";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(image.getInputStream(), filePath);

            return uploadDir + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean deleteSubCategories) {
        try {
            System.out.println("Delete request received: id=" + id + ", deleteSubCategories=" + deleteSubCategories);
            categoriesService.deleteCategory(id, deleteSubCategories);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Category deleted successfully");
            response.put("deletedId", id);
            response.put("deleteSubCategories", deleteSubCategories);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            System.out.println("Entity not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Category not found: " + e.getMessage()));
        } catch (IllegalStateException e) {
            System.out.println("Cannot delete category: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            System.out.println("Error deleting category: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error deleting category: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategory(@PathVariable Long id) {
        try {
            CategoryResponse category = categoriesService.getCategory(id);
            return ResponseEntity.ok(category);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Category not found: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        List<Categories> categories = categoriesService.getCategoriesWithSubCategories();
        List<CategoryResponse> response = categories.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    private SubCategoryResponse convertToSubResponse(Categories category) {
        return new SubCategoryResponse(
                category.getId(),
                category.getNom(),
                category.getDescription(),
                category.getPhoto(),
                category.getSubCategories().stream()
                        .map(this::convertToSubResponse)
                        .collect(Collectors.toList())
        );
    }

    private CategoryResponse convertToResponse(Categories category) {
        return new CategoryResponse(
                category.getId(),
                category.getNom(),
                category.getDescription(),
                category.getPhoto(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getSubCategories().stream()
                        .map(this::convertToSubResponse)
                        .collect(Collectors.toList())
        );
    }

    @DeleteMapping("/{categoryId}/products/{productId}")
    public ResponseEntity<?> removeProductFromCategory(
            @PathVariable Long categoryId,
            @PathVariable Long productId) {
        try {
            categoriesService.removeProductFromCategory(categoryId, productId);
            return ResponseEntity.ok(new SuccessResponse("Product successfully removed from category"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to remove product from category: " + e.getMessage()));
        }
    }

    @GetMapping("/products/{categoryId}")
    public ResponseEntity<List<ProduitAdminDTO>> getProductsByCategory(@PathVariable Long categoryId) {
        List<ProduitAdminDTO> products = categoriesService.findProductsByCategoryId(categoryId);
        if (products.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(products);
    }

    // Helper classes for consistent response structure
    private static class ErrorResponse {
        private final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }

    private static class SuccessResponse {
        private final String message;

        public SuccessResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}