package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Paquet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaquetRepository extends JpaRepository<Paquet, Long> {
    @Query(value = "SELECT p.id AS paquet_id, pr.id AS produit_id, pr.name AS produit_name " +
            "FROM paquet p " +
            "JOIN ligne_paquet lp ON lp.id_paquet = p.id " +
            "JOIN produit pr ON pr.id = lp.id_produit", nativeQuery = true)
    List<Object[]> findAllPaquetsWithProduits();

    @Query("SELECT p FROM Paquet p WHERE p.id = :id")
    Optional<Paquet> findById(@Param("id") Long id);

    // New query to find available packs
    @Query("SELECT p FROM Paquet p WHERE p.disponibility = true")
    List<Paquet> findAllAvailable();
}