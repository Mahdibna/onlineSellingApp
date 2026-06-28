package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.PartnerApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;// PartnerApplicationRepository.java
@Repository
public interface PartnerApplicationRepository extends JpaRepository<PartnerApplication, Long> {
    List<PartnerApplication> findByStatus(PartnerApplication.ApplicationStatus status);
    List<PartnerApplication> findByClientId(Long clientId);
}