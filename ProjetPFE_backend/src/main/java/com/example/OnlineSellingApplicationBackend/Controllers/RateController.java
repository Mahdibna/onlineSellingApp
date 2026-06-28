package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.RatingRequest;
import com.example.OnlineSellingApplicationBackend.DTO.RatingUpdateRequest;
import com.example.OnlineSellingApplicationBackend.DTO.ReviewDTO;
import com.example.OnlineSellingApplicationBackend.Exeptions.RatingNotAllowedException;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Services.RateService;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Note;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rate")
public class RateController {
    @Autowired
    private RateService rateService;
    @Autowired
    private ClientRepository clientRepository;

    public Client getCurrentClient() {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        return clientRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with email: " + currentEmail));
    }

    /**
     * Add a product rating.
     */
    @PostMapping
    public ResponseEntity<?> addRating(@RequestBody RatingRequest request) {
        try {
            Note createdRating = rateService.addRating(request);
            return ResponseEntity.ok(createdRating);
        } catch (RatingNotAllowedException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }
    @PutMapping("/ratings/{productId}")
    public ResponseEntity<?> updateRating(
            @PathVariable Long productId,
            @RequestBody RatingUpdateRequest request) {
        try {
            Long clientId = getCurrentClient().getId();
            Note updatedRating = rateService.updateRating(clientId, productId, request);
            return ResponseEntity.ok(updatedRating);
        } catch (RatingNotAllowedException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    @GetMapping("/rating/{productId}")
    public ResponseEntity<?> getRating(@PathVariable Long productId) {
        try {
            Long clientId = getCurrentClient().getId();
            Note note = rateService.getRating(clientId, productId);
            return ResponseEntity.ok(note);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }
}