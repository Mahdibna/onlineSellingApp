package com.example.OnlineSellingApplicationBackend.DTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.HashSet;
import java.util.Set;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRecommendationDTO {
    private Long id;
    private boolean disponibilite;
    private String nom;
    private String description;
    private Set<String> photos = new HashSet<>(); // All photos
    private int quantite;
    private double prix;
    private double promotionPartenaire;
    private double promotionParticulier;
    private Set<CategoryDTO> categories; // Full categories
    private String categoryName; // For backward compatibility
    private Double averageRating;
    private String recommendationType; // "collaborative", "content-based", "popular"
    private Double recommendationScore; // How strong the recommendation is

    // Convert from ProduitAdminDTO
    public ProductRecommendationDTO(ProduitAdminDTO produit, String recommendationType, Double recommendationScore) {
        this.id = produit.getId();
        this.disponibilite = produit.isDisponibilite();
        this.nom = produit.getNom();
        this.description = produit.getDescription();
        this.photos = produit.getPhotos();
        this.quantite = produit.getQuantite();
        this.prix = produit.getPrix();
        this.promotionPartenaire = produit.getPromotionPartenaire();
        this.promotionParticulier = produit.getPromotionParticulier();
        this.categories = produit.getCategories();
        this.averageRating = produit.getAverageRating();
        this.recommendationType = recommendationType;
        this.recommendationScore = recommendationScore;



        // For backward compatibility
        if (produit.getCategories() != null && !produit.getCategories().isEmpty()) {
            this.categoryName = produit.getCategories().iterator().next().getNom();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public boolean isDisponibilite() {
        return disponibilite;
    }

    public void setDisponibilite(boolean disponibilite) {
        this.disponibilite = disponibilite;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<String> getPhotos() {
        return photos;
    }

    public void setPhotos(Set<String> photos) {
        this.photos = photos;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public double getPrix() {
        return prix;
    }

    public void setPrix(double prix) {
        this.prix = prix;
    }

    public double getPromotionPartenaire() {
        return promotionPartenaire;
    }

    public void setPromotionPartenaire(double promotionPartenaire) {
        this.promotionPartenaire = promotionPartenaire;
    }

    public double getPromotionParticulier() {
        return promotionParticulier;
    }

    public void setPromotionParticulier(double promotionParticulier) {
        this.promotionParticulier = promotionParticulier;
    }

    public Set<CategoryDTO> getCategories() {
        return categories;
    }

    public void setCategories(Set<CategoryDTO> categories) {
        this.categories = categories;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public String getRecommendationType() {
        return recommendationType;
    }

    public void setRecommendationType(String recommendationType) {
        this.recommendationType = recommendationType;
    }

    public Double getRecommendationScore() {
        return recommendationScore;
    }

    public void setRecommendationScore(Double recommendationScore) {
        this.recommendationScore = recommendationScore;
    }
}