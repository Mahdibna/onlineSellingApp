package com.example.OnlineSellingApplicationBackend.Controllers;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Security.JwtUtils;
import com.example.OnlineSellingApplicationBackend.Services.CommandeService;
import com.example.OnlineSellingApplicationBackend.Services.EmailService;
import com.example.OnlineSellingApplicationBackend.Services.OtpService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;

import com.example.OnlineSellingApplicationBackend.Exeptions.RatingNotAllowedException;
import com.example.OnlineSellingApplicationBackend.Security.CustomUserDetails;
import com.example.OnlineSellingApplicationBackend.Security.UserDetailsServiceImpl;
import com.example.OnlineSellingApplicationBackend.Services.ClientService;
import com.example.OnlineSellingApplicationBackend.entities.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.example.OnlineSellingApplicationBackend.DTO.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/clients")
public class ClientController {
    @Autowired
    private ClientService clientService;
    @Autowired
    private CommandeService commandeService;
    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    @Autowired
    private OtpService otpService;
    @Autowired
    private EmailService emailService;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final Logger logger = LoggerFactory.getLogger(ClientController.class);

    @GetMapping("/all")
    public ResponseEntity<List<ClientInfoAdmin>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String email, @RequestParam String code) {
        try {
            boolean verified = clientService.verifyEmail(email, code);

            if (verified) {
                return ResponseEntity.ok(Map.of(
                        "message", "Email verified successfully",
                        "verified", true
                ));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Invalid or expired verification code",
                        "verified", false
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Error verifying email: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerificationEmail(@RequestParam String email) {
        try {
            Client client = clientRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Client not found with email: " + email));
            if (client.isEmailVerified()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Email is already verified"
                ));
            }
            String verificationCode = otpService.generateEmailVerificationCode(email);
            emailService.sendVerificationEmail(email, verificationCode);

            return ResponseEntity.ok(Map.of(
                    "message", "Verification email sent successfully"
            ));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Error sending verification email: " + e.getMessage()
            ));
        }
    }
    @PostMapping("/register")
    public ResponseEntity<?> registerClient(@RequestBody ClientRegistrationRequest request) {
        try {
            Client client = clientService.registerClient(request);
            return ResponseEntity.ok(client);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "timestamp", Instant.now()
            ));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "Duplicate address components detected",
                    "resolution", "Automatic deduplication in progress",
                    "timestamp", Instant.now()
            ));
        }
    }
    @GetMapping("/{clientId}")
    public ResponseEntity<Map<String, Object>> getClientInfo(@PathVariable Long clientId) {
        try {
            Map<String, Object> clientInfo = clientService.getClientInfo(clientId);
            return ResponseEntity.ok(clientInfo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update client profile.
     */
    @PutMapping("/{clientId}")
    public ResponseEntity<?> updateClientProfile(
            @PathVariable Long clientId,
            @RequestBody ClientRegistrationRequest updatedClient,
            HttpServletRequest request
    ) {
        if (updatedClient == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Request body cannot be null"));
        }
        if (updatedClient.getType() == null ||
                (!updatedClient.getType().equals(TypeClient.Individual) &&
                        !updatedClient.getType().equals(TypeClient.Partner))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid client type"));
        }

        String oldEmail = ((CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();

        try {
            ClientInfoAdmin client = clientService.updateClientProfile(clientId, updatedClient);
            CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(client.getClientInfoResponse().getEmail());
            String newToken = jwtUtils.generateToken(
                    client.getClientInfoResponse().getEmail(),
                    userDetails.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList()),
                    userDetails.getUserId()
            );
            return ResponseEntity.ok(Map.of(
                    "client", client,
                    "token", newToken
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<?> initiatePasswordReset(@RequestParam String email) {
        try {
            if (!clientService.emailExists(email)) {
                return ResponseEntity.ok().build();
            }

            String otp = otpService.generateOtp(email);
            emailService.sendPasswordResetOtp(email, otp);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Password reset error for email: {}", email, e);
            return ResponseEntity.internalServerError().body("Error processing request");
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam String email,
                                       @RequestParam String otp) {
        try {
            if (otpService.validateOtp(email, otp)) {
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error verifying OTP");
        }
    }


    @PutMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestParam String email,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword) {

        try {
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest().body("Passwords do not match");
            }

            if (newPassword.length() < 8) {
                return ResponseEntity.badRequest().body("Password must be at least 8 characters");
            }

            clientService.resetPassword(email, newPassword);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error resetting password");
        }
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProduitDTO>> getAllProducts() {
        List<ProduitDTO> products = clientService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/products/categories/{categoryId}")
    public List<ProduitDTO> getProductsByCategoryAndSubcategories(@PathVariable Long categoryId) {
        return clientService.getProductsByCategoryWithSubcategories(categoryId);
    }
    @GetMapping("/stats/growth")
    public ResponseEntity<List<UserGrowthDTO>> getUserGrowth() {
        return ResponseEntity.ok(clientService.getUserGrowthData());
    }

    @GetMapping("stats/client-types")
    public ResponseEntity<List<ClientTypeDTO>> getClientTypeDistribution() {
        return ResponseEntity.ok(clientService.getClientTypeDistribution());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUsersStats() {
        return ResponseEntity.ok(clientService.getUsersStats());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ClientInfoAdmin>> getRecentClients() {
        return ResponseEntity.ok(clientService.getRecentClients());
    }
    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentClientProfile() {
        try {
            Client client = clientService.getCurrentClient();
            Map<String, String> response = new HashMap<>();
            response.put("name", client.getNom());
            response.put("email", client.getEmail());
            response.put("profil", client.getProfil());
            response.put("tel", client.getTel());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Client> updateClient(
            @RequestPart("updatedClient") String updatedClientStr,
            @RequestParam("currentPassword") String currentPassword,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        try {
            Client updatedClient = new ObjectMapper().readValue(updatedClientStr, Client.class);

            // Récupérer l'utilisateur courant
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Client client = clientRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Client not found"));

            // Vérifier le mot de passe
            if (!passwordEncoder.matches(currentPassword, client.getMotDePasse())) {
                throw new RuntimeException("Current password is incorrect");
            }

            // Mettre à jour le profil
            Client result = clientService.updateProfile(client.getId(), updatedClient, file);
            return ResponseEntity.ok(result);

        } catch (JsonProcessingException e) {
            return ResponseEntity.badRequest().build(); // ou un message plus clair si tu veux
        }
    }

    @GetMapping("/profile/address")
    public ResponseEntity<?> getCurrentClientWithAddress() {
        try {
            ClientProfileWithAddressDTO response = clientService.getCurrentClientWithAddress();
            // Always return 200 OK with the client data
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/profile/address")
    public ResponseEntity<?> updateCurrentClientAddress(@RequestBody AddressResponse addressUpdate) {
        try {
            Client currentClient = clientService.getCurrentClient();

            AddressResponse updatedAddress = clientService.updateClientAddress(
                    currentClient.getId(),
                    addressUpdate
            );

            return ResponseEntity.ok(updatedAddress);

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while updating the address.");
        }
    }
    @PostMapping("/profile/address")
    public ResponseEntity<?> addCurrentClientAddress(@RequestBody AddressResponse addressData) {
        try {
            Client currentClient = clientService.getCurrentClient();

            // For adding a new address, we use the same method as updating
            AddressResponse updatedAddress = clientService.updateClientAddress(
                    currentClient.getId(),
                    addressData
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(updatedAddress);

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while adding the address.");
        }
    }
    @GetMapping("/profile/orders")
    public ResponseEntity<Map<String, List<ClientOrderDTO>>> getClientOrders() {
        // Get authenticated client ID (you'll need to implement this based on your auth system)
        Long clientId = clientService.getCurrentClient().getId(); // You need to implement this method

        Map<String, List<ClientOrderDTO>> orders = commandeService.getClientOrdersGroupedByStatus(clientId);
        return ResponseEntity.ok(orders);
    }
}
