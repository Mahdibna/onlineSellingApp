package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.FormattedReclamationResponse;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.CommandeRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ReclamationRepository;
import com.example.OnlineSellingApplicationBackend.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ReclamationService {

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private CommandeRepository commandeRepository;
    @Autowired
    private NotificationService notificationService;
    public ResponseEntity<?> ajouterReclamation(Long clientId, Reclamation reclamation) {
        Client client = clientRepository.findById(clientId).orElse(null);

        if (client == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Client non trouvé.");
        }

        // Vérifier si le client a passé au moins une commande
        if (client.getCommandes() == null || client.getCommandes().isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Le client doit d'abord passer des commandes avant de soumettre une réclamation.");
        }

        Commande commande = commandeRepository.findById(reclamation.getCommande().getIdCommande()).orElse(null);

        if (commande == null || !commande.getClient().getId().equals(clientId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La commande spécifiée n'existe pas ou n'appartient pas à ce client.");
        }
        if (reclamation.getTitle() == null || reclamation.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Le titre est obligatoire.");
        }
        if (reclamation.getDescription() == null || reclamation.getDescription().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("La description est obligatoire.");
        }
        if (reclamation.getType() == null) {
            return ResponseEntity.badRequest().body("Le type de réclamation est obligatoire.");
        }

        reclamation.setClient(client);
        reclamation.setCommande(commande);

        if (reclamation.getDateReclamation() == null) {
            reclamation.setDateReclamation(new java.util.Date());
        }

        Reclamation savedReclamation = reclamationRepository.save(reclamation);
        notificationService.sendNotification(
                "New Complaint Filed",
                "A new complaint has been filed regarding order #" + reclamation.getCommande().getIdCommande(),
                Notification.NotificationType.NEW_COMPLAINT,
                "admin",
                savedReclamation.getIdReclamation()
        );
        return ResponseEntity.ok(savedReclamation);
    }

    public List<FormattedReclamationResponse> getAllReclamations() {
        List<Reclamation> reclamations = reclamationRepository.findAll();
        List<FormattedReclamationResponse> formattedReclamations = new ArrayList<>();

        for (Reclamation reclamation : reclamations) {
            String clientName = reclamation.getClient().getNom();
            String title = reclamation.getTitle();
            String description = reclamation.getDescription();
            String date = reclamation.getDateReclamation() != null ? reclamation.getDateReclamation().toString() : "Date non disponible";
            Long commandeId = reclamation.getCommande() != null ? reclamation.getCommande().getIdCommande() : null;
            String type = reclamation.getType() != null ? reclamation.getType().name() : "";
            String status = reclamation.getStatus() != null ? reclamation.getStatus().name() : "";
            String tel = reclamation.getClient().getTel();
            String email = reclamation.getClient().getEmail();

            FormattedReclamationResponse response = new FormattedReclamationResponse(
                    clientName,
                    title,
                    description,
                    date,
                    commandeId,
                    reclamation.getIdReclamation(),
                    type,
                    status,
                    tel,
                    email
            );
            formattedReclamations.add(response);
        }

        return formattedReclamations;
    }

    public List<Reclamation> getReclamationsByClient(Long clientId) {
        return reclamationRepository.findAllByClientId(clientId);
    }

    public void deleteReclamation(Long id) {
        // Check if the reclamation exists before trying to delete
        if (!reclamationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Reclamation not found with id: " + id);
        }

        reclamationRepository.deleteById(id);
    }

    public FormattedReclamationResponse getReclamationById(Long id) {
        Reclamation reclamation = reclamationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reclamation not found with id: " + id));

        return new FormattedReclamationResponse(
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
        );
    }

    public ResponseEntity<?> updateReclamationStatus(Long id, StatusReclamation newStatus) {
        Reclamation reclamation = reclamationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réclamation introuvable"));

        if (newStatus == null) {
            return ResponseEntity.badRequest().body("Statut invalide");
        }

        reclamation.setStatus(newStatus);
        reclamationRepository.save(reclamation);
        notificationService.notifyComplaintStatusChange(
                id,
                reclamation.getClient().getId().toString(),
                newStatus.toString()
        );
        return ResponseEntity.ok(reclamation);
    }
}