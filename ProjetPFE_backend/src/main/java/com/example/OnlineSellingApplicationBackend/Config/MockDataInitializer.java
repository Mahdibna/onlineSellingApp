package com.example.OnlineSellingApplicationBackend.Config;

import com.example.OnlineSellingApplicationBackend.Repositories.AdresseRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.AdminRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.CategoriesRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.CommandeRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.EntrepriseRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.PaysRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ProduitsRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.SuperAdminRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.VilleRepository;
import com.example.OnlineSellingApplicationBackend.entities.Adresse;
import com.example.OnlineSellingApplicationBackend.entities.Admin;
import com.example.OnlineSellingApplicationBackend.entities.Categories;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Commande;
import com.example.OnlineSellingApplicationBackend.entities.Entreprise;
import com.example.OnlineSellingApplicationBackend.entities.EtatCommande;
import com.example.OnlineSellingApplicationBackend.entities.LigneCommande;
import com.example.OnlineSellingApplicationBackend.entities.Pays;
import com.example.OnlineSellingApplicationBackend.entities.Produits;
import com.example.OnlineSellingApplicationBackend.entities.SuperAdmin;
import com.example.OnlineSellingApplicationBackend.entities.TypeClient;
import com.example.OnlineSellingApplicationBackend.entities.TypeCommande;
import com.example.OnlineSellingApplicationBackend.entities.TypePaiment;
import com.example.OnlineSellingApplicationBackend.entities.Ville;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
public class MockDataInitializer implements CommandLineRunner {

    private final PaysRepository paysRepository;
    private final VilleRepository villeRepository;
    private final AdresseRepository adresseRepository;
    private final ClientRepository clientRepository;
    private final AdminRepository adminRepository;
    private final SuperAdminRepository superAdminRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final CategoriesRepository categoriesRepository;
    private final ProduitsRepository produitsRepository;
    private final CommandeRepository commandeRepository;
    private final PasswordEncoder passwordEncoder;

    public MockDataInitializer(
            PaysRepository paysRepository,
            VilleRepository villeRepository,
            AdresseRepository adresseRepository,
            ClientRepository clientRepository,
            AdminRepository adminRepository,
            SuperAdminRepository superAdminRepository,
            EntrepriseRepository entrepriseRepository,
            CategoriesRepository categoriesRepository,
            ProduitsRepository produitsRepository,
            CommandeRepository commandeRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.paysRepository = paysRepository;
        this.villeRepository = villeRepository;
        this.adresseRepository = adresseRepository;
        this.clientRepository = clientRepository;
        this.adminRepository = adminRepository;
        this.superAdminRepository = superAdminRepository;
        this.entrepriseRepository = entrepriseRepository;
        this.categoriesRepository = categoriesRepository;
        this.produitsRepository = produitsRepository;
        this.commandeRepository = commandeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedMockData();
    }

    private void seedMockData() {
        Pays tunisia = getOrCreateCountry("Tunisia");
        Ville tunis = getOrCreateCity("Tunis", tunisia);
        Ville sfax = getOrCreateCity("Sfax", tunisia);

        Adresse clientAddress = getOrCreateAddress("Habib Bourguiba", "12", "Near city center", tunis);
        Adresse partnerAddress = getOrCreateAddress("Hedi Chaker", "45", "Industrial zone", sfax);

        SuperAdmin superAdmin = getOrCreateSuperAdmin();
        Admin admin = getOrCreateAdmin();
        Client client = getOrCreateStandardClient(clientAddress);
        Client partner = getOrCreatePartnerClient(partnerAddress);
        getOrCreateEntreprise(partner);

        Categories electronics = getOrCreateCategory(
                "Electronics",
                "Electronic products and accessories",
                "uploads/categories/mock-electronics.png",
                null
        );
        Categories fashion = getOrCreateCategory(
                "Fashion",
                "Clothing, shoes and accessories",
                "uploads/categories/mock-fashion.png",
                null
        );
        Categories audio = getOrCreateCategory(
                "Audio",
                "Speakers, headphones and audio devices",
                "uploads/categories/mock-audio.png",
                electronics
        );
        Categories shoes = getOrCreateCategory(
                "Shoes",
                "Sneakers and daily footwear",
                "uploads/categories/mock-shoes.png",
                fashion
        );

        Produits headphones = getOrCreateProduct(
                "MOCK-HEADPHONES",
                "Bluetooth Headphones",
                "Wireless over-ear headphones for everyday listening.",
                249.90,
                12,
                10,
                5,
                true,
                "featured",
                Set.of("products/mock-headphones.png"),
                Set.of(audio, electronics)
        );

        Produits speaker = getOrCreateProduct(
                "MOCK-SPEAKER",
                "Portable Speaker",
                "Compact speaker with strong battery life for indoor and outdoor use.",
                179.90,
                18,
                8,
                4,
                true,
                "new",
                Set.of("products/mock-speaker.png"),
                Set.of(audio, electronics)
        );

        Produits sneakers = getOrCreateProduct(
                "MOCK-SNEAKERS",
                "Running Sneakers",
                "Comfortable lightweight sneakers suitable for training and city walks.",
                139.90,
                25,
                12,
                6,
                true,
                "top-rated",
                Set.of("products/mock-sneakers.png"),
                Set.of(shoes, fashion)
        );

        getOrCreateDeliveredOrder(client, clientAddress, List.of(
                createOrderLine(headphones, 1),
                createOrderLine(sneakers, 2)
        ));

        getOrCreateDeliveredOrder(partner, partnerAddress, List.of(
                createOrderLine(speaker, 2)
        ));
    }

