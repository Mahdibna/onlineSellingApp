package com.example.OnlineSellingApplicationBackend.DTO;

import java.util.HashSet;
import java.util.Set;

public class ProductUpdateCategoriesRequest {
    private Set<Long> categoryIds = new HashSet<>(); // Initialize here

    // Getter and Setter
    public Set<Long> getCategoryIds() {
        return categoryIds;
    }

    public void setCategoryIds(Set<Long> categoryIds) {
        this.categoryIds = categoryIds != null ? categoryIds : new HashSet<>();
    }

}