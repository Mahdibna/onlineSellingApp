package com.example.OnlineSellingApplicationBackend.DTO;

import java.util.List;

public record CategoryResponse(
        Long id,
        String nom,
        String description,
        String photo,
        Long parentId,
        List<SubCategoryResponse> subCategories
) {}