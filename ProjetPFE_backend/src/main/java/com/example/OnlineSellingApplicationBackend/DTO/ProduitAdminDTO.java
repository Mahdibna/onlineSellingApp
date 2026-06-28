package com.example.OnlineSellingApplicationBackend.DTO;

import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
@NoArgsConstructor
public class ProduitAdminDTO {
    private Long id;
    private String reference;
    private boolean disponibilite;
    private String nom;
    private String description;
    private int quantite;
    private double prix;
    private double promotionPartenaire;
    private double promotionParticulier;
    @Nullable
    private Set<CategoryDTO> categories;
    private Double averageRating;
    private Set<String> photos = new HashSet<>();

    public ProduitAdminDTO(Long id, boolean disponibilite, String nom, String description,
                           Set<String> photos, int quantite, double prix,
                           double promotionPartenaire, double promotionParticulier,
                           Set<CategoryDTO> categories, Double averageRating,
                           String reference) {
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
        this.reference = reference;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
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

    @Nullable
    public Set<CategoryDTO> getCategories() {
        return categories;
    }

    public void setCategories(@Nullable Set<CategoryDTO> categories) {
        this.categories = categories;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Set<String> getPhotos() {
        return photos;
    }

    public void setPhotos(Set<String> photos) {
        this.photos = photos;
    }
}