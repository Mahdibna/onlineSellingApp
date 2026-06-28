package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.FavoriteProductDTO;
import com.example.OnlineSellingApplicationBackend.Repositories.*;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Favoris;
import com.example.OnlineSellingApplicationBackend.entities.Note;
import com.example.OnlineSellingApplicationBackend.entities.Produits;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FavoriteService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ProduitsRepository produitRepository;

    @Autowired
    private FavorisRepository favorisRepository;

    public Favoris addProductToFavorites(Long clientId, Long productId) {
        Optional<Client> client = clientRepository.findById(clientId);
        Optional<Produits> produit = produitRepository.findById(productId);

        if (client.isPresent() && produit.isPresent()) {
            Favoris favoris = new Favoris();
            favoris.setClientId(clientId);
            favoris.setProduitId(productId);
            favoris.setClient(client.get());
            favoris.setProduits(produit.get());
            return favorisRepository.save(favoris);
        }
        throw new RuntimeException("Client or Product not found");
    }

    public List<FavoriteProductDTO> getClientFavorites(Long clientId) {
        List<Long> produitIds = favorisRepository.findProduitIdsByClientId(clientId);
        List<FavoriteProductDTO> favoriteProducts = new ArrayList<>();

        for (Long id : produitIds) {
            Optional<Produits> produit = produitRepository.findById(id);
            produit.ifPresent(p -> {
                favoriteProducts.add(new FavoriteProductDTO(
                        clientId,
                        p.getId(),
                        p.getNom(),
                        p.getDescription(),
                        p.getPromotionPartenaire(),
                        p.getPromotionParticulier(),
                        p.getSelection(),
                        p.getPhotos(),
                        p.getPrix(),
                        p.isDisponibilite(),
                        calculateAverageRating(p.getNotes())
                ));
            });
        }
        return favoriteProducts;
    }
    private Double calculateAverageRating(Set<Note> notes) {
        if (notes == null || notes.isEmpty()) {
            return null;
        }
        return notes.stream()
                .mapToInt(Note::getRating)
                .average()
                .orElse(0.0);
    }
    @Transactional
    public void removeProductFromFavorites(Long clientId, Long productId) {
        if (!favorisRepository.existsByClientIdAndProduitId(clientId, productId)) {
            throw new ResourceNotFoundException("Favorite not found for client " + clientId + " and product " + productId);
        }
        favorisRepository.deleteByClientIdAndProduitId(clientId, productId);
    }
}