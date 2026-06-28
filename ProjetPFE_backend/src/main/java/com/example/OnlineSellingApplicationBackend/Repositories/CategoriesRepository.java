package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Categories;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriesRepository extends JpaRepository<Categories, Long> {
    @Query("SELECT c FROM Categories c LEFT JOIN FETCH c.subCategories WHERE c.parent IS NULL")
    List<Categories> findAllRootCategoriesWithSubs();

    @Query("SELECT c FROM Categories c LEFT JOIN FETCH c.subCategories WHERE c.id = :id")
    Optional<Categories> findCategoryById(@Param("id") Long id);

    List<Categories> findByParentId(Long parentId);

    @Query("SELECT c FROM Categories c WHERE c.parent IS NULL")
    List<Categories> findAllRootCategories();

    @Query(
            value = "SELECT c.nom AS category, COUNT(pc.produit_id) AS productCount " +
                    "FROM categories c " +
                    "LEFT JOIN produit_categorie pc ON c.id = pc.categorie_id " +
                    "GROUP BY c.id, c.nom",
            nativeQuery = true
    )
    List<Object[]> findCategoryProductCounts();
}