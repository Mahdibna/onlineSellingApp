package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Favoris;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository

public interface FavorisRepository extends JpaRepository<Favoris, Long> {
    List<Favoris> findByClientId(Long clientId);

    @Query("SELECT f.produitId FROM Favoris f WHERE f.clientId = :clientId")
    List<Long> findProduitIdsByClientId(@Param("clientId") Long clientId);
    void deleteByClientIdAndProduitId(Long clientId, Long produitId);
    boolean existsByClientIdAndProduitId(Long clientId, Long produitId);
}