    private SuperAdmin getOrCreateSuperAdmin() {
        return superAdminRepository.findByEmail("superadmin@pfe.local")
                .orElseGet(() -> {
                    SuperAdmin superAdmin = new SuperAdmin();
                    superAdmin.setNom("Super Admin");
                    superAdmin.setEmail("superadmin@pfe.local");
                    superAdmin.setMotDePasse(passwordEncoder.encode("Admin123!"));
                    superAdmin.setProfil("/uploads/default-profile.png");
                    superAdmin.setSuperAdminSpecificField("seeded-super-admin");
                    return superAdminRepository.save(superAdmin);
                });
    }

    private Admin getOrCreateAdmin() {
        return adminRepository.findByEmail("admin@pfe.local")
                .orElseGet(() -> {
                    Admin admin = new Admin();
                    admin.setNom("Admin PFE");
                    admin.setEmail("admin@pfe.local");
                    admin.setMotDePasse(passwordEncoder.encode("Admin123!"));
                    admin.setProfil("/uploads/default-profile.png");
                    admin.setAdminSpecificField("seeded-admin");
                    return adminRepository.save(admin);
                });
    }

    private Client getOrCreateStandardClient(Adresse adresse) {
        return clientRepository.findByEmail("client@pfe.local")
                .orElseGet(() -> {
                    Client client = new Client();
                    client.setNom("Client Test");
                    client.setEmail("client@pfe.local");
                    client.setMotDePasse(passwordEncoder.encode("Client123!"));
                    client.setProfil("/uploads/default-profile.png");
                    client.setDescription("Mock individual client for mobile app testing");
                    client.setType(TypeClient.Individual);
                    client.setActif(true);
                    client.setEmailVerified(true);
                    client.setTel("20111222");
                    client.setAdresse(adresse);
                    client.setLastLogin(LocalDateTime.now());
                    return clientRepository.save(client);
                });
    }

    private Client getOrCreatePartnerClient(Adresse adresse) {
        return clientRepository.findByEmail("partner@pfe.local")
                .orElseGet(() -> {
                    Client client = new Client();
                    client.setNom("Partner Test");
                    client.setEmail("partner@pfe.local");
                    client.setMotDePasse(passwordEncoder.encode("Partner123!"));
                    client.setProfil("/uploads/default-profile.png");
                    client.setDescription("Mock partner client for dashboard and order testing");
                    client.setType(TypeClient.Partner);
                    client.setActif(true);
                    client.setEmailVerified(true);
                    client.setTel("55444333");
                    client.setAdresse(adresse);
                    client.setLastLogin(LocalDateTime.now().minusDays(1));
                    return clientRepository.save(client);
                });
    }

    private void getOrCreateEntreprise(Client partnerClient) {
        Optional<Entreprise> existingEntreprise = entrepriseRepository.findByClient(partnerClient);
        if (existingEntreprise.isPresent()) {
            return;
        }

        Entreprise entreprise = new Entreprise();
        entreprise.setMatriculeFiscale("MF-0001-PFE");
        entreprise.setNom("PFE Partner Company");
        entreprise.setClient(partnerClient);
        entrepriseRepository.save(entreprise);
    }

    private Pays getOrCreateCountry(String name) {
        List<Pays> existing = paysRepository.findByNomIgnoreCase(name);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        Pays pays = new Pays();
        pays.setNom(name);
        return paysRepository.save(pays);
    }

