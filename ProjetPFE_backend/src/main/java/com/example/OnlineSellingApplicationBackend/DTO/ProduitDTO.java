package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.Categories;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
public class ProduitDTO {
    private Long id;
    private boolean disponibilite;
    private String nom;
    private String description;
    private Set<String> photos = new HashSet<>();
    private int quantite;
    private double prix;
    private double promotionPartenaire;
    private double promotionParticulier;
    private Set<Categories> categories;
    private Double averageRating;

    // Basic constructor matching existing code
    public ProduitDTO(Long id, String nom, String description, Set<String> photos, int quantite, double prix, Set<Categories> categories) {
        this.id = id;
        this.nom = nom;
        this.description = description;
        this.photos = photos;
        this.quantite = quantite;
        this.prix = prix;
        this.categories = categories;
    }

    // Full constructor with all fields
    public ProduitDTO(Long id, boolean disponibilite, String nom, String description, Set<String> photos,
                      int quantite, double prix, double promotionPartenaire, double promotionParticulier,
                      Set<Categories> categories, Double averageRating) {
        this.id = id;
        this.disponibilite = disponibilite;
        this.nom = nom;
        this.description = description;
        this.photos = photos;
        this.quantite = quantite;
        this.prix = prix;
        this.promotionPartenaire = promotionPartenaire;
        this.promotionParticulier = promotionParticulier;
        this.categories = categories;
        this.averageRating = averageRating;
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

    public Set<Categories> getCategories() {
        return categories;
    }

    public void setCategories(Set<Categories> categories) {
        this.categories = categories;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }
}