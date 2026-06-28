package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Repositories.*;
import com.example.OnlineSellingApplicationBackend.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PartnerService {
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private LigneCommandPackRepository ligneCommandPackRepository;
    @Autowired
    private PaquetRepository paquetRepository;
    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private ProduitsRepository produitRepository;

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
    private NotificationService notificationService;
    public Commande createCommand(Long clientId,
                                  AddressRequest addressRequest,
                                  List<PackSellingRequest> packData,
                                  TypePaiment paymentType,
                                  String paymentIntentId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Adresse deliveryAddress = processAddress(addressRequest);

        Commande commande = new Commande();
        commande.setType(TypeCommande.Pack);
        commande.setClient(client);
        commande.setAdresseLivraison(deliveryAddress);
        commande.setDateCommande(new Date());
        commande.setType_paiment(paymentType);
        if (paymentType == TypePaiment.EnLigne) {
            commande.setEtat(EtatCommande.PayeEtEnCoursDeTraitement);
        } else {
            commande.setEtat(EtatCommande.EnCoursDeTraitement);
        }

        List<LigneCommandPack> ligneCommands = new ArrayList<>();
        for (PackSellingRequest pack : packData) {
            Paquet paquet = paquetRepository.findById(pack.getId_Pack())
                    .orElseThrow(() -> new RuntimeException("Pack not found: " + pack.getId_Pack()));
            LigneCommandPack lc = new LigneCommandPack();
            lc.setCommande(commande);
            lc.setPaquet(paquet);
            lc.setQuantite(pack.getQuantite());
            ligneCommands.add(lc);
        }
        commande.setLigneCommandePack(ligneCommands);

        double total = ligneCommands.stream()
                .mapToDouble(lc -> lc.getPaquet().getPrix() * lc.getQuantite())
                .sum();

        commande.setTotal(total);

        Commande savedCommande = commandeRepository.save(commande);

        if (paymentType == TypePaiment.EnLigne && paymentIntentId != null) {
            try {
                paymentService.linkPaymentToOrder(savedCommande.getIdCommande(), paymentIntentId);
                System.out.println("Successfully linked payment " + paymentIntentId +
                        " to order " + savedCommande.getIdCommande());
            } catch (Exception e) {
                System.err.println("Failed to link payment to order: " + e.getMessage());
                throw new RuntimeException("Failed to link payment to order", e);
            }
        }

        notificationService.notifyNewOrder(savedCommande.getIdCommande(), clientId.toString());

        return savedCommande;
    }

    private Adresse processAddress(AddressRequest addressRequest) {
        String normalizedPays = addressRequest.getNomPays().trim().toLowerCase();
        String normalizedVille = addressRequest.getNomVille().trim().toLowerCase();

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
        List<Adresse> existingAddresses = adresseRepository.findByRueIgnoreCaseAndNumeroIgnoreCaseAndIndicationIgnoreCaseAndVille(
                addressRequest.getRue().trim(),
                addressRequest.getNumero().trim(),
                addressRequest.getIndication() != null ? addressRequest.getIndication().trim() : "",
                ville
        );
        if (!existingAddresses.isEmpty()) {
            return existingAddresses.get(0);
        } else {
            Adresse newAdresse = new Adresse();
            newAdresse.setRue(addressRequest.getRue().trim());
            newAdresse.setNumero(addressRequest.getNumero().trim());
            newAdresse.setIndication(addressRequest.getIndication() != null ?
                    addressRequest.getIndication().trim() : "");
            newAdresse.setVille(ville);
            return adresseRepository.save(newAdresse);
        }
    }

}
