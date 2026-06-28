package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.FavoriteProductDTO;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Services.FavoriteService;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Favoris;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private FavoriteService favoriteService;

    private Client getCurrentClient() {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        return clientRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Client non trouvé avec l'email: " + currentEmail));
    }



    @PostMapping("/products/{productId}")
    public ResponseEntity<Favoris> addProductToFavorites(@PathVariable Long productId) {
        Client currentClient = getCurrentClient();
        Favoris favoris = favoriteService.addProductToFavorites(currentClient.getId(), productId);
        return ResponseEntity.ok(favoris);
    }


    @GetMapping
    public ResponseEntity<List<FavoriteProductDTO>> getCurrentClientFavorites() {
        Client currentClient = getCurrentClient();
        List<FavoriteProductDTO> favoriteProducts = favoriteService.getClientFavorites(currentClient.getId());
        return ResponseEntity.ok(favoriteProducts);
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<?> removeProductFromFavorites(@PathVariable Long productId) {
        try {
            Client currentClient = getCurrentClient();
            favoriteService.removeProductFromFavorites(currentClient.getId(), productId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }




}

