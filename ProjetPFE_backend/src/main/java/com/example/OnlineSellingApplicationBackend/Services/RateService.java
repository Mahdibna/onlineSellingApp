package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.RatingRequest;
import com.example.OnlineSellingApplicationBackend.DTO.RatingUpdateRequest;
import com.example.OnlineSellingApplicationBackend.Exeptions.RatingNotAllowedException;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.CommandeRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.NoteRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ProduitsRepository;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.EtatCommande;
import com.example.OnlineSellingApplicationBackend.entities.Note;
import com.example.OnlineSellingApplicationBackend.entities.Produits;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RateService {

    @Autowired
    private ProduitsRepository produitRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private NoteRepository noteRepository;
    @Autowired
    private CommandeRepository commandeRepository;

    public Note addRating(RatingRequest request) {
        // Validate client and product exist
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client not found"));

        Produits product = produitRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (noteRepository.findByClientIdAndProduitId(request.getClientId(), request.getProductId()).isPresent()) {
            throw new RatingNotAllowedException("You have already rated this product. Use update instead.");
        }


        if (!hasValidPurchase(client, product)) {
            throw new RatingNotAllowedException(
                    "Oops! You need to buy this item before you can rate it"
            );
        }


        // Create new rating
        Note rating = new Note();
        rating.setClient(client);
        rating.setProduit(product);
        rating.setRating(request.getRating());
        rating.setCommentaire(request.getComment());
        rating.setDate(LocalDateTime.now());

        return noteRepository.save(rating);
    }

    private boolean hasValidPurchase(Client client, Produits product) {
        return commandeRepository.existsValidPurchaseForRating(
                client.getId(),
                product.getId(),
                List.of(EtatCommande.Livree, EtatCommande.LivreeEtPaye, EtatCommande.EnRetour)
        );
    }

    public Note updateRating(Long clientId, Long productId, RatingUpdateRequest request) {
        Note existingRating = noteRepository.findByClientIdAndProduitId(clientId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found"));

        existingRating.setRating(request.getRating());
        existingRating.setCommentaire(request.getComment());
        existingRating.setDate(LocalDateTime.now());

        return noteRepository.save(existingRating);
    }

    public Note getRating(Long clientId, Long productId) {
        return noteRepository.findByClientIdAndProduitId(clientId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found"));
    }
}