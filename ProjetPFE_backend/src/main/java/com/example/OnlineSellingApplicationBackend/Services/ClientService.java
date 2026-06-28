package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.entities.*;
import com.example.OnlineSellingApplicationBackend.Repositories.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Exeptions.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClientService {

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private ProduitsRepository produitRepository;

    @Autowired
    private PaquetRepository paquetRepository;

    @Autowired
    private FavorisRepository favorisRepository;

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private LigneCommandeRepository ligneCommandeRepository;

    @Autowired
    private PaysRepository paysRepository;

    @Autowired
    private VilleRepository villeRepository;

    @Autowired
    private AdresseRepository adresseRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FileStorageService fileStorageService;

    public List<ClientInfoAdmin> getAllClients() {
        return clientRepository.findAll()
                .stream()
                .map(client -> {
                    ClientInfoResponse clientInfoResponse = new ClientInfoResponse(
                            client.getId(),
                            client.isActif(),
                            client.getNom(),
                            client.getEmail(),
                            client.getTel(),
                            client.getType() != null ? client.getType().toString() : "N/A",
                            client.getDescription(),
                            Optional.ofNullable(client.getEntreprise())
                                    .map(Entreprise::getNom)
                                    .orElse("N/A"),
                            Optional.ofNullable(client.getEntreprise())
                                    .map(Entreprise::getMatriculeFiscale)
                                    .orElse("N/A")
                    );

                    AddressResponse addressResponse = client.getAdresse() != null
                            ? new AddressResponse(client.getAdresse())
                            : null;

                    clientInfoResponse.setAddressResponse(addressResponse);

                    return new ClientInfoAdmin(clientInfoResponse, addressResponse);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Client registerClient(ClientRegistrationRequest request) {
        if (clientRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Client client = new Client();
        client.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        client.setActif(false);
        client.setNom(request.getNom());
        client.setTel(request.getTel());
        client.setType(request.getType());
        client.setProfil(request.getProfil());
        client.setEmail(request.getEmail());
        client.setEmailVerified(false);

        if (request.getAddress() != null) {
            Adresse address = processAddress(request.getAddress());
            client.setAdresse(address);
        }

        Client savedClient = clientRepository.save(client);

        String verificationCode = otpService.generateEmailVerificationCode(request.getEmail());
        emailService.sendVerificationEmail(request.getEmail(), verificationCode);

        return savedClient;
    }

    @Transactional
    public boolean verifyEmail(String email, String verificationCode) {
        if (otpService.validateOtp(email, verificationCode)) {
            Client client = clientRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Client not found with email: " + email));

            client.setEmailVerified(true);
            client.setActif(true);
            clientRepository.save(client);

            return true;
        }

        return false;
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with email: " + email));

        if (client.isEmailVerified()) {
            throw new IllegalStateException("Email is already verified");
        }

        String verificationCode = otpService.generateEmailVerificationCode(email);
        emailService.sendVerificationEmail(email, verificationCode);
    }

    public ClientInfoAdmin updateClientProfile(Long clientId, ClientRegistrationRequest updatedClient) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + clientId));

        if (updatedClient.getAddress() != null) {
            handleAddressUpdate(client, updatedClient.getAddress());
        }

        client.setMotDePasse(passwordEncoder.encode(updatedClient.getMotDePasse()));
        client.setActif(updatedClient.isActif());
        client.setNom(updatedClient.getNom());
        client.setTel(updatedClient.getTel());
        if (updatedClient.getType() != null &&
                (updatedClient.getType().equals(TypeClient.Individual) ||
                        updatedClient.getType().equals(TypeClient.Partner))) {
            client.setType(updatedClient.getType());
        } else {
            throw new IllegalArgumentException("Invalid client type");
        }
        client.setProfil(updatedClient.getProfil());
        client.setEmail(updatedClient.getEmail());

        Client clientResult = clientRepository.save(client);
        return new ClientInfoAdmin(
                new ClientInfoResponse(
                        clientResult.getId(),
                        clientResult.isActif(),
                        clientResult.getNom(),
                        clientResult.getEmail(),
                        clientResult.getTel(),
                        clientResult.getType() != null ? clientResult.getType().toString() : "N/A",
                        clientResult.getDescription(),
                        Optional.ofNullable(clientResult.getEntreprise())
                                .map(Entreprise::getNom)
                                .orElse("N/A"),
                        Optional.ofNullable(clientResult.getEntreprise())
                                .map(Entreprise::getMatriculeFiscale)
                                .orElse("N/A")
                ),
                clientResult.getAdresse() != null ? new AddressResponse(clientResult.getAdresse()) : null
        );
    }

    private void handleAddressUpdate(Client client, AddressResponse newAddressData) {
        if (client.getAdresse() != null) {
            Adresse oldAddress = client.getAdresse();
            Ville oldVille = oldAddress.getVille();
            Pays oldPays = oldVille.getPays();

            if (canDeleteAddress(client)) {
                client.setAdresse(null);
                clientRepository.save(client);

                adresseRepository.delete(oldAddress);
                cleanUpVilleAndPays(oldVille, oldPays);
            }
        }

        Adresse newAddress = processAddress(newAddressData);
        client.setAdresse(newAddress);
    }

    private void cleanUpVilleAndPays(Ville ville, Pays pays) {
        if (ville != null && adresseRepository.countByVille(ville) == 0) {
            villeRepository.delete(ville);
        }

        if (pays != null && villeRepository.countByPays(pays) == 0) {
            paysRepository.delete(pays);
        }
    }

    private boolean canDeleteAddress(Client client) {
        if (client.getAdresse() == null) {
            return true;
        }
        List<Client> otherClients = clientRepository.findClientsByAdresseId(
                client.getAdresse().getId(),
                client.getId()
        );
        List<Commande> orders = commandeRepository.findCommandesByAdresseId(
                client.getAdresse().getId()
        );
        return otherClients.isEmpty() && orders.isEmpty();
    }

    public boolean emailExists(String email) {
        return clientRepository.existsByEmail(email);
    }

    public void resetPassword(String email, String newPassword) {
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with email: " + email));

        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        client.setMotDePasse(passwordEncoder.encode(newPassword));
        clientRepository.save(client);
    }

    public List<ProduitDTO> getAllProducts() {
        return produitRepository.findAvailableProducts()
                .stream()
                .map(produit -> new ProduitDTO(
                        produit.getId(),
                        produit.getNom(),
                        produit.getDescription(),
                        produit.getPhotos(),
                        produit.getQuantite(),
                        produit.getPrix(),
                        produit.getCategories()
                ))
                .collect(Collectors.toList());
    }

    private Adresse processAddress(AddressResponse request) {
        String normalizedPays = request.getPays().trim().toLowerCase();
        String normalizedVille = request.getVille().trim().toLowerCase();
        String normalizedRue = request.getRue().trim().toLowerCase();
        String normalizedNumero = request.getNumero().trim().toLowerCase();
        String normalizedIndication = request.getIndication() != null ?
                request.getIndication().trim().toLowerCase() : "";

        List<AddressResponse> existingAddresses = adresseRepository.findExistingAddress(
                normalizedRue,
                normalizedNumero,
                normalizedVille,
                normalizedPays,
                normalizedIndication
        );

        if (!existingAddresses.isEmpty()) {
            return adresseRepository.findById(existingAddresses.get(0).getId())
                    .orElseThrow(() -> new RuntimeException("Address not found"));
        }

        List<Pays> existingPays = paysRepository.findByNomIgnoreCase(normalizedPays);
        Pays pays;
        if (!existingPays.isEmpty()) {
            pays = existingPays.get(0);
        } else {
            pays = new Pays(normalizedPays);
            pays = paysRepository.save(pays);
        }

        List<Ville> existingVilles = villeRepository.findByNomIgnoreCaseAndPays(normalizedVille, pays);
        Ville ville;
        if (!existingVilles.isEmpty()) {
            ville = existingVilles.get(0);
        } else {
            ville = new Ville(normalizedVille, pays);
            ville = villeRepository.save(ville);
        }

        Adresse newAdresse = new Adresse();
        newAdresse.setRue(normalizedRue);
        newAdresse.setNumero(normalizedNumero);
        newAdresse.setIndication(normalizedIndication);
        newAdresse.setVille(ville);
        return adresseRepository.save(newAdresse);
    }

    public List<Commande> getOrderHistory(Long clientId) {
        return commandeRepository.findCommandesByClientId(clientId);
    }

    public List<OrderHistoryDTO> mapCommandeToDTO(List<Commande> commandes) {
        List<OrderHistoryDTO> dtoList = new ArrayList<>();

        for (Commande commande : commandes) {
            OrderHistoryDTO dto = new OrderHistoryDTO();
            dto.setOrderId(commande.getIdCommande());
            dto.setOrderDate(commande.getDateCommande());
            dto.setOrderState(commande.getEtat().toString());

            List<OrderHistoryDTO.LigneCommandeDTO> ligneCommandes = new ArrayList<>();
            for (LigneCommande ligneCommande : commande.getLigneCommandes()) {
                OrderHistoryDTO.LigneCommandeDTO ligneDTO = new OrderHistoryDTO.LigneCommandeDTO();
                ligneDTO.setProductId(ligneCommande.getProduit().getId());
                ligneDTO.setProductName(ligneCommande.getProduit().getNom());
                ligneDTO.setQuantity(ligneCommande.getQuantite());
                ligneCommandes.add(ligneDTO);
            }
            dto.setLigneCommandes(ligneCommandes);
            dtoList.add(dto);
        }
        return dtoList;
    }

    public Map<String, Object> getClientInfo(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + clientId));

        Map<String, Object> response = new HashMap<>();
        response.put("id", client.getId());
        response.put("nom", client.getNom());
        response.put("email", client.getEmail());
        response.put("profil", client.getProfil());
        response.put("description", client.getDescription());
        response.put("tel", client.getTel());
        response.put("type", client.getType() != null ? client.getType().toString() : null);

        Entreprise entreprise = client.getEntreprise();
        if (entreprise != null) {
            response.put("matriculeFiscale", entreprise.getMatriculeFiscale());
            response.put("nomEntreprise", entreprise.getNom());
        }

        return response;
    }

    public List<ProduitDTO> getProductsByCategoryWithSubcategories(Long categoryId) {
        Categories category = categoriesRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + categoryId));

        Set<Produits> products = new HashSet<>();
        collectProducts(category, products);
        return products.stream()
                .map(produit -> new ProduitDTO(
                        produit.getId(),
                        produit.getNom(),
                        produit.getDescription(),
                        produit.getPhotos(),
                        produit.getQuantite(),
                        produit.getPrix(),
                        produit.getCategories()
                ))
                .collect(Collectors.toList());
    }

    private void collectProducts(Categories category, Set<Produits> products) {
        products.addAll(category.getProduits());
        if (category.getSubCategories() != null) {
            for (Categories subCategory : category.getSubCategories()) {
                collectProducts(subCategory, products);
            }
        }
    }

    private boolean hasValidPurchase(Client client, Produits product) {
        return commandeRepository.existsValidPurchaseForRating(
                client.getId(),
                product.getId(),
                List.of(EtatCommande.Livree, EtatCommande.EnRetour)
        );
    }

    public List<UserGrowthDTO> getUserGrowthData() {
        return clientRepository.findMonthlyUserGrowth().stream()
                .map(result -> new UserGrowthDTO(
                        (String) result[0],
                        ((Number) result[1]).intValue()
                ))
                .collect(Collectors.toList());
    }

    public List<ClientTypeDTO> getClientTypeDistribution() {
        return clientRepository.countUsersByClientType().stream()
                .map(result -> new ClientTypeDTO(
                        (String) result[0],
                        ((Number) result[1]).longValue()
                ))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getUsersStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = clientRepository.count();
        stats.put("totalUsers", totalUsers);

        long newUsersToday = clientRepository.countByRegistrationDate(LocalDateTime.now());
        stats.put("newUsersToday", newUsersToday);

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long activeUsers = clientRepository.countActiveUsers(thirtyDaysAgo);
        stats.put("activeUsers", activeUsers);

        double churnRate = 0.0;
        if (totalUsers > 0) {
            long churnedUsers = totalUsers - activeUsers;
            churnRate = (churnedUsers * 100.0) / totalUsers;
        }
        stats.put("churnRate", String.format("%.1f%%", churnRate));

        return stats;
    }

    public List<ClientInfoAdmin> getRecentClients() {
        return clientRepository.findTop10ByOrderByRegistrationDateDesc()
                .stream()
                .map(client -> {
                    ClientInfoResponse clientInfoResponse = new ClientInfoResponse(
                            client.getId(),
                            client.isActif(),
                            client.getNom(),
                            client.getEmail(),
                            client.getTel(),
                            client.getType() != null ? client.getType().toString() : "N/A",
                            client.getDescription(),
                            Optional.ofNullable(client.getEntreprise())
                                    .map(Entreprise::getNom)
                                    .orElse("N/A"),
                            Optional.ofNullable(client.getEntreprise())
                                    .map(Entreprise::getMatriculeFiscale)
                                    .orElse("N/A")
                    );
                    AddressResponse addressResponse = client.getAdresse() != null
                            ? new AddressResponse(client.getAdresse())
                            : null;
                    clientInfoResponse.setAddressResponse(addressResponse);
                    return new ClientInfoAdmin(clientInfoResponse, addressResponse);
                })
                .collect(Collectors.toList());
    }

    public Client getCurrentClient() {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if (currentEmail == null || currentEmail.equals("anonymousUser")) {
            throw new SecurityException("User is not authenticated");
        }
        return clientRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with email: " + currentEmail));
    }

    @Transactional
    public Client updateProfile(Long id, Client updatedClient, MultipartFile file) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + id));

        if (file != null && !file.isEmpty()) {
            String fileName = fileStorageService.storeFile(file);
            client.setProfil("/uploads/" + fileName);
        }

        client.setNom(updatedClient.getNom());
        client.setEmail(updatedClient.getEmail());
        client.setTel(updatedClient.getTel());

        if (updatedClient.getMotDePasse() != null && !updatedClient.getMotDePasse().isEmpty()) {
            client.setMotDePasse(passwordEncoder.encode(updatedClient.getMotDePasse()));
        }
        return clientRepository.save(client);
    }

    public ClientProfileWithAddressDTO getCurrentClientWithAddress() {
        Client client = getCurrentClient();

        AddressResponse addressResponse = client.getAdresse() != null
                ? new AddressResponse(client.getAdresse())
                : null;

        return new ClientProfileWithAddressDTO(client.getNom(), client.getTel(), addressResponse);
    }

    public AddressResponse updateClientAddress(Long clientId, AddressResponse newAddress) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + clientId));

        if (newAddress != null) {
            handleAddressUpdate(client, newAddress);
        }

        Client updatedClient = clientRepository.save(client);
        return updatedClient.getAdresse() != null ? new AddressResponse(updatedClient.getAdresse()) : null;
    }

    public Optional<Client> findClientByEmail(String email) {
        return clientRepository.findByEmail(email);
    }

    public void updateLastLogin(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + clientId));

        client.setLastLogin(LocalDateTime.now());
        clientRepository.save(client);
    }
}