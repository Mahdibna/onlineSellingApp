package com.example.OnlineSellingApplicationBackend.DTO;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FavoriteProductDTO {
    private Long clientId;
    private Long productId;
    private String name;
    private String description;
    private double partnerPromotion;
    private double individualPromotion;
    private String selection;
    private Set<String> photos = new HashSet<>();  // Changed to Object to handle both single and multiple photos
    private Double price;
    private boolean availability;
    private Double averageRating;
    // Constructor that matches your usage
    public FavoriteProductDTO(Long clientId, Long productId, String name, String description,
                              double partnerPromotion, double individualPromotion, String selection,
                              Set<String> photos, Double price, boolean availability,Double averageRating) {
        this.clientId = clientId;
        this.productId = productId;
        this.name = name;
        this.description = description;
        this.partnerPromotion = partnerPromotion;
        this.individualPromotion = individualPromotion;
        this.selection = selection;
        this.photos = photos;
        this.price = price;
        this.availability = availability;
        this.averageRating = averageRating;

    }

    // Getters and setters
    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getPartnerPromotion() {
        return partnerPromotion;
    }

    public void setPartnerPromotion(double partnerPromotion) {
        this.partnerPromotion = partnerPromotion;
    }

    public double getIndividualPromotion() {
        return individualPromotion;
    }

    public void setIndividualPromotion(double individualPromotion) {
        this.individualPromotion = individualPromotion;
    }

    public String getSelection() {
        return selection;
    }

    public void setSelection(String selection) {
        this.selection = selection;
    }

    public Set<String> getPhotos() {
        return photos;
    }

    public void setPhotos(Set<String> photos) {
        this.photos = photos;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public boolean isAvailability() {
        return availability;
    }

    public void setAvailability(boolean availability) {
        this.availability = availability;
    }
}