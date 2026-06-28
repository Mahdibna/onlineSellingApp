package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Repositories.CategoriesRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ProduitsRepository;
import com.example.OnlineSellingApplicationBackend.entities.Categories;
import com.example.OnlineSellingApplicationBackend.entities.Note;
import com.example.OnlineSellingApplicationBackend.entities.Produits;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CategoriesService {

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private ProduitsRepository produitsRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public Categories addCategory(Categories category, Long parentId) {
        if (parentId != null) {
            Categories parent = categoriesRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent not found"));
            category.setParent(parent);
            parent.getSubCategories().add(category);
        }
        return categoriesRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id, boolean deleteSubCategories) {
        try {
            System.out.println("Deleting category: " + id + ", deleteSubCategories: " + deleteSubCategories);

            Categories category = categoriesRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Category not found"));

            // Check for products in the category or its subcategories
            Set<Long> allCategoryIds = new HashSet<>();
            allCategoryIds.add(category.getId());
            collectSubcategoryIds(category.getId(), allCategoryIds);
            List<Produits> products = produitsRepository.findByCategoriesIdIn(allCategoryIds);
            if (!products.isEmpty()) {
                throw new IllegalStateException("Cannot delete category with associated products");
            }

            // Remove associations and photos
            removeCategoryAssociationsAndPhotos(category.getId());

            if (deleteSubCategories) {
                System.out.println("Deleting subcategories recursively");
                deleteSubcategoriesRecursively(category);
            } else {
                System.out.println("Reassigning subcategories to parent");
                reassignSubcategories(category);
            }

            // Delete the category
            categoriesRepository.delete(category);
            System.out.println("Category deleted successfully: " + id);

        } catch (IllegalStateException e) {
            System.err.println("Error in deleteCategory: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Error in deleteCategory: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error deleting category: " + e.getMessage(), e);
        }
    }

    private void reassignSubcategories(Categories category) {
        Categories parentCategory = category.getParent();
        List<Categories> subCategories = new ArrayList<>(category.getSubCategories());

        for (Categories subCategory : subCategories) {
            subCategory.setParent(parentCategory);
            categoriesRepository.save(subCategory);
            category.getSubCategories().remove(subCategory);
        }

        categoriesRepository.save(category);
        entityManager.flush();
    }

    private void deleteSubcategoriesRecursively(Categories category) {
        List<Categories> subCategories = new ArrayList<>(category.getSubCategories());

        for (Categories subCategory : subCategories) {
            deleteSubcategoriesRecursively(subCategory);
            removeCategoryAssociationsAndPhotos(subCategory.getId());
            System.out.println("Deleting subcategory: " + subCategory.getId());
            categoriesRepository.delete(subCategory);
        }
    }

    private void removeCategoryAssociationsAndPhotos(Long categoryId) {
        try {
            System.out.println("Removing associations for category: " + categoryId);

            // Remove product associations
            int productAssociations = entityManager.createNativeQuery("DELETE FROM produit_categorie WHERE categorie_id = :categoryId")
                    .setParameter("categoryId", categoryId)
                    .executeUpdate();
            System.out.println("Removed " + productAssociations + " product associations");

            // Clear photo
            Categories category = categoriesRepository.findById(categoryId).orElse(null);
            if (category != null && category.getPhoto() != null) {
                String photoPath = category.getPhoto();
                try {
                    if (photoPath != null && !photoPath.isEmpty()) {
                        Path path = Paths.get(photoPath);
                        if (Files.exists(path)) {
                            Files.delete(path);
                            System.out.println("Deleted photo file: " + photoPath);
                        }
                    }
                } catch (IOException e) {
                    System.err.println("Failed to delete photo file: " + e.getMessage());
                }
                category.setPhoto(null);
                categoriesRepository.save(category);
            }
        } catch (Exception e) {
            System.err.println("Error in removeCategoryAssociationsAndPhotos: " + e.getMessage());
            throw new RuntimeException("Error removing category associations: " + e.getMessage(), e);
        }
    }

    public Categories modiferCategory(Long id, updateCategoryParent newCategory) {
        Categories category = categoriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (newCategory.getName() != null) {
            category.setNom(newCategory.getName());
        }
        if (newCategory.getDescription() != null) {
            category.setDescription(newCategory.getDescription());
        }
        if (newCategory.getParentId() != null) {
            Categories parentCategory = categoriesRepository.findById(newCategory.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent Category not found"));
            category.setParent(parentCategory);
        } else {
            category.setParent(null);
        }
        if (newCategory.getPhoto() != null && !newCategory.getPhoto().isEmpty()) {
            category.setPhoto(newCategory.getPhoto());
        }

        return categoriesRepository.save(category);
    }

    public CategoryResponse getCategory(Long id) {
        Categories category = categoriesRepository.findCategoryById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        return mapToCategoryResponse(category);
    }

    private CategoryResponse mapToCategoryResponse(Categories category) {
        List<SubCategoryResponse> subCategories = category.getSubCategories() != null ?
                category.getSubCategories().stream()
                        .map(this::mapToSubCategoryResponse)
                        .collect(Collectors.toList()) : new ArrayList<>();

        return new CategoryResponse(
                category.getId(),
                category.getNom(),
                category.getDescription(),
                category.getPhoto(),
                category.getParent() != null ? category.getParent().getId() : null,
                subCategories
        );
    }

    private SubCategoryResponse mapToSubCategoryResponse(Categories subCategory) {
        return new SubCategoryResponse(
                subCategory.getId(),
                subCategory.getNom(),
                subCategory.getDescription(),
                subCategory.getPhoto(),
                subCategory.getSubCategories() != null ?
                        subCategory.getSubCategories().stream()
                                .map(this::mapToSubCategoryResponse)
                                .collect(Collectors.toList()) : new ArrayList<>()
        );
    }

    public List<Categories> getCategoriesWithSubCategories() {
        return categoriesRepository.findAllRootCategoriesWithSubs();
    }

    private Double calculateAverageRating(Set<Note> notes) {
        if (notes == null || notes.isEmpty()) {
            return null;
        }
        return notes.stream()
                .mapToInt(Note::getRating)
                .average()
                .orElse(0.0);
    }

    public List<ProduitAdminDTO> findProductsByCategoryId(Long categoryId) {
        Set<Long> allCategoryIds = new HashSet<>();
        allCategoryIds.add(categoryId);
        collectSubcategoryIds(categoryId, allCategoryIds);

        List<Produits> produits = produitsRepository.findByCategoriesIdIn(allCategoryIds);

        return produits.stream()
                .map(produit -> {
                    Set<CategoryDTO> categoryDTOs = produit.getCategories().stream()
                            .map(category -> new CategoryDTO(
                                    category.getId(),
                                    category.getNom(),
                                    category.getDescription(),
                                    category.getPhoto()
                            ))
                            .collect(Collectors.toSet());

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
                            calculateAverageRating(produit.getNotes()),
                            produit.getReference()
                    );
                })
                .collect(Collectors.toList());
    }

    private void collectSubcategoryIds(Long categoryId, Set<Long> categoryIds) {
        Categories category = categoriesRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        for (Categories subCategory : category.getSubCategories()) {
            categoryIds.add(subCategory.getId());
            collectSubcategoryIds(subCategory.getId(), categoryIds);
        }
    }

    @Transactional
    public void removeProductFromCategory(Long categoryId, Long productId) {
        produitsRepository.removeProductFromCategory(categoryId, productId);
        entityManager.flush();
        entityManager.clear();
    }
}