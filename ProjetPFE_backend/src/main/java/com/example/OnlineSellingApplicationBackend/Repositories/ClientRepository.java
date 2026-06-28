package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Commande;
import com.example.OnlineSellingApplicationBackend.entities.Produits;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    Optional<Client> findByEmailAndMotDePasse(String email, String password);
    @Query("SELECT c FROM Client c " +
            "LEFT JOIN FETCH c.favoris f " +
            "LEFT JOIN FETCH c.notes n " +
            "LEFT JOIN FETCH c.commandes cmd " +
            "WHERE c.id = :clientId")
    Optional<Client> findByIdWithRelations(Long clientId);
    List<Client> findByActifTrue(); // Fetch only active clients
    boolean existsByEmail(String email);
    @Query("SELECT c FROM Client c WHERE c.email = :email")
    Optional<Client> findByEmail(String email);
    @Query("SELECT c FROM Client c WHERE c.adresse.id = :adresseId AND c.id != :clientId")
    List<Client> findClientsByAdresseId(@Param("adresseId") Long adresseId, @Param("clientId") Long clientId);
    @Query("SELECT c FROM Client c WHERE c.id = :ClientId ")
    List<Client> findClientsById(@Param("ClientId") Long ClientId);
    // UserRepository.java
    @Query(value = """
                SELECT 
                    TO_CHAR(registration_date, 'Mon') AS month, 
                    COUNT(*) AS user_count
                FROM Client
                WHERE registration_date >= CURRENT_DATE - INTERVAL '5 months'
                GROUP BY TO_CHAR(registration_date, 'Mon'), DATE_TRUNC('month', registration_date)
                ORDER BY DATE_TRUNC('month', registration_date)
            """, nativeQuery = true)
    List<Object[]> findMonthlyUserGrowth();

    // UserRepository.java
    @Query(value = """
                SELECT 
                    CASE 
                        WHEN type = 'Partenaire' THEN 'Partenaire' 
                        ELSE 'Particulier' 
                    END AS client_type,
                    COUNT(*) AS count
                FROM Client
                GROUP BY type
            """, nativeQuery = true)
    List<Object[]> countUsersByClientType();

    @Query(value = """
        SELECT COUNT(*) 
        FROM client 
        WHERE DATE(registration_date) = DATE(:date)
        """, nativeQuery = true)
    long countByRegistrationDate(@Param("date") LocalDateTime date);
    @Query("SELECT COUNT(c) FROM Client c WHERE c.lastLogin >= :date")
    long countActiveUsers(@Param("date") LocalDateTime date);
    List<Client> findTop10ByOrderByRegistrationDateDesc();
    @Query("SELECT DISTINCT c FROM Client c " +
            "LEFT JOIN FETCH c.adresse a " +
            "LEFT JOIN FETCH a.ville v " +
            "LEFT JOIN FETCH v.pays " +
            "WHERE c.id = :clientId")
    Optional<Client> findByIdWithFullAddress(@Param("clientId") Long clientId);
}
