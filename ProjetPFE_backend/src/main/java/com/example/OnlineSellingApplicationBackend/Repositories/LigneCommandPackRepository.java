package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.LigneCommandPack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LigneCommandPackRepository extends JpaRepository<LigneCommandPack, Long> {
    @Query("SELECT COUNT(l) > 0 FROM LigneCommandPack l WHERE l.paquet.id = :paquetId")
    boolean existsByPaquetId(@Param("paquetId") Long paquetId);

    List<LigneCommandPack> findByPaquetId(Long paquetId);
}