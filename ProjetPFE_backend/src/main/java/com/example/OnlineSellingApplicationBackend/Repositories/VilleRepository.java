package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Pays;
import com.example.OnlineSellingApplicationBackend.entities.Ville;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository

public interface VilleRepository extends JpaRepository<Ville, Long> {
    @Query("SELECT v FROM Ville v WHERE LOWER(v.nom) = LOWER(:nom) AND v.pays = :pays")
    List<Ville> findByNomIgnoreCaseAndPays(@Param("nom") String nom, @Param("pays") Pays pays);
    @Query("SELECT COUNT(v) FROM Ville v WHERE v.pays = :pays")
    long countByPays(@Param("pays") Pays pays);


}
