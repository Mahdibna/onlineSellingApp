package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Produits;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProduitsRepository extends JpaRepository<Produits, Long> {

    @Query("SELECT p FROM Produits p WHERE p.id = :id")
    Optional<Produits> findById(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE Produits p SET p.categories = null WHERE p.id = :id")
    int deleteCategoryFromProduct(@Param("id") Long id);

    @Query("SELECT p FROM Produits p LEFT JOIN FETCH p.notes WHERE p.disponibilite = true")
    List<Produits> findAvailableProducts();

    @Query("SELECT p FROM Produits p LEFT JOIN FETCH p.notes")
    List<Produits> findAllWithRatings();

    @Query("SELECT p FROM Produits p LEFT JOIN FETCH p.notes WHERE p.id = :id")
    Produits findProduct(@Param("id") Long id);

    @Query("SELECT p FROM Produits p LEFT JOIN FETCH p.notes ORDER BY p.id DESC")
    List<Produits> findRecentWithRatings(Pageable pageable);

    @Query("SELECT COUNT(p) FROM Produits p")
    long countTotalProducts();

    @Query("SELECT COUNT(p) FROM Produits p WHERE p.quantite < 10")
    long countLowStockProducts();

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM produit_categorie WHERE categorie_id = :categoryId AND produit_id = :productId", nativeQuery = true)
    void removeProductFromCategory(@Param("categoryId") Long categoryId, @Param("productId") Long productId);
    List<Produits> findByCategoriesId(Long categoryId);
    @Query("SELECT p FROM Produits p JOIN p.categories c WHERE c.id IN :categoryIds AND p.disponibilite = true")
    List<Produits> findByCategoriesIdIn(@Param("categoryIds") Collection<Long> categoryIds);
}