    private Ville getOrCreateCity(String name, Pays pays) {
        List<Ville> existing = villeRepository.findByNomIgnoreCaseAndPays(name, pays);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        Ville ville = new Ville();
        ville.setNom(name);
        ville.setPays(pays);
        return villeRepository.save(ville);
    }

    private Adresse getOrCreateAddress(String rue, String numero, String indication, Ville ville) {
        List<Adresse> existing = adresseRepository.findByFullAddressComponents(rue, numero, indication, ville);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        Adresse adresse = new Adresse();
        adresse.setRue(rue);
        adresse.setNumero(numero);
        adresse.setIndication(indication);
        adresse.setVille(ville);
        return adresseRepository.save(adresse);
    }

    private Categories getOrCreateCategory(String nom, String description, String photo, Categories parent) {
        Optional<Categories> existing = categoriesRepository.findAll()
                .stream()
                .filter(category -> category.getNom() != null && category.getNom().equalsIgnoreCase(nom))
                .findFirst();

        if (existing.isPresent()) {
            Categories category = existing.get();
            if (category.getPhoto() == null || category.getPhoto().isBlank()) {
                category.setPhoto(photo);
            }
            if (category.getDescription() == null || category.getDescription().isBlank()) {
                category.setDescription(description);
            }
            if (parent != null && category.getParent() == null) {
                category.setParent(parent);
            }
            return categoriesRepository.save(category);
        }

        Categories category = new Categories();
        category.setNom(nom);
        category.setDescription(description);
        category.setPhoto(photo);
        category.setParent(parent);
        return categoriesRepository.save(category);
    }

    private Produits getOrCreateProduct(
            String reference,
            String nom,
            String description,
            double prix,
            int quantite,
            double promotionPartenaire,
            double promotionParticulier,
            boolean disponibilite,
            String selection,
            Set<String> photos,
            Set<Categories> categories
    ) {
        Optional<Produits> existing = produitsRepository.findAll()
                .stream()
                .filter(product -> reference.equalsIgnoreCase(product.getReference()))
                .findFirst();

        if (existing.isPresent()) {
            Produits product = existing.get();
            product.setNom(nom);
            product.setDescription(description);
            product.setPrix(prix);
            product.setQuantite(quantite);
            product.setPromotionPartenaire(promotionPartenaire);
            product.setPromotionParticulier(promotionParticulier);
            product.setDisponibilite(disponibilite);
            product.setSelection(selection);
            product.setPhoto(new HashSet<>(photos));
            product.setCategories(new HashSet<>(categories));
            return produitsRepository.save(product);
        }

        Produits product = new Produits();
        product.setReference(reference);
        product.setNom(nom);
        product.setDescription(description);
        product.setPrix(prix);
        product.setQuantite(quantite);
        product.setPromotionPartenaire(promotionPartenaire);
        product.setPromotionParticulier(promotionParticulier);
        product.setDisponibilite(disponibilite);
        product.setSelection(selection);
        product.setPhoto(new HashSet<>(photos));
        product.setCategories(new HashSet<>(categories));
        return produitsRepository.save(product);
    }

    private LigneCommande createOrderLine(Produits product, int quantity) {
        LigneCommande line = new LigneCommande();
        line.setProduit(product);
        line.setQuantite(quantity);
        return line;
    }

    private void getOrCreateDeliveredOrder(Client client, Adresse adresse, List<LigneCommande> lines) {
        boolean alreadyExists = commandeRepository.findCommandesByClientIdOrderByDateCommandeDesc(client.getId())
                .stream()
                .anyMatch(order -> order.getType() == TypeCommande.Produit && order.getEtat() == EtatCommande.LivreeEtPaye);

        if (alreadyExists) {
            return;
        }

        Commande commande = new Commande();
        commande.setClient(client);
        commande.setAdresseLivraison(adresse);
        commande.setDateCommande(Date.from(LocalDateTime.now().minusDays(2)
                .atZone(ZoneId.systemDefault())
                .toInstant()));
        commande.setEtat(EtatCommande.LivreeEtPaye);
        commande.setType(TypeCommande.Produit);
        commande.setType_paiment(TypePaiment.Livraison);

        double total = lines.stream()
                .mapToDouble(line -> line.getProduit().getPrix() * line.getQuantite())
                .sum();
        commande.setTotal(total);

        List<LigneCommande> persistedLines = new ArrayList<>();
        for (LigneCommande line : lines) {
            line.setCommande(commande);
            persistedLines.add(line);
        }
        commande.setLigneCommandes(persistedLines);

        commandeRepository.save(commande);
    }
}
