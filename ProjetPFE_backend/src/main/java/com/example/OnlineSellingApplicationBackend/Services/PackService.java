package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.PackRequest;
import com.example.OnlineSellingApplicationBackend.Repositories.LigneCommandPackRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.LignePaquetRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.PaquetRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ProduitsRepository;
import com.example.OnlineSellingApplicationBackend.entities.LignePaquet;
import com.example.OnlineSellingApplicationBackend.entities.Paquet;
import com.example.OnlineSellingApplicationBackend.entities.Produits;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PackService {
    private final PaquetRepository paquetRepository;
    private final ProduitsRepository produitsRepository;
    private final LignePaquetRepository lignePaquetRepository;
    private final LigneCommandPackRepository ligneCommandPackRepository;
    @Autowired
    public PackService(PaquetRepository paquetRepository,
                       ProduitsRepository produitRepository,
                       LignePaquetRepository lignePaquetRepository,
                       LigneCommandPackRepository ligneCommandPackRepository) {
        this.paquetRepository = paquetRepository;
        this.produitsRepository = produitRepository;
        this.lignePaquetRepository = lignePaquetRepository;
        this.ligneCommandPackRepository = ligneCommandPackRepository;
    }

    private String saveImage(MultipartFile file) throws IOException {
        try {
            String uploadDir = Paths.get("uploads/pack").toAbsolutePath().toString();
            Path uploadPath = Paths.get(uploadDir);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = UUID.randomUUID() + "_" +
                    Objects.requireNonNull(file.getOriginalFilename()).replace(" ", "_");

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            return "pack/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image: " + e.getMessage());
        }
    }

    private void deleteExistingPhotos(Set<String> photos) {
        if (photos == null || photos.isEmpty()) return;

        for (String photoPath : photos) {
            try {
                Path path = Paths.get("uploads", photoPath);
                if (Files.exists(path)) {
                    Files.delete(path);
                }
            } catch (IOException e) {
                System.err.println("Failed to delete image: " + photoPath);
            }
        }
    }

    public Map<String, Object> createPack(PackRequest packRequest) throws IOException {
        if (packRequest.getProductIds().size() != packRequest.getQuantities().size()) {
            throw new IllegalArgumentException("Product IDs and quantities must be the same size");
        }

        Paquet pack = new Paquet();
        pack.setNom(packRequest.getNom());
        pack.setPrix(packRequest.getPrix());
        pack.setDisponibility(packRequest.getDisponibility() != null ? packRequest.getDisponibility() : true);
        pack.setQuantite(packRequest.getQuantite());

        if (packRequest.getPhotos() != null && !packRequest.getPhotos().isEmpty()) {
            Set<String> photoPaths = packRequest.getPhotos().stream()
                    .map(file -> {
                        try {
                            return saveImage(file);
                        } catch (IOException e) {
                            throw new RuntimeException("Failed to save image: " + e.getMessage());
                        }
                    })
                    .collect(Collectors.toSet());
            pack.setPhotos(photoPaths);
        }

        List<Produits> products = produitsRepository.findAllById(packRequest.getProductIds());
        if (products.size() != packRequest.getProductIds().size()) {
            throw new ResourceNotFoundException("Some products not found");
        }

        double totalValue = 0;
        List<LignePaquet> lines = new ArrayList<>();

        for (int i = 0; i < products.size(); i++) {
            Produits product = products.get(i);
            int quantity = packRequest.getQuantities().get(i);

            LignePaquet line = new LignePaquet();
            line.setProduit(product);
            line.setQuantite(quantity);
            line.setPaquet(pack);
            lines.add(line);

            totalValue += product.getPrix() * quantity;
        }

        if (packRequest.getPrix() >= totalValue) {
            throw new IllegalArgumentException("Pack price must be lower than total product value");
        }

        paquetRepository.save(pack);
        lignePaquetRepository.saveAll(lines);

        return buildPackResponse(pack);
    }

    @Transactional
    public Map<String, Object> updatePack(Long id, PackRequest packRequest) throws IOException {
        Paquet pack = paquetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pack not found"));

        if (packRequest.getPhotos() != null && !packRequest.getPhotos().isEmpty()) {
            deleteExistingPhotos(pack.getPhotos());
            pack.getPhotos().clear();
        }

        pack.setNom(packRequest.getNom());
        pack.setPrix(packRequest.getPrix());
        pack.setQuantite(packRequest.getQuantite());

        if (packRequest.getDisponibility() != null) {
            pack.setDisponibility(packRequest.getDisponibility());
        }

        if (packRequest.getPhotos() != null && !packRequest.getPhotos().isEmpty()) {
            Set<String> newPhotos = packRequest.getPhotos().stream()
                    .map(file -> {
                        try {
                            return saveImage(file);
                        } catch (IOException e) {
                            throw new RuntimeException("Failed to save image: " + e.getMessage());
                        }
                    })
                    .collect(Collectors.toSet());
            pack.setPhotos(newPhotos);
        }

        lignePaquetRepository.deleteByPaquetId(pack.getId());

        List<Produits> products = produitsRepository.findAllById(packRequest.getProductIds());
        if (products.size() != packRequest.getProductIds().size()) {
            throw new ResourceNotFoundException("Some products not found");
        }

        List<LignePaquet> lines = new ArrayList<>();
        double totalValue = 0;

        for (int i = 0; i < products.size(); i++) {
            Produits product = products.get(i);
            int quantity = packRequest.getQuantities().get(i);

            LignePaquet line = new LignePaquet();
            line.setPaquetId(pack.getId());
            line.setProduitId(product.getId());
            line.setQuantite(quantity);
            line.setPaquet(pack);
            line.setProduit(product);
            lines.add(line);

            totalValue += product.getPrix() * quantity;
        }

        if (packRequest.getPrix() >= totalValue) {
            throw new IllegalArgumentException("Pack price must be lower than total product value");
        }

        lignePaquetRepository.saveAll(lines);
        return buildPackResponse(paquetRepository.save(pack));
    }

    private Map<String, Object> buildPackResponse(Paquet pack) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", pack.getId());
        response.put("name", pack.getNom());
        response.put("price", pack.getPrix());
        response.put("disponibility", pack.getDisponibility());

        response.put("stock", pack.getQuantite());

        response.put("photos", pack.getPhotos() != null ?
                pack.getPhotos().stream()
                        .map(p -> p)
                        .collect(Collectors.toList()) :
                Collections.emptyList());

        List<Map<String, Object>> products = pack.getLignePaquets() != null ?
                pack.getLignePaquets().stream()
                        .map(line -> {
                            Map<String, Object> p = new LinkedHashMap<>();
                            p.put("id", line.getProduit().getId());
                            p.put("name", line.getProduit().getNom());
                            p.put("quantity", line.getQuantite());
                            p.put("unitPrice", line.getProduit().getPrix());
                            return p;
                        })
                        .collect(Collectors.toList()) :
                Collections.emptyList();

        response.put("products", products);
        return response;
    }

    public List<Map<String, Object>> getAllPacks() {
        return paquetRepository.findAll().stream()
                .map(this::buildPackResponse)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllAvailablePacks() {
        return paquetRepository.findAllAvailable().stream()
                .map(this::buildPackResponse)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getPackById(Long id) {
        Paquet pack = paquetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pack not found"));
        return buildPackResponse(pack);
    }

    public boolean isPackUsedInOrders(Long packId) {
        return ligneCommandPackRepository.existsByPaquetId(packId);
    }

    @Transactional
    public Map<String, Object> handlePackDeletion(Long id, boolean forceDeactivate) {
        Paquet pack = paquetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pack not found"));

        boolean usedInOrders = isPackUsedInOrders(id);
        Map<String, Object> result = new HashMap<>();

        if (usedInOrders || forceDeactivate) {
            // Just deactivate the pack
            pack.setDisponibility(false);
            paquetRepository.save(pack);

            result.put("success", true);
            result.put("action", "deactivated");
            result.put("message", "Pack has been deactivated because it is used in orders");
        } else {
            deleteExistingPhotos(pack.getPhotos());
            lignePaquetRepository.deleteAll(pack.getLignePaquets());
            paquetRepository.delete(pack);

            result.put("success", true);
            result.put("action", "deleted");
            result.put("message", "Pack has been permanently deleted");
        }

        return result;
    }

    public Map<String, Object> deletePack(Long id) {
        return handlePackDeletion(id, false);
    }

    public Map<String, Object> toggleDisponibility(Long id, boolean disponibility) {
        Paquet pack = paquetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pack not found"));

        pack.setDisponibility(disponibility);
        paquetRepository.save(pack);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("disponibility", disponibility);
        result.put("message", disponibility ? "Pack is now available" : "Pack is now unavailable");

        return result;
    }
}