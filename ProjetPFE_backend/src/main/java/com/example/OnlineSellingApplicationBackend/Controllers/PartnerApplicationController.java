package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.PartnerApplicationDTO;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Services.FileStorageService;
import com.example.OnlineSellingApplicationBackend.Services.PartnerApplicationService;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.PartnerApplication;
import com.example.OnlineSellingApplicationBackend.entities.TypeClient;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partner-applications")
public class PartnerApplicationController {

    @Autowired
    private PartnerApplicationService partnerApplicationService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ClientRepository clientRepository;

    @GetMapping("/status")
    public ResponseEntity<?> checkApplicationStatus(Authentication authentication) {
        try {
            String email = authentication.getName();
            Client client = clientRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Client not found"));

            // Check if client is already a partner
            if (client.getType() == TypeClient.Partner) {
                Map<String, String> response = new HashMap<>();
                response.put("status", "APPROVED");
                return ResponseEntity.ok(response);
            }

            PartnerApplication.ApplicationStatus status =
                    partnerApplicationService.getClientApplicationStatus(client.getId());

            Map<String, String> response = new HashMap<>();
            response.put("status", status != null ? status.toString() : "NONE");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping
    public ResponseEntity<?> submitApplication(
            @RequestParam("businessName") String businessName,
            @RequestParam("businessAddress") String businessAddress,
            @RequestParam("businessDescription") String businessDescription,
            @RequestParam("contactPerson") String contactPerson,
            @RequestParam("contactPhone") String contactPhone,
            @RequestParam(value = "document", required = false) MultipartFile document,
            Authentication authentication) {

        try {
            // Store document if provided
            String documentPath = null;
            if (document != null && !document.isEmpty()) {
                documentPath = fileStorageService.storeFile(document);
            }

            PartnerApplication application = partnerApplicationService.createApplication(
                    authentication.getName(),
                    businessName,
                    businessAddress,
                    businessDescription,
                    contactPerson,
                    contactPhone,
                    documentPath
            );

            return ResponseEntity.ok(application);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/admin/pending")
    public List<PartnerApplicationDTO> getPendingApplications() {
        return partnerApplicationService.getPendingApplications();
    }


    @PutMapping("/admin/{applicationId}/approve")
    public ResponseEntity<?> approveApplication(@PathVariable Long applicationId) {
        try {
            Client updatedClient = partnerApplicationService.approveApplication(applicationId);
            return ResponseEntity.ok(updatedClient);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/admin/{applicationId}/reject")
    public ResponseEntity<?> rejectApplication(
            @PathVariable Long applicationId,
            @RequestParam(required = false) String rejectionReason) {
        try {
            PartnerApplication application = partnerApplicationService.rejectApplication(applicationId, rejectionReason);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}