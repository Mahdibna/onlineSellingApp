package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.DTO.AddressResponse;
import com.example.OnlineSellingApplicationBackend.entities.Adresse;
import com.example.OnlineSellingApplicationBackend.entities.Ville;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdresseRepository extends JpaRepository<Adresse, Long> {
    @Query("SELECT a FROM Adresse a " +
            "WHERE LOWER(a.rue) = LOWER(:rue) " +
            "AND LOWER(a.numero) = LOWER(:numero) " +
            "AND LOWER(a.indication) = LOWER(:indication) " +
            "AND a.ville = :ville")
    List<Adresse> findByRueIgnoreCaseAndNumeroIgnoreCaseAndIndicationIgnoreCaseAndVille(
            @Param("rue") String rue,
            @Param("numero") String numero,
            @Param("indication") String indication,
            @Param("ville") Ville ville
    );

    @Query("SELECT a FROM Adresse a " +
            "WHERE LOWER(a.rue) = LOWER(:rue) " +
            "AND LOWER(a.numero) = LOWER(:numero) " +
            "AND a.ville = :ville " +
            "AND (a.indication IS NULL OR LOWER(a.indication) = LOWER(:indication))")
    List<Adresse> findByFullAddressComponents(
            @Param("rue") String rue,
            @Param("numero") String numero,
            @Param("indication") String indication,
            @Param("ville") Ville ville
    );

    @Query("SELECT new com.example.OnlineSellingApplicationBackend.DTO.AddressResponse(a) " +
            "FROM Adresse a " +
            "WHERE LOWER(a.rue) = LOWER(:rue) " +
            "AND LOWER(a.numero) = LOWER(:numero) " +
            "AND a.ville.nom = LOWER(:villeNom) " +
            "AND a.ville.pays.nom = LOWER(:paysNom) " +
            "AND (a.indication IS NULL OR LOWER(a.indication) = LOWER(:indication))")
    List<AddressResponse> findExistingAddress(
            @Param("rue") String rue,
            @Param("numero") String numero,
            @Param("villeNom") String villeNom,
            @Param("paysNom") String paysNom,
            @Param("indication") String indication
    );

    @Query("SELECT new com.example.OnlineSellingApplicationBackend.DTO.AddressResponse(a) FROM Adresse a WHERE a.ville.id = :vlId")
    List<AddressResponse> findAdressByVille(@Param("vlId") Long vlId);

    @Query("SELECT COUNT(a) FROM Adresse a WHERE a.ville = :ville")
    long countByVille(@Param("ville") Ville ville);
}