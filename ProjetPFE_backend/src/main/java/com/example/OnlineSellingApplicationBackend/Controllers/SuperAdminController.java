package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.Repositories.AdminRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.SuperAdminRepository;
import com.example.OnlineSellingApplicationBackend.Services.FileStorageService;
import com.example.OnlineSellingApplicationBackend.entities.Admin;
import com.example.OnlineSellingApplicationBackend.Services.SuperAdminService;
import com.example.OnlineSellingApplicationBackend.entities.SuperAdmin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/superadmin")

public class SuperAdminController {

    @Autowired
    private SuperAdminService superAdminService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private AdminRepository adminRepository;
    @Autowired
    private FileStorageService fileStorageService;
    @Autowired
    private SuperAdminRepository superAdminRepository;
    private final String UPLOAD_DIR = "uploads/profile-images/";


    @PostMapping
    public ResponseEntity<?> addSuperAdmin(@RequestBody SuperAdmin superAdmin) {
        try {
            SuperAdmin registeredAdmin = superAdminService.ajouterSuperAdmin(superAdmin);
            return ResponseEntity.ok(registeredAdmin);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
    @PostMapping(value = "/admins", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Admin> addAdmin(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam(value = "profil", required = false) MultipartFile profil) {

        String encodedPassword = passwordEncoder.encode(password);

        Admin admin = new Admin();
        admin.setNom(name);
        admin.setEmail(email);
        admin.setMotDePasse(encodedPassword);

        if (profil != null && !profil.isEmpty()) {
            String profilePath = fileStorageService.CreateFile(profil);
            admin.setProfil(profilePath);
        }

        Admin savedAdmin = adminRepository.save(admin);
        return ResponseEntity.ok(savedAdmin);
    }

    @PutMapping(value = "/admins/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Admin> updateAdmin(
            @PathVariable Long id,
            @RequestParam("nom") String nom,
            @RequestParam("email") String email,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "profil", required = false) MultipartFile profilFile) {
        // Implementation


        Admin updatedAdmin = superAdminService.modifierAdmin(
                id,
                nom,
                email,
                password,
                profilFile
        );
        return ResponseEntity.ok(updatedAdmin);
    }

    @DeleteMapping("/admins/{adminId}")
    public ResponseEntity<String> deleteAdmin(@PathVariable Long adminId) {
        superAdminService.supprimerAdmin(adminId);
        return ResponseEntity.ok("Admin deleted successfully!");
    }

    @GetMapping("/admins")
    public ResponseEntity<List<Admin>> getAllAdmins() {
        return ResponseEntity.ok(superAdminService.listerAdmins());
    }

    @GetMapping("/profile")
    public ResponseEntity<SuperAdmin> getCurrentSuperAdminProfile() {
        SuperAdmin superAdmin = superAdminService.getCurrentSuperAdmin();
        return ResponseEntity.ok(superAdmin);
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SuperAdmin> updateSuperAdmin(
            @RequestPart("updatedSuperAdmin") SuperAdmin updatedSuperAdmin,
            @RequestParam("currentPassword") String currentPassword,
            @RequestPart(value = "file", required = false) MultipartFile file) {



        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        SuperAdmin superAdmin = superAdminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Super Admin not found"));

        if (!passwordEncoder.matches(currentPassword, superAdmin.getMotDePasse())) {
            throw new RuntimeException("Current password is incorrect");
        }

        SuperAdmin result = superAdminService.updateProfile(superAdmin.getId(), updatedSuperAdmin, file);
        return ResponseEntity.ok(result);
    }
    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(superAdminService.getDashboardStats());
    }

}
