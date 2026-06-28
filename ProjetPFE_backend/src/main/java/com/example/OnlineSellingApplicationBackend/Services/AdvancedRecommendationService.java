package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ProduitsRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.UserProductInteractionRepository;
import com.example.OnlineSellingApplicationBackend.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdvancedRecommendationService {

    @Autowired
    private ProduitsRepository produitsRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserProductInteractionRepository interactionRepository;

    @Autowired
    private ProductService productService;

    @Transactional
    public void trackProductView(Long clientId, Long productId) {
        saveInteraction(clientId, productId, InteractionType.VIEW);
    }

    @Transactional
    public void trackAddToCart(Long clientId, Long productId) {
        saveInteraction(clientId, productId, InteractionType.ADD_TO_CART);
    }

    @Transactional
    public void trackPurchase(Long clientId, Long productId) {
        saveInteraction(clientId, productId, InteractionType.PURCHASE);
    }

    @Transactional
    public void trackWishlist(Long clientId, Long productId) {
        saveInteraction(clientId, productId, InteractionType.WISHLIST);
    }

    private void saveInteraction(Long clientId, Long productId, InteractionType type) {
        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client not found"));

            Produits product = produitsRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            UserProductInteraction interaction = new UserProductInteraction(client, product, type);

            interactionRepository.save(interaction);
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Error tracking interaction: " + e.getMessage());
        }
    }
    @Transactional(readOnly = true)
    public List<ProduitDTO> getSessionBasedRecommendations(Long clientId, int limit) {
        List<UserProductInteraction> recentInteractions = interactionRepository.findRecentInteractionsByClientId(
                clientId, PageRequest.of(0, 5));

        if (recentInteractions.isEmpty()) {
            List<Long> popularProductIds = interactionRepository.findMostPopularProductIds(
                    PageRequest.of(0, limit));

            if (popularProductIds.isEmpty()) {
                try {
                    List<ProduitAdminDTO> recentProducts = productService.getRecentProducts();
                    return recentProducts.stream()
                            .map(this::convertToProduitDTO)
                            .limit(limit)
                            .collect(Collectors.toList());
                } catch (Exception e) {
                    return new ArrayList<>();
                }
            }

            List<Produits> products = produitsRepository.findAllById(popularProductIds);
            return products.stream()
                    .map(this::convertToProduitDTO)
                    .limit(limit)
                    .collect(Collectors.toList());
        }

        Set<Long> recentCategories = new HashSet<>();
        for (UserProductInteraction interaction : recentInteractions) {
            recentCategories.addAll(
                    interaction.getProduit().getCategories().stream()
                            .map(category -> category.getId())
                            .collect(Collectors.toSet())
            );
        }

        Set<Long> viewedProductIds = recentInteractions.stream()
                .map(interaction -> interaction.getProduit().getId())
                .collect(Collectors.toSet());

        List<Produits> recommendedProducts = produitsRepository.findByCategoriesIdIn(recentCategories)
                .stream()
                .filter(p -> !viewedProductIds.contains(p.getId()))
                .limit(limit)
                .collect(Collectors.toList());

        return recommendedProducts.stream()
                .map(this::convertToProduitDTO)
                .collect(Collectors.toList());
    }


    private ProduitDTO convertToProduitDTO(Produits produit) {
        return new ProduitDTO(
                produit.getId(),
                produit.getNom(),
                produit.getDescription(),
                produit.getPhotos(),
                produit.getQuantite(),
                produit.getPrix(),
                produit.getCategories()
        );
    }

    private ProduitDTO convertToProduitDTO(ProduitAdminDTO adminDTO) {
        Set<Categories> categories = adminDTO.getCategories().stream()
                .map(categoryDTO -> {
                    Categories category = new Categories();
                    category.setId(categoryDTO.getId());
                    category.setNom(categoryDTO.getNom());
                    category.setDescription(categoryDTO.getDescription());
                    category.setPhoto(categoryDTO.getPhoto());
                    return category;
                })
                .collect(Collectors.toSet());

        return new ProduitDTO(
                adminDTO.getId(),
                adminDTO.getNom(),
                adminDTO.getDescription(),
                adminDTO.getPhotos(),
                adminDTO.getQuantite(),
                adminDTO.getPrix(),
                categories
        );
    }

    private ProductDTO convertToProductDTO(Produits produit) {
        ProductDTO dto = new ProductDTO();
        dto.setId(produit.getId());
        dto.setNom(produit.getNom());
        dto.setDescription(produit.getDescription());
        dto.setPrix(produit.getPrix());
        if (produit.getPhotos() != null && !produit.getPhotos().isEmpty()) {
            dto.setPhotos(produit.getPhotos());
            dto.setImageUrl(produit.getPhotos().iterator().next());
        }

        if (produit.getCategories() != null && !produit.getCategories().isEmpty()) {
            Set<CategoryDTO> categoryDTOs = produit.getCategories().stream()
                    .map(category -> new CategoryDTO(
                            category.getId(),
                            category.getNom(),
                            category.getDescription(),
                            category.getPhoto()
                    ))
                    .collect(Collectors.toSet());

            dto.setCategories(categoryDTOs);
            dto.setCategoryName(produit.getCategories().iterator().next().getNom());
        }

        dto.setDisponibilite(produit.isDisponibilite());
        dto.setQuantite(produit.getQuantite());
        dto.setPromotionPartenaire(produit.getPromotionPartenaire());
        dto.setPromotionParticulier(produit.getPromotionParticulier());

        if (produit.getNotes() != null && !produit.getNotes().isEmpty()) {
            dto.setAverageRating(produit.getNotes().stream()
                    .mapToInt(note -> note.getRating())
                    .average()
                    .orElse(0.0));
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<ProductRecommendationDTO> getCollaborativeRecommendations(Long clientId, int limit) {
        // Find users with similar taste
        List<Long> similarUserIds = interactionRepository.findSimilarUsers(clientId, 10);

        if (similarUserIds.isEmpty()) {
            return getPopularRecommendations(limit);
        }

        List<Object[]> recommendedProducts = interactionRepository.findProductRecommendations(
                similarUserIds, clientId, Math.min(50, limit * 3));

        if (recommendedProducts.isEmpty()) {
            return getPopularRecommendations(limit);
        }

        Map<Long, Double> productScores = new HashMap<>();
        for (Object[] result : recommendedProducts) {
            Long productId = ((Number) result[0]).longValue();
            Double score = ((Number) result[1]).doubleValue();
            productScores.put(productId, score);
        }

        List<Produits> products = produitsRepository.findAllById(productScores.keySet());

        List<ProductRecommendationDTO> recommendations = new ArrayList<>();
        for (Produits product : products) {
            ProduitAdminDTO adminDTO = convertToAdminDTO(product);

            Double score = productScores.get(product.getId());
            ProductRecommendationDTO recommendationDTO = new ProductRecommendationDTO(
                    adminDTO, "collaborative", score);

            recommendations.add(recommendationDTO);
        }

        recommendations.sort(Comparator.comparing(ProductRecommendationDTO::getRecommendationScore).reversed());

        if (recommendations.size() > limit) {
            recommendations = recommendations.subList(0, limit);
        }

        return recommendations;
    }

    @Transactional(readOnly = true)
    public List<ProductRecommendationDTO> getContentBasedRecommendations(Long clientId, int limit) {
        List<UserProductInteraction> recentInteractions = interactionRepository.findRecentInteractionsByClientId(
                clientId, PageRequest.of(0, 10));

        if (recentInteractions.isEmpty()) {
            return getPopularRecommendations(limit);
        }

        Set<Long> interestCategories = new HashSet<>();
        Map<Long, Set<Long>> productCategories = new HashMap<>();

        for (UserProductInteraction interaction : recentInteractions) {
            Produits product = interaction.getProduit();
            Long productId = product.getId();

            Set<Long> categories = product.getCategories().stream()
                    .map(category -> category.getId())
                    .collect(Collectors.toSet());

            productCategories.put(productId, categories);
            interestCategories.addAll(categories);
        }

        List<Produits> categoryProducts = produitsRepository.findByCategoriesIdIn(interestCategories);

        Set<Long> interactedProductIds = recentInteractions.stream()
                .map(interaction -> interaction.getProduit().getId())
                .collect(Collectors.toSet());

        categoryProducts = categoryProducts.stream()
                .filter(product -> !interactedProductIds.contains(product.getId()))
                .collect(Collectors.toList());

        Map<Long, Double> productScores = new HashMap<>();

        for (Produits product : categoryProducts) {
            Set<Long> productCats = product.getCategories().stream()
                    .map(category -> category.getId())
                    .collect(Collectors.toSet());

            double categoryOverlap = 0.0;
            for (Long categoryId : productCats) {
                if (interestCategories.contains(categoryId)) {
                    categoryOverlap += 1.0;
                }
            }

            double score = categoryOverlap / Math.max(1, interestCategories.size());
            productScores.put(product.getId(), score);
        }

        List<ProductRecommendationDTO> recommendations = new ArrayList<>();

        for (Produits product : categoryProducts) {
            Double score = productScores.get(product.getId());
            if (score > 0) {
                ProduitAdminDTO adminDTO = convertToAdminDTO(product);
                ProductRecommendationDTO recommendationDTO = new ProductRecommendationDTO(
                        adminDTO, "content-based", score);
                recommendations.add(recommendationDTO);
            }
        }

        recommendations.sort(Comparator.comparing(ProductRecommendationDTO::getRecommendationScore).reversed());

        if (recommendations.size() > limit) {
            recommendations = recommendations.subList(0, limit);
        }

        return recommendations;
    }


    @Transactional(readOnly = true)
    public List<ProductRecommendationDTO> getPopularRecommendations(int limit) {
        List<Long> popularProductIds = interactionRepository.findMostPopularProductIds(
                PageRequest.of(0, Math.min(50, limit * 2)));

        if (popularProductIds.isEmpty()) {
            List<ProduitAdminDTO> recentProducts = productService.getRecentProducts();

            return recentProducts.stream()
                    .map(product -> new ProductRecommendationDTO(product, "popular", 1.0))
                    .limit(limit)
                    .collect(Collectors.toList());
        }

        List<Produits> products = produitsRepository.findAllById(popularProductIds);

        List<ProductRecommendationDTO> recommendations = new ArrayList<>();
        double maxScore = products.size();

        for (int i = 0; i < products.size(); i++) {
            Produits product = products.get(i);
            double score = (maxScore - i) / maxScore;

            ProduitAdminDTO adminDTO = convertToAdminDTO(product);
            ProductRecommendationDTO recommendationDTO = new ProductRecommendationDTO(
                    adminDTO, "popular", score);

            recommendations.add(recommendationDTO);

            if (recommendations.size() >= limit) {
                break;
            }
        }

        return recommendations;
    }


    @Transactional(readOnly = true)
    public List<ProductRecommendationDTO> getHybridRecommendations(Long clientId, int limit) {
        // Get recommendations from different methods
        int perMethodLimit = Math.min(50, limit * 2);
        List<ProductRecommendationDTO> collaborative = getCollaborativeRecommendations(clientId, perMethodLimit);
        List<ProductRecommendationDTO> contentBased = getContentBasedRecommendations(clientId, perMethodLimit);
        List<ProductRecommendationDTO> popular = getPopularRecommendations(perMethodLimit);

        for (ProductRecommendationDTO rec : collaborative) {
            rec.setRecommendationScore(rec.getRecommendationScore() * 1.2); // 20% boost
        }

        for (ProductRecommendationDTO rec : contentBased) {
            rec.setRecommendationScore(rec.getRecommendationScore() * 1.0); // No change
        }

        for (ProductRecommendationDTO rec : popular) {
            rec.setRecommendationScore(rec.getRecommendationScore() * 0.8); // 20% reduction
        }

        Map<Long, ProductRecommendationDTO> combinedRecs = new HashMap<>();

        for (ProductRecommendationDTO rec : collaborative) {
            combinedRecs.put(rec.getId(), rec);
        }

        for (ProductRecommendationDTO rec : contentBased) {
            if (combinedRecs.containsKey(rec.getId())) {
                ProductRecommendationDTO existing = combinedRecs.get(rec.getId());
                existing.setRecommendationScore(existing.getRecommendationScore() + rec.getRecommendationScore());
                existing.setRecommendationType("hybrid");
            } else {
                combinedRecs.put(rec.getId(), rec);
            }
        }

        for (ProductRecommendationDTO rec : popular) {
            if (combinedRecs.containsKey(rec.getId())) {
                ProductRecommendationDTO existing = combinedRecs.get(rec.getId());
                existing.setRecommendationScore(existing.getRecommendationScore() + rec.getRecommendationScore());
                existing.setRecommendationType("hybrid");
            } else {
                combinedRecs.put(rec.getId(), rec);
            }
        }

        List<ProductRecommendationDTO> sortedRecs = new ArrayList<>(combinedRecs.values());
        sortedRecs.sort(Comparator.comparing(ProductRecommendationDTO::getRecommendationScore).reversed());

        if (sortedRecs.size() > limit) {
            sortedRecs = sortedRecs.subList(0, limit);
        }

        return sortedRecs;
    }

    @Transactional(readOnly = true)
    public List<ProductRecommendationDTO> getSimilarProducts(Long productId, int limit) {
        Produits product = produitsRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Set<Long> productCategories = product.getCategories().stream()
                .map(category -> category.getId())
                .collect(Collectors.toSet());

        if (productCategories.isEmpty()) {
            return getPopularRecommendations(limit);
        }

        List<Produits> similarProducts = produitsRepository.findByCategoriesIdIn(productCategories);

        similarProducts = similarProducts.stream()
                .filter(p -> !p.getId().equals(productId))
                .collect(Collectors.toList());

        if (similarProducts.isEmpty()) {
            return getPopularRecommendations(limit);
        }

        Map<Long, Double> productScores = new HashMap<>();
        for (Produits similarProduct : similarProducts) {
            Set<Long> similarProductCategories = similarProduct.getCategories().stream()
                    .map(category -> category.getId())
                    .collect(Collectors.toSet());

            int overlapCount = 0;
            for (Long categoryId : similarProductCategories) {
                if (productCategories.contains(categoryId)) {
                    overlapCount++;
                }
            }

            double score = (double) overlapCount / Math.max(1, productCategories.size());
            productScores.put(similarProduct.getId(), score);
        }

        List<Produits> sortedProducts = similarProducts.stream()
                .sorted(Comparator.comparing(p -> -productScores.getOrDefault(p.getId(), 0.0)))
                .collect(Collectors.toList());

        List<ProductRecommendationDTO> recommendations = new ArrayList<>();

        for (Produits similarProduct : sortedProducts) {
            Double score = productScores.get(similarProduct.getId());
            ProduitAdminDTO adminDTO = convertToAdminDTO(similarProduct);
            ProductRecommendationDTO recommendationDTO = new ProductRecommendationDTO(
                    adminDTO, "similar", score);
            recommendations.add(recommendationDTO);

            if (recommendations.size() >= limit) {
                break;
            }
        }

        return recommendations;
    }

    private ProduitAdminDTO convertToAdminDTO(Produits produit) {
        Set<CategoryDTO> categoryDTOs = produit.getCategories().stream()
                .map(category -> new CategoryDTO(
                        category.getId(),
                        category.getNom(),
                        category.getDescription(),
                        category.getPhoto()
                ))
                .collect(Collectors.toSet());

        Double averageRating = null;
        if (produit.getNotes() != null && !produit.getNotes().isEmpty()) {
            averageRating = produit.getNotes().stream()
                    .mapToInt(note -> note.getRating())
                    .average()
                    .orElse(0.0);
        }

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
                averageRating,
                produit.getReference()
        );
    }
}