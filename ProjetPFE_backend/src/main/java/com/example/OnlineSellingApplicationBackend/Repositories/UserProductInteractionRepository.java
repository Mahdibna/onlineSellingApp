package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.InteractionType;
import com.example.OnlineSellingApplicationBackend.entities.UserProductInteraction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserProductInteractionRepository extends JpaRepository<UserProductInteraction, Long> {

    /**
     * Find users with similar product interactions
     */
    @Query(value = "SELECT ui.client.id FROM UserProductInteraction ui " +
            "WHERE ui.produit.id IN " +
            "(SELECT ui2.produit.id FROM UserProductInteraction ui2 WHERE ui2.client.id = :clientId) " +
            "AND ui.client.id != :clientId " +
            "GROUP BY ui.client.id " +
            "ORDER BY COUNT(DISTINCT ui.produit.id) DESC")
    List<Long> findSimilarUsers(@Param("clientId") Long clientId, Pageable pageable);

    default List<Long> findSimilarUsers(Long clientId, int limit) {
        return findSimilarUsers(clientId, Pageable.ofSize(limit));
    }

    /**
     * Find product recommendations based on similar users' interactions
     */
    @Query(value = "SELECT ui.produit.id, COUNT(ui) as score FROM UserProductInteraction ui " +
            "WHERE ui.client.id IN :similarUserIds " +
            "AND ui.produit.id NOT IN " +
            "(SELECT ui2.produit.id FROM UserProductInteraction ui2 WHERE ui2.client.id = :clientId) " +
            "GROUP BY ui.produit.id " +
            "ORDER BY score DESC")
    List<Object[]> findProductRecommendations(
            @Param("similarUserIds") List<Long> similarUserIds,
            @Param("clientId") Long clientId,
            Pageable pageable);

    default List<Object[]> findProductRecommendations(
            List<Long> similarUserIds, Long clientId, int limit) {
        return findProductRecommendations(similarUserIds, clientId, Pageable.ofSize(limit));
    }

    /**
     * Find categories that a user has interacted with
     */
    @Query("SELECT DISTINCT c.id FROM UserProductInteraction ui " +
            "JOIN ui.produit p " +
            "JOIN p.categories c " +
            "WHERE ui.client.id = :clientId")
    List<Long> findCategoriesInteractedWith(@Param("clientId") Long clientId);

    /**
     * Find recent interactions by a user
     * Updated to use createdAt instead of interactionDate
     */
    @Query("SELECT ui FROM UserProductInteraction ui " +
            "WHERE ui.client.id = :clientId " +
            "ORDER BY ui.createdAt DESC")
    List<UserProductInteraction> findRecentInteractionsByClientId(
            @Param("clientId") Long clientId, Pageable pageable);

    /**
     * Find most popular product IDs
     */
    @Query("SELECT ui.produit.id FROM UserProductInteraction ui " +
            "GROUP BY ui.produit.id " +
            "ORDER BY COUNT(ui) DESC")
    List<Long> findMostPopularProductIds(Pageable pageable);
}