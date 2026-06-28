package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Pays;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository

public interface PaysRepository extends JpaRepository<Pays, Long>{
    @Query("SELECT p FROM Pays p WHERE p.nom = LOWER(:nom)")
    Optional<Pays> findByNom(String nomPays);
    @Query("SELECT p FROM Pays p WHERE LOWER(p.nom) = LOWER(:nom)")
    List<Pays> findByNomIgnoreCase(@Param("nom") String nom);
    @Query("SELECT COUNT(v) FROM Ville v WHERE v.pays = :pays")
    long countByPays(@Param("pays") Pays pays);

}
