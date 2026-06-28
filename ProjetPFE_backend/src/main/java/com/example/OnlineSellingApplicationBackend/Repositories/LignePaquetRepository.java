package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.ClePaquet;
import com.example.OnlineSellingApplicationBackend.entities.LignePaquet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface LignePaquetRepository extends JpaRepository<LignePaquet, ClePaquet> {
    List<LignePaquet> findByPaquetId(Long paquetId);

    @Transactional
    @Modifying
    void deleteByPaquetId(Long paquetId);

}