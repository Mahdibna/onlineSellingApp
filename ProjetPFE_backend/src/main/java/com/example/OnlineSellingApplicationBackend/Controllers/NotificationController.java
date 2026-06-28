package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.NotificationDTO;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Security.CustomUserDetails;
import com.example.OnlineSellingApplicationBackend.Services.ClientService;
import com.example.OnlineSellingApplicationBackend.Services.NotificationService;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private ClientService clientService;

    @GetMapping("/test-auth")
    public ResponseEntity<Map<String, Object>> testAuth(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        response.put("email", userDetails.getUsername());
        response.put("userId", userDetails.getUserId());
        response.put("roles", userDetails.getAuthorities());
        response.put("recipientId", getRecipientId(authentication));

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(Authentication authentication) {
        String recipientId = getRecipientId(authentication);
        return ResponseEntity.ok(notificationService.getUserNotifications(recipientId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        String recipientId = getRecipientId(authentication);

        long count = notificationService.getUnreadCount(recipientId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        String recipientId = getRecipientId(authentication);
        notificationService.markAllAsRead(recipientId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/fcm-token")
    public ResponseEntity<?> registerFcmToken(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        return ResponseEntity.ok().build();
    }

    private String getRecipientId(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        boolean isAdmin = userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")) ||
                userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_SUPERADMIN"));
        if (isAdmin) {
            return "admin";
        } else {
            return String.valueOf(userDetails.getUserId());
        }
    }
}