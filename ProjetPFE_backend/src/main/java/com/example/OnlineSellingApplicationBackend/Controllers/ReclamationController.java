package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.FormattedReclamationResponse;
import com.example.OnlineSellingApplicationBackend.DTO.UpdateStatusDTO;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Services.ReclamationService;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Reclamation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reclamations")
public class ReclamationController {
    @Autowired
    private ReclamationService reclamationService;

    @Autowired
    private ClientRepository clientRepository;

    private Client getCurrentClient() {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return clientRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Client non trouvé avec l'email: " + currentEmail));
    }
    @PostMapping
    public ResponseEntity<?> submitReclamation(@RequestBody Reclamation reclamation) {
        Client currentClient = getCurrentClient();
        return reclamationService.ajouterReclamation(currentClient.getId(), reclamation);
    }
    @GetMapping("/all")
    public ResponseEntity<List<FormattedReclamationResponse>> getAllReclamations() {
        List<FormattedReclamationResponse> reclamations = reclamationService.getAllReclamations();
        return ResponseEntity.ok(reclamations);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReclamation(@PathVariable Long id) {
        reclamationService.deleteReclamation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/clients/{clientId}")
    public ResponseEntity<List<Reclamation>> getReclamationsByClient(@PathVariable Long clientId) {
        List<Reclamation> reclamations = reclamationService.getReclamationsByClient(clientId);
        return ResponseEntity.ok(reclamations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormattedReclamationResponse> getReclamationById(@PathVariable Long id) {
        FormattedReclamationResponse response = reclamationService.getReclamationById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusDTO dto) {
        return reclamationService.updateReclamationStatus(id, dto.getStatus());
    }


    @GetMapping("/my-reclamations")
    public ResponseEntity<List<FormattedReclamationResponse>> getMyReclamations() {
        Client currentClient = getCurrentClient();
        List<Reclamation> reclamations = reclamationService.getReclamationsByClient(currentClient.getId());

        List<FormattedReclamationResponse> formattedResponses = reclamations.stream()
                .map(reclamation -> new FormattedReclamationResponse(
                        reclamation.getClient().getNom(),
                        reclamation.getTitle(),
                        reclamation.getDescription(),
                        reclamation.getDateReclamation() != null ? reclamation.getDateReclamation().toString() : "Date non disponible",
                        reclamation.getCommande() != null ? reclamation.getCommande().getIdCommande() : null,
                        reclamation.getIdReclamation(),
                        reclamation.getType() != null ? reclamation.getType().name() : "",
                        reclamation.getStatus() != null ? reclamation.getStatus().name() : "",
                        reclamation.getClient().getTel(),
                        reclamation.getClient().getEmail()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(formattedResponses);
    }

}