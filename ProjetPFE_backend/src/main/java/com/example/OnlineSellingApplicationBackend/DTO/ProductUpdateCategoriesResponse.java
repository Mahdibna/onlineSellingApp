package com.example.OnlineSellingApplicationBackend.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductUpdateCategoriesResponse {
    private Long productId;
    private List<CategoryMessage> addedCategories = new ArrayList<>();
    private List<CategoryMessage> skippedCategories = new ArrayList<>();
    private String error;

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public List<CategoryMessage> getAddedCategories() {
        return addedCategories;
    }

    public void setAddedCategories(List<CategoryMessage> addedCategories) {
        this.addedCategories = addedCategories;
    }

    public List<CategoryMessage> getSkippedCategories() {
        return skippedCategories;
    }

    public void setSkippedCategories(List<CategoryMessage> skippedCategories) {
        this.skippedCategories = skippedCategories;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}