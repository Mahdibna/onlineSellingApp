package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.PackRequest;
import com.example.OnlineSellingApplicationBackend.DTO.PackUpdateRequest;
import com.example.OnlineSellingApplicationBackend.Repositories.AdminRepository;
import com.example.OnlineSellingApplicationBackend.Services.AdminService;
import com.example.OnlineSellingApplicationBackend.Services.PackService;
import com.example.OnlineSellingApplicationBackend.entities.Admin;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.SuperAdmin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private AdminRepository adminRepository;
    @Autowired
    private AdminService adminService;
    @PutMapping("/{clientId}/desactiver")
    public ResponseEntity<String> desactiverActiverClient(@PathVariable Long clientId) {
        if (adminService.desactiverActiverClient(clientId)) {
            return ResponseEntity.ok("Client status is changed.");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client non trouvé.");
    }
    @GetMapping("/{clientId}/stats")
    public ResponseEntity<?> getClientOrderStats(@PathVariable Long clientId) {
        Map<String, Object> stats = adminService.getClientOrderStatistics(clientId);
        return stats != null ? ResponseEntity.ok(stats)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client non trouvé.");
    }
    @PutMapping("/{clientId}")
    public ResponseEntity<String> updateClientInfo(@PathVariable Long clientId, @RequestBody Client updatedClient) {
        if (adminService.updateClientInfo(clientId, updatedClient)) {
            return ResponseEntity.ok("Informations du client mises à jour avec succès.");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client non trouvé.");
    }

    @GetMapping("/clients/statistics")
    public ResponseEntity<List<Map<String, Object>>> getClientStatistics() {
        return ResponseEntity.ok(adminService.getClientStatistics());
    }


    @GetMapping("/profile")
    public ResponseEntity<Admin> getCurrentAdminProfile() {
        Admin admin = adminService.getCurrentAdmin();
        return ResponseEntity.ok(admin);
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Admin> updateAdmin(
            @RequestPart("updatedAdmin") Admin updatedAdmin,
            @RequestParam("currentPassword") String currentPassword,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Super Admin not found"));
        if (!passwordEncoder.matches(currentPassword, admin.getMotDePasse())) {
            throw new RuntimeException("Current password is incorrect");
        }

        Admin result = adminService.updateProfile(admin.getId(), updatedAdmin, file);
        return ResponseEntity.ok(result);
    }
}