package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Repositories.CategoriesRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.CommandeRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ProduitsRepository;
import com.example.OnlineSellingApplicationBackend.entities.Categories;
import com.example.OnlineSellingApplicationBackend.entities.Note;
import com.example.OnlineSellingApplicationBackend.entities.Produits;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {
    @Autowired
    private ProduitsRepository produitRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ProduitsRepository produitsRepository;

    @Autowired
    private CommandeRepository commandeRepository;

    private String saveProductImage(MultipartFile file) throws IOException {
        String uploadDir = Paths.get("uploads/products").toAbsolutePath().toString();
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = UUID.randomUUID() + "_" +
                Objects.requireNonNull(file.getOriginalFilename()).replace(" ", "_");
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        return "products/" + fileName;
    }

    private void deleteProductPhotos(Set<String> photos) {
        if (photos == null || photos.isEmpty()) return;

        for (String photoPath : photos) {
            try {
                Path path = Paths.get("uploads", photoPath);
                if (Files.exists(path)) {
                    Files.delete(path);
                }
            } catch (IOException e) {
                System.err.println("Failed to delete product image: " + photoPath);
            }
        }
    }

    @Transactional
    public List<ProduitAdminDTO> getRecentProducts() {
        int limit = 10; // or whatever number you want
        Pageable pageable = PageRequest.of(0, limit);
        return produitRepository.findRecentWithRatings(pageable).stream()
                .map(produit -> {
                    return new ProduitAdminDTO(
                            produit.getId(),
                            produit.isDisponibilite(),
                            produit.getNom(),
                            produit.getDescription(),
                            produit.getPhotos(),
                            produit.getQuantite(),
                            produit.getPrix(),
                            produit.getPromotionPartenaire(),
                            produit.getPromotionParticulier(),
                            null, // Use DTOs instead of entities
                            calculateAverageRating(produit.getNotes()),
                            produit.getReference()
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ProduitAdminDTO getProductDetails(Long id) {
        Produits produit = produitRepository.findProduct(id);
        return new ProduitAdminDTO(
                produit.getId(),
                produit.isDisponibilite(),
                produit.getNom(),
                produit.getDescription(),
                produit.getPhotos(),
                produit.getQuantite(),
                produit.getPrix(),
                produit.getPromotionPartenaire(),
                produit.getPromotionParticulier(),
                null,
                calculateAverageRating(produit.getNotes()),
                produit.getReference()
        );
    }

    @Transactional
    public List<ProduitAdminDTO> getAllProducts() {
        return produitRepository.findAllWithRatings().stream()
                .map(produit -> {
                    Set<CategoryDTO> categoryDTOs = produit.getCategories().stream()
                            .map(category -> new CategoryDTO(
                                    category.getId(),
                                    category.getNom(),
                                    category.getDescription(),
                                    category.getPhoto()
                            ))
                            .collect(Collectors.toSet());

                    return new ProduitAdminDTO(
                            produit.getId(),
                            produit.isDisponibilite(),
                            produit.getNom(),
                            produit.getDescription(),
                            produit.getPhotos(),
                            produit.getQuantite(),
                            produit.getPrix(),
                            produit.getPromotionPartenaire(),
                            produit.getPromotionParticulier(),
                            categoryDTOs,
                            calculateAverageRating(produit.getNotes()),
                            produit.getReference()
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional // Keep session open for lazy loading
    public List<ProduitAdminDTO> getAllAvailableProducts() {
        return produitRepository.findAvailableProducts().stream()
                .map(produit -> {
                    Set<CategoryDTO> categoryDTOs = produit.getCategories().stream()
                            .map(category -> new CategoryDTO(
                                    category.getId(),
                                    category.getNom(),
                                    category.getDescription(),
                                    category.getPhoto()
                            ))
                            .collect(Collectors.toSet());

                    return new ProduitAdminDTO(
                            produit.getId(),
                            produit.isDisponibilite(),
                            produit.getNom(),
                            produit.getDescription(),
                            produit.getPhotos(),
                            produit.getQuantite(),
                            produit.getPrix(),
                            produit.getPromotionPartenaire(),
                            produit.getPromotionParticulier(),
                            categoryDTOs,
                            calculateAverageRating(produit.getNotes()),
                            produit.getReference()
                    );
                })
                .collect(Collectors.toList());
    }

    private Double calculateAverageRating(Set<Note> notes) {
        if (notes == null || notes.isEmpty()) {
            return null;
        }
        return notes.stream()
                .mapToInt(Note::getRating)
                .average()
                .orElse(0.0);
    }

    public ProductUpdateCategoriesResponse updateProductAndItsCategories(Long productId, ProductCreateUpdateRequest request, List<MultipartFile> photos) throws IOException {
        ProductUpdateCategoriesResponse response = new ProductUpdateCategoriesResponse();
        response.setProductId(productId);

        try {
            Produits product = produitRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            product.setDescription(request.getDescription());
            product.setNom(request.getNom());
            product.setPromotionPartenaire(request.getPromotionPartenaire());
            product.setPromotionParticulier(request.getPromotionParticulier());
            product.setSelection(request.getSelection());
            product.setQuantite(request.getQuantite());
            product.setPrix(request.getPrix());
            product.setDisponibilite(request.isDisponibilite());
            if (request.getReference() != null && !request.getReference().isEmpty()) {
                product.setReference(request.getReference());
            }
            if (request.getPhoto() != null) {
                product.setPhoto(new HashSet<>(request.getPhoto()));
                if (photos != null && !photos.isEmpty()) {
                    Set<String> newPhotoPaths = photos.stream()
                            .map(file -> {
                                try {
                                    return saveProductImage(file);
                                } catch (IOException e) {
                                    throw new RuntimeException("Failed to save product image: " + e.getMessage());
                                }
                            })
                            .collect(Collectors.toSet());
                    Set<String> updatedPhotos = new HashSet<>(product.getPhotos());
                    updatedPhotos.addAll(newPhotoPaths);
                    product.setPhoto(updatedPhotos);
                }
            } else if (photos != null && !photos.isEmpty()) {
                Set<String> newPhotoPaths = photos.stream()
                        .map(file -> {
                            try {
                                return saveProductImage(file);
                            } catch (IOException e) {
                                throw new RuntimeException("Failed to save product image: " + e.getMessage());
                            }
                        })
                        .collect(Collectors.toSet());
                product.setPhoto(newPhotoPaths);
            }
            Set<Long> incomingIds = Optional.ofNullable(request.getCategoryIds())
                    .orElseGet(HashSet::new);

            if (incomingIds.isEmpty()) {
                product.getCategories().clear();
            } else {
                List<Categories> categories = categoriesRepository.findAllById(incomingIds);

                if (categories.size() != incomingIds.size()) {
                    Set<Long> foundIds = categories.stream()
                            .map(Categories::getId)
                            .collect(Collectors.toSet());
                    incomingIds.removeAll(foundIds);
                    throw new ResourceNotFoundException("Missing categories: " + incomingIds);
                }

                Map<Long, Set<Long>> categoryAncestors = new HashMap<>();
                for (Categories category : categories) {
                    Set<Long> ancestors = new HashSet<>();
                    Categories current = category;
                    while (current != null) {
                        ancestors.add(current.getId());
                        current = current.getParent();
                    }
                    categoryAncestors.put(category.getId(), ancestors);
                }

                Set<Long> excludedCategoryIds = new HashSet<>();
                for (Long categoryId : incomingIds) {
                    for (Long otherCategoryId : incomingIds) {
                        if (categoryId.equals(otherCategoryId)) continue;
                        Set<Long> otherAncestors = categoryAncestors.get(otherCategoryId);
                        if (otherAncestors.contains(categoryId)) {
                            excludedCategoryIds.add(categoryId);
                            break;
                        }
                    }
                }

                Set<Long> finalCategoryIds = incomingIds.stream()
                        .filter(id -> !excludedCategoryIds.contains(id))
                        .collect(Collectors.toSet());

                Set<Categories> finalCategories = categories.stream()
                        .filter(c -> finalCategoryIds.contains(c.getId()))
                        .collect(Collectors.toSet());

                product.setCategories(finalCategories);
            }

            produitRepository.save(product);

            product.getCategories().forEach(category ->
                    response.getAddedCategories().add(
                            new CategoryMessage(category.getId(), category.getNom())
                    ));

        } catch (ResourceNotFoundException e) {
            response.setError(e.getMessage());
        }
        return response;
    }

    public Produits createProductWithCategories(ProductCreateUpdateRequest request, List<MultipartFile> photos) {
        Set<Long> incomingCategoryIds = Optional.ofNullable(request.getCategoryIds())
                .orElse(Collections.emptySet());

        Produits product = new Produits();
        product.setNom(request.getNom());
        product.setDescription(request.getDescription());
        product.setPromotionPartenaire(request.getPromotionPartenaire());
        product.setPromotionParticulier(request.getPromotionParticulier());
        product.setSelection(request.getSelection());
        product.setQuantite(request.getQuantite());
        product.setPrix(request.getPrix());
        product.setDisponibilite(request.isDisponibilite());

        if (request.getReference() != null && !request.getReference().isEmpty()) {
            product.setReference(request.getReference());
        }

        if (photos != null && !photos.isEmpty()) {
            Set<String> photoPaths = photos.stream()
                    .map(file -> {
                        try {
                            return saveProductImage(file);
                        } catch (IOException e) {
                            throw new RuntimeException("Failed to save product image: " + e.getMessage());
                        }
                    })
                    .collect(Collectors.toSet());
            product.setPhoto(photoPaths);
        }
        if (!incomingCategoryIds.isEmpty()) {
            List<Categories> categories = categoriesRepository.findAllById(incomingCategoryIds);

            if (categories.size() != incomingCategoryIds.size()) {
                Set<Long> foundIds = categories.stream()
                        .map(Categories::getId)
                        .collect(Collectors.toSet());
                Set<Long> missingIds = incomingCategoryIds.stream()
                        .filter(id -> !foundIds.contains(id))
                        .collect(Collectors.toSet());
                throw new ResourceNotFoundException("Categories not found: " + missingIds);
            }

            Map<Long, Set<Long>> categoryAncestors = new HashMap<>();
            for (Categories category : categories) {
                Set<Long> ancestors = new HashSet<>();
                Categories current = category;
                while (current != null) {
                    ancestors.add(current.getId());
                    current = current.getParent();
                }
                categoryAncestors.put(category.getId(), ancestors);
            }

            Set<Long> excludedCategoryIds = new HashSet<>();
            for (Long categoryId : incomingCategoryIds) {
                for (Long otherCategoryId : incomingCategoryIds) {
                    if (categoryId.equals(otherCategoryId)) continue;
                    Set<Long> otherAncestors = categoryAncestors.get(otherCategoryId);
                    if (otherAncestors.contains(categoryId)) {
                        excludedCategoryIds.add(categoryId);
                        break;
                    }
                }
            }

            Set<Long> finalCategoryIds = incomingCategoryIds.stream()
                    .filter(id -> !excludedCategoryIds.contains(id))
                    .collect(Collectors.toSet());

            Set<Categories> finalCategories = categories.stream()
                    .filter(c -> finalCategoryIds.contains(c.getId()))
                    .collect(Collectors.toSet());

            product.setCategories(finalCategories);
        }
        Produits result = produitRepository.save(product);
        notificationService.notifyNewProduct(
                result.getId(),
                result.getNom()
        );
        return result;
    }

    public List<CategoryDistributionDTO> getCategoryDistribution() {
        List<Object[]> results = categoriesRepository.findCategoryProductCounts();
        return results.stream()
                .map(result -> new CategoryDistributionDTO(
                        (String) result[0],
                        ((Number) result[1]).longValue()
                ))
                .collect(Collectors.toList());
    }

    public ProductStatsDTO getProductStats() {
        ProductStatsDTO stats = new ProductStatsDTO();

        stats.setTotalProducts(produitRepository.countTotalProducts());
        stats.setLowStockCount(produitRepository.countLowStockProducts());


        Double totalRevenue = commandeRepository.getTotalRevenue();
        stats.setTotalRevenue(totalRevenue != null ? totalRevenue : 0.0);

        return stats;
    }

    public List<SalesDataDTO> getSalesData(String range) {
        ZoneId zone = ZoneId.of("Europe/Paris");
        LocalDateTime now = LocalDateTime.now(zone);
        Date endDate = Date.from(now.atZone(zone).toInstant());

        // Ajustement en fonction de la plage
        LocalDateTime startDateTime = now;
        String groupBy = "MONTH";

        if (range.contains("Year")) {
            startDateTime = now.withDayOfYear(1);
        } else if (range.contains("6 Months")) {
            startDateTime = now.minusMonths(6);
        } else if (range.contains("Month")) {
            startDateTime = now.minusMonths(1);
        }

        Date startDate = Date.from(startDateTime.atZone(zone).toInstant());

        return commandeRepository.getSalesData(startDate, endDate, groupBy)
                .stream()
                .map(result -> {
                    SalesDataDTO dto = new SalesDataDTO();
                    dto.setPeriod((String) result[0]);
                    dto.setTotal((Double) result[1]);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // In ProductService.java, add this method:
    public List<ReviewDTO> getProductReviews(Long productId) {
        Produits product = produitRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return product.getNotes().stream()
                .map(note -> {
                    ReviewDTO dto = new ReviewDTO();
                    dto.setClientId(note.getClient().getId());
                    dto.setClientName(note.getClient().getNom());
                    dto.setProductId(productId);
                    dto.setRating(note.getRating());
                    dto.setCommentaire(note.getCommentaire());
                    dto.setDate(note.getDate());
                    return dto;
                })
                .collect(Collectors.toList());
    }
}