package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.Categories;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public record SubCategoryResponse(
        Long id,
        String nom,
        String description,
        String photo,
        List<SubCategoryResponse> subCategories
) {
    public SubCategoryResponse(Categories category) {
        this(
                category.getId(),
                category.getNom(),
                category.getDescription(),
                category.getPhoto() != null ? category.getPhoto() : null,
                category.getSubCategories() != null ?
                        category.getSubCategories().stream()
                                .map(SubCategoryResponse::new)
                                .collect(Collectors.toList()) : new ArrayList<>()
        );
    }
}