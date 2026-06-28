package com.example.OnlineSellingApplicationBackend.DTO;

public class CategoryDistributionDTO {
    private String category;
    private Long productCount;

    public CategoryDistributionDTO(String category, Long productCount) {
        this.category = category;
        this.productCount = productCount;
    }

    // Getters and Setters
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Long getProductCount() { return productCount; }
    public void setProductCount(Long productCount) { this.productCount = productCount; }
}