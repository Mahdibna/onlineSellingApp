package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.SuperAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository

public interface SuperAdminRepository  extends JpaRepository<SuperAdmin, Long>{
    Optional<SuperAdmin> findByEmail(String email);
}
