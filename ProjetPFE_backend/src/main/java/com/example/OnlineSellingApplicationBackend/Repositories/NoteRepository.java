package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    @Query("DELETE FROM Note n WHERE n.client.id = :clientId")
    void deleteByClientId(Long clientId);
    @Query("SELECT n FROM Note n WHERE n.client.id = :clientId AND n.produit.id = :productId")
    Optional<Note> findByClientIdAndProduitId(
            @Param("clientId") Long clientId,
            @Param("productId") Long productId
    );

}
