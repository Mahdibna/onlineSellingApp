package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Commande;
import com.example.OnlineSellingApplicationBackend.entities.EtatCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {

    @Query("SELECT c FROM Commande c " +
            "JOIN FETCH c.ligneCommandes lc " +
            "JOIN FETCH lc.produit " +
            "WHERE c.client.id = :clientId " +
            "ORDER BY c.dateCommande DESC")
    List<Commande> findCommandesByClientId(@Param("clientId") Long clientId);

    @Query("SELECT c FROM Commande c " +
            "WHERE c.adresseLivraison.id = :adresseId ")
    List<Commande> findCommandesByAdresseId(@Param("adresseId") Long adresseId);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM Commande c " +
            "WHERE c.client.id = :clientId " +
            "AND c.etat IN :validStates " +
            "AND (" +
            "   EXISTS (SELECT 1 FROM c.ligneCommandes lc WHERE lc.produit.id = :productId) OR " +
            "   EXISTS (SELECT 1 FROM c.ligneCommandePack lcp JOIN lcp.paquet p JOIN p.lignePaquets lp WHERE lp.produit.id = :productId)" +
            ")")
    boolean existsValidPurchaseForRating(
            @Param("clientId") Long clientId,
            @Param("productId") Long productId,
            @Param("validStates") List<EtatCommande> validStates
    );


    @Query("SELECT DISTINCT c FROM Commande c " +
            "LEFT JOIN FETCH c.adresseLivraison a " +
            "LEFT JOIN FETCH a.ville v " +
            "LEFT JOIN FETCH v.pays " +
            "LEFT JOIN FETCH c.ligneCommandes lc " +
            "LEFT JOIN FETCH lc.produit " +
            "WHERE c.idCommande = :id")
    Optional<Commande> findByIdWithLigneCommandes(@Param("id") Long id);

    @Query("SELECT DISTINCT c FROM Commande c " +
            "LEFT JOIN FETCH c.adresseLivraison a " +
            "LEFT JOIN FETCH a.ville v " +
            "LEFT JOIN FETCH v.pays " +
            "LEFT JOIN FETCH c.ligneCommandePack lcp " +
            "LEFT JOIN FETCH lcp.paquet p " +
            "LEFT JOIN FETCH p.lignePaquets lp " +
            "LEFT JOIN FETCH lp.produit " +
            "WHERE c.idCommande = :orderId")
    Optional<Commande> findByIdWithLigneCommandePack(@Param("orderId") Long orderId);

    @Query(value = """
        SELECT 
            CASE 
                WHEN :groupBy = 'DAY' THEN TO_CHAR(c.date_commande, 'YYYY-MM-DD')
                ELSE TO_CHAR(c.date_commande, 'YYYY-MM')
            END AS period,
            SUM(c.total) AS total
        FROM commande c
        WHERE c.date_commande BETWEEN :startDate AND :endDate
          AND (
                (c.type_paiment = 'EnLigne' AND c.etat IN ('Livree', 'PayeEtEnCoursDeTraitement', 'EnTransit', 'EnCoursDeLivraison'))
                OR c.etat = 'LivreeEtPaye'
          )
        GROUP BY period
        ORDER BY period
    """, nativeQuery = true)
    List<Object[]> getSalesData(
            @Param("startDate") Date startDate,
            @Param("endDate") Date endDate,
            @Param("groupBy") String groupBy
    );

    @Query(value = """
SELECT 
    TO_CHAR(c.date_commande, 'Dy') AS day_of_week,
    SUM(c.total) AS total_sales
FROM commande c
WHERE CAST(c.date_commande AS date) BETWEEN :startDate AND :endDate
  AND (
        (c.type_paiment = 'EnLigne' AND c.etat IN ('Livree', 'PayeEtEnCoursDeTraitement', 'EnTransit', 'EnCoursDeLivraison'))
        OR c.etat = 'LivreeEtPaye'
  )
GROUP BY TO_CHAR(c.date_commande, 'Dy'), EXTRACT(DOW FROM c.date_commande)
ORDER BY EXTRACT(DOW FROM c.date_commande)
""", nativeQuery = true)
    List<Object[]> findDailySalesBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
    @Query(value = """
    SELECT 
        category, 
        SUM(total) as total 
    FROM (
        SELECT
            LOWER(TRIM(c.nom)) AS category,  -- Normalize category names
            SUM(lc.quantite * p.prix) AS total
        FROM ligne_commande lc
        JOIN produits p ON lc.produit_id = p.id
        JOIN produit_categorie pc ON p.id = pc.produit_id
        JOIN categories c ON pc.categorie_id = c.id
        GROUP BY LOWER(TRIM(c.nom))

        UNION ALL

        SELECT
            LOWER(TRIM(c.nom)) AS category,  -- Normalize category names
            SUM(lcp.quantite * p.prix) AS total
        FROM ligne_command_pack lcp
        JOIN Paquet pq ON lcp.paquet_id = pq.id
        JOIN ligne_paquet lp ON pq.id = lp.paquet_id
        JOIN produits p ON lp.produit_id = p.id
        JOIN produit_categorie pc ON p.id = pc.produit_id
        JOIN categories c ON pc.categorie_id = c.id
        GROUP BY LOWER(TRIM(c.nom))
    ) combined_data
    GROUP BY category  -- Merge duplicates
""", nativeQuery = true)
    List<Object[]> findSalesByCategory();

    // In CommandeRepository.java
    @Query(value = """
    SELECT COALESCE(SUM(c.total), 0)
    FROM commande c
    WHERE (c.type_paiment = 'EnLigne' 
           AND c.etat IN ('Livree', 'PayeEtEnCoursDeTraitement', 'EnTransit', 'EnCoursDeLivraison'))
       OR c.etat = 'LivreeEtPaye'
    """, nativeQuery = true)
    Double getTotalRevenue();


    // In CommandeRepository.java
    @Query(value = """
    SELECT AVG(c.total)
    FROM commande c
    WHERE (c.type_paiment = 'EnLigne' AND c.etat IN ('Livree', 'PayeEtEnCoursDeTraitement', 'EnTransit', 'EnCoursDeLivraison'))
       OR c.etat = 'LivreeEtPaye'
    """, nativeQuery = true)
    Double getAverageOrderValue();


    // Add these repository methods
    @Query("SELECT COUNT(c) FROM Commande c WHERE c.etat IN :states")
    long countByEtatIn(@Param("states") List<EtatCommande> states);

    @Query(value = """
    SELECT COALESCE(SUM(c.total), 0)
    FROM commande c
    WHERE c.date_commande BETWEEN :start AND :end
      AND (
        (c.type_paiment = 'EnLigne' AND c.etat IN ('Livree', 'PayeEtEnCoursDeTraitement', 'EnTransit', 'EnCoursDeLivraison'))
        OR c.etat = 'LivreeEtPaye'
      )
    """, nativeQuery = true)
    Double getTotalRevenueBetweenDates(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @Query(value = """
    SELECT 
        DATE(date_commande) as order_date,
        COUNT(id_commande) as order_count
    FROM commande
    WHERE date_commande >= :startDate AND date_commande < :endDate
    GROUP BY DATE(date_commande)
    ORDER BY DATE(date_commande)
""", nativeQuery = true)
    List<Object[]> findDailyOrdersBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    @Query("SELECT c.etat, COUNT(c) FROM Commande c GROUP BY c.etat")
    List<Object[]> countOrdersByStatus();
    @Query("SELECT c FROM Commande c " +
            "WHERE c.client.id = :clientId " +
            "ORDER BY c.dateCommande DESC")
    List<Commande> findCommandesByClientIdOrderByDateCommandeDesc(@Param("clientId") Long clientId);
}