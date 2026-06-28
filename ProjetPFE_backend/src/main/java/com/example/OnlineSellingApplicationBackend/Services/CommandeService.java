package com.example.OnlineSellingApplicationBackend.Services;
import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Repositories.*;
import com.example.OnlineSellingApplicationBackend.entities.*;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjuster;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
@Service
public class CommandeService {
    @Autowired
    private CategoriesRepository categoriesRepository;
    @Autowired
    private ClientRepository clientRepository;
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
    private CartService cartService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private PaymentService paymentService;
    public Commande createCommand(Long clientId,
                                  AddressResponse addressRequest,
                                  List<ProductRequest> productData,
                                  TypePaiment paymentType,
                                  String paymentIntentId) {
        // Verify client exists
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        // Process delivery address using shared logic
        Adresse deliveryAddress = processAddress(addressRequest);
        // Create command with proper enum handling
        Commande commande = new Commande();
        commande.setType(TypeCommande.Produit);
        commande.setClient(client);
        commande.setAdresseLivraison(deliveryAddress);
        commande.setDateCommande(new Date());
        commande.setType_paiment(paymentType);
        if (paymentType == TypePaiment.EnLigne) {
            commande.setEtat(EtatCommande.PayeEtEnCoursDeTraitement);
        } else {
            commande.setEtat(EtatCommande.EnCoursDeTraitement);
        }
        // Process command lines but don't update product quantities
        // (because they were already reserved in the cart)
        List<LigneCommande> ligneCommands = new ArrayList<>();
        for (ProductRequest product : productData) {
            Produits produit = produitRepository.findById(product.getId_product())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + product.getId_product()));
            // We no longer need to check stock or update quantities here
            // since items are already reserved in the cart
            // Create line item
            LigneCommande lc = new LigneCommande();
            lc.setCommande(commande);
            lc.setProduit(produit);
            lc.setQuantite(product.getQuantité());
            ligneCommands.add(lc);
        }
        // Set command lines
        commande.setLigneCommandes(ligneCommands);
        Client Buyer=clientRepository.findById(clientId).orElseThrow(() -> new RuntimeException("client not found"));
        // Calculate and set total
        double total = ligneCommands.stream()
                .mapToDouble(lc -> lc.getProduit().getPrix() * ( 1.0 - ((Buyer.getType().equals(TypeClient.Partner) && lc.getProduit().getPromotionPartenaire() !=0) ? lc.getProduit().getPromotionPartenaire() : (Buyer.getType().equals(TypeClient.Individual) && lc.getProduit().getPromotionParticulier() != 0) ? lc.getProduit().getPromotionParticulier() : 0 )) * lc.getQuantite())
                .sum();
        commande.setTotal(total);
        // Save the command
        Commande savedCommande = commandeRepository.save(commande);
        // Link payment to order if this is an online payment
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
        // Clear the cart after successful order creation
        cartService.clearCartAfterOrder(clientId);
        notificationService.notifyNewOrder(savedCommande.getIdCommande(), clientId.toString());
        return savedCommande;
    }
    private Adresse processAddress(AddressResponse request) {
        // Normalize inputs
        String normalizedPays = request.getPays() != null ? request.getPays().trim().toLowerCase() : "";
        String normalizedVille = request.getVille() != null ? request.getVille().trim().toLowerCase() : "";
        String normalizedRue = request.getRue() != null ? request.getRue().trim().toLowerCase() : "";
        String normalizedNumero = request.getNumero() != null ? request.getNumero().trim().toLowerCase() : "";
        String normalizedIndication = request.getIndication() != null ?
                request.getIndication().trim().toLowerCase() : "";
        // Check existing address using DTO projection
        List<AddressResponse> existingAddresses = adresseRepository.findExistingAddress(
                normalizedRue,
                normalizedNumero,
                normalizedVille,
                normalizedPays,
                normalizedIndication
        );
        if (!existingAddresses.isEmpty()) {
            // Always return the first one consistently (or add logic to pick the most relevant)
            return adresseRepository.findById(existingAddresses.get(0).getId())
                    .orElseThrow(() -> new RuntimeException("Address not found"));
        }
        // Create new address components with proper persistence
        List<Pays> existingPays = paysRepository.findByNomIgnoreCase(normalizedPays);
        Pays pays;
        if (!existingPays.isEmpty()) {
            pays = existingPays.get(0); // Take first existing Pays
        } else {
            pays = new Pays(normalizedPays);
            pays = paysRepository.save(pays);
        }
        // Process Ville
        List<Ville> existingVilles = villeRepository.findByNomIgnoreCaseAndPays(normalizedVille, pays);
        Ville ville;
        if (!existingVilles.isEmpty()) {
            ville = existingVilles.get(0); // Take first existing Ville
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
        // Fetch and return all commandes for the client
        return commandeRepository.findCommandesByClientId(clientId);
    }
    public List<OrderHistoryDTO> mapCommandeToDTO(List<Commande> commandes) {
        List<OrderHistoryDTO> dtoList = new ArrayList<>();

        for (Commande commande : commandes) {
            OrderHistoryDTO dto = new OrderHistoryDTO();
            dto.setOrderId(commande.getIdCommande());
            dto.setOrderDate(commande.getDateCommande());
            dto.setOrderState(commande.getEtat().toString());
            dto.setPaymentType(commande.getType_paiment());
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

    // Add these methods to CommandeService
    public List<Commande> getAllOrders() {
        return commandeRepository.findAll();
    }

    public List<AdminOrderDTO> mapToAdminOrderDTO(List<Commande> commandes) {
        return commandes.stream().map(commande -> {
            AdminOrderDTO dto = new AdminOrderDTO();
            dto.setOrderId(commande.getIdCommande());
            dto.setOrderType(commande.getType());

            Client client = commande.getClient();
            dto.setCustomer(client.getNom());

            dto.setTotal(commande.getTotal());
            dto.setStatus(commande.getEtat());
            dto.setPaymentType(commande.getType_paiment());
            dto.setDate(commande.getDateCommande());

            return dto;
        }).collect(Collectors.toList());
    }

    public void updateOrderStatus(Long orderId, String newStatus) {
        Commande commande = commandeRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        EtatCommande newEtat = EtatCommande.valueOf(newStatus);
        // Validate if the new status is allowed for this payment type
        validateStatusTransition(commande.getType_paiment(), commande.getEtat(), newEtat);
        commande.setEtat(newEtat);
        commandeRepository.save(commande);
        notificationService.notifyOrderStatusChange(orderId, commande.getClient().getId().toString(), newStatus);
    }
    private void validateStatusTransition(TypePaiment paymentType, EtatCommande currentStatus, EtatCommande newStatus) {
        // Get valid statuses based on payment type
        List<EtatCommande> validStatuses;
        if (paymentType == TypePaiment.EnLigne) {
            validStatuses = List.of(
                    EtatCommande.PayeEtEnCoursDeTraitement,
                    EtatCommande.EnTransit,
                    EtatCommande.EnCoursDeLivraison,
                    EtatCommande.Livree,
                    EtatCommande.Annulee,
                    EtatCommande.EnRetour
            );
        } else {
            validStatuses = List.of(
                    EtatCommande.EnCoursDeTraitement,
                    EtatCommande.EnTransit,
                    EtatCommande.EnCoursDeLivraison,
                    EtatCommande.Livree,
                    EtatCommande.LivreeEtPaye,
                    EtatCommande.Annulee,
                    EtatCommande.EnRetour
            );
        }
        if (!validStatuses.contains(newStatus)) {
            throw new IllegalStateException("Invalid status transition for the payment type " + paymentType);
        }
    }
    public CommandeDetailDTO getOrderDetails(Long orderId) {
        // Fetch the order with line items and address info
        Commande commande = commandeRepository.findByIdWithLigneCommandes(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        // Fetch the order with line packs separately
        Optional<Commande> commandeWithPacks = commandeRepository.findByIdWithLigneCommandePack(orderId);

        // Merge the ligneCommandePack if found
        commandeWithPacks.ifPresent(c -> {
            commande.setLigneCommandePack(c.getLigneCommandePack());

            // Maintain bidirectional relationships
            if (commande.getLigneCommandePack() != null) {
                commande.getLigneCommandePack().forEach(lcp -> lcp.setCommande(commande));
            }
        });
        return mapToCommandeDetailDTO(commande);
    }
    private CommandeDetailDTO mapToCommandeDetailDTO(Commande commande) {
        CommandeDetailDTO dto = new CommandeDetailDTO();
        // Basic info
        dto.setOrderId(commande.getIdCommande());
        dto.setOrderType(commande.getType().toString());
        dto.setOrderDate(commande.getDateCommande());
        dto.setStatus(commande.getEtat().toString());
        dto.setPaymentType(commande.getType_paiment());
        // Client info
        CommandeDetailDTO.ClientInfoDTO clientInfo = new CommandeDetailDTO.ClientInfoDTO();
        clientInfo.setName(commande.getClient().getNom());
        clientInfo.setEmail(commande.getClient().getEmail());
        clientInfo.setTel(commande.getClient().getTel());
        dto.setClient(clientInfo);
        // Address info
        CommandeDetailDTO.AddressDTO addressDTO = new CommandeDetailDTO.AddressDTO();
        Adresse adresse = commande.getAdresseLivraison();
        if (adresse != null) {
            addressDTO.setStreet(adresse.getRue());
            addressDTO.setNumber(adresse.getNumero());
            addressDTO.setCity(adresse.getVille().getNom());
            addressDTO.setCountry(adresse.getVille().getPays().getNom());
        }
        dto.setDeliveryAddress(addressDTO);
        List<CommandeDetailDTO.OrderItemDTO> items = new ArrayList<>();
        if (commande.getLigneCommandes() != null) {
            commande.getLigneCommandes().forEach(lc -> {
                CommandeDetailDTO.OrderItemDTO item = new CommandeDetailDTO.OrderItemDTO();
                item.setName(lc.getProduit().getNom());
                item.setItemType("product");
                item.setQuantity(lc.getQuantite());
                items.add(item);
            });
        }

        if (commande.getLigneCommandePack() != null) {
            Map<Long, CommandeDetailDTO.OrderItemDTO> packMap = new HashMap<>();

            commande.getLigneCommandePack().forEach(lcp -> {
                if (!packMap.containsKey(lcp.getPaquet().getId())) {
                    CommandeDetailDTO.OrderItemDTO item = new CommandeDetailDTO.OrderItemDTO();
                    item.setName(lcp.getPaquet().getNom());
                    item.setItemType("pack");
                    item.setQuantity(lcp.getQuantite());

                    List<String> contents = new ArrayList<>();
                    if (lcp.getPaquet() != null && lcp.getPaquet().getLignePaquets() != null) {
                        lcp.getPaquet().getLignePaquets().forEach(lp -> {
                            if (lp.getProduit() != null) {
                                contents.add(lp.getProduit().getNom() + " (x" + lp.getQuantite() + ")");
                            }
                        });
                    }
                    item.setPackContents(contents.isEmpty() ? null : contents);
                    packMap.put(lcp.getPaquet().getId(), item);
                }
            });

            items.addAll(packMap.values());
        }

        dto.setItems(items);
        dto.setTotal(commande.getTotal());

        return dto;
    }

    public List<SalesDataDTO> getSalesData(String range, String timezone) {
        ZoneId zone = ZoneId.of(timezone);
        ZonedDateTime now = ZonedDateTime.now(zone);
        ZonedDateTime startDate;
        String groupBy;

        switch (range.toUpperCase()) {
            case "THIS WEEK" -> {
                startDate = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).with(LocalTime.MIN);
                groupBy = "DAY";
            }
            case "THIS MONTH" -> {
                startDate = now.withDayOfMonth(1).with(LocalTime.MIN);
                groupBy = "DAY";
            }
            case "THIS QUARTER" -> {
                int quarterStartMonth = ((now.getMonthValue() - 1) / 3) * 3 + 1;
                startDate = now.withMonth(quarterStartMonth).withDayOfMonth(1).with(LocalTime.MIN);
                groupBy = "MONTH";
            }
            case "THIS YEAR" -> {
                startDate = now.withDayOfYear(1).with(LocalTime.MIN);
                groupBy = "MONTH";
            }
            default -> {
                startDate = now.withDayOfMonth(1).with(LocalTime.MIN);
                groupBy = "DAY";
            }
        }
        List<Object[]> results = commandeRepository.getSalesData(
                Date.from(startDate.toInstant()),
                Date.from(now.toInstant()),
                groupBy
        );
        Map<String, SalesDataDTO> periodMap = new LinkedHashMap<>();
        ZonedDateTime current = startDate;
        while (!current.isAfter(now)) {
            String periodKey;
            if ("DAY".equalsIgnoreCase(groupBy)) {
                periodKey = current.format(DateTimeFormatter.ISO_LOCAL_DATE);
            } else {
                periodKey = current.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            }

            periodMap.put(periodKey, new SalesDataDTO(
                    current.toInstant().toString(),
                    0.0
            ));

            if ("DAY".equalsIgnoreCase(groupBy)) {
                current = current.plusDays(1);
            } else {
                current = current.plusMonths(1);
            }
        }

        for (Object[] result : results) {
            String period = (String) result[0];
            double total = ((Number) result[1]).doubleValue();

            if (periodMap.containsKey(period)) {
                periodMap.get(period).setTotal(total);
            }
        }

        return new ArrayList<>(periodMap.values());
    }

    public List<DailySalesDTO> getDailySales(LocalDate startDate, LocalDate endDate) {
        return commandeRepository.findDailySalesBetweenDates(startDate, endDate)
                .stream()
                .map(result -> new DailySalesDTO(
                        ((String) result[0]).substring(0, 3),
                        ((Number) result[1]).doubleValue()
                ))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getSalesMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        Double totalRevenue = commandeRepository.getTotalRevenueBetweenDates(
                LocalDate.now().minusDays(30),
                LocalDate.now()
        );
        metrics.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);

        Double avgOrderValue = commandeRepository.getAverageOrderValue();
        metrics.put("averageOrderValue", avgOrderValue != null ? avgOrderValue : 0.0);

        metrics.put("conversionRate", calculateConversionRate());

        metrics.put("salesGrowth", calculateSalesGrowth());

        return metrics;
    }

    private double calculateConversionRate() {
        long successfulOrders = commandeRepository.countByEtatIn(
                List.of(EtatCommande.Livree, EtatCommande.LivreeEtPaye)
        );


        long totalClients = clientRepository.count();

        if (totalClients == 0) return 0.0;
        return (successfulOrders * 100.0) / totalClients;
    }

    private double calculateSalesGrowth() {
        // Get current period sales (e.g., this month)
        LocalDate now = LocalDate.now();
        LocalDate startCurrent = now.withDayOfMonth(1);
        LocalDate endCurrent = now.withDayOfMonth(now.lengthOfMonth());

        Double currentRevenue = commandeRepository.getTotalRevenueBetweenDates(
                startCurrent, endCurrent
        );

        // Get previous period sales (e.g., last month)
        LocalDate startPrevious = startCurrent.minusMonths(1);
        LocalDate endPrevious = startPrevious.withDayOfMonth(
                startPrevious.lengthOfMonth()
        );

        Double previousRevenue = commandeRepository.getTotalRevenueBetweenDates(
                startPrevious, endPrevious
        );

        if (currentRevenue == null) currentRevenue = 0.0;
        if (previousRevenue == null || previousRevenue == 0) return 0.0;

        return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    }

    public List<DailyOrdersDTO> getDailyOrders(LocalDate startDate, LocalDate endDate) {
        System.out.println("Service method called with: startDate=" + startDate + ", endDate=" + endDate);

        LocalDate adjustedEndDate = endDate.plusDays(1);

        try {
            List<Object[]> results = commandeRepository.findDailyOrdersBetweenDates(startDate, adjustedEndDate);
            System.out.println("Raw query returned " + results.size() + " results");

            // Create a map with all 7 days initialized with zero orders
            Map<String, Integer> dailyOrdersMap = new LinkedHashMap<>();
            for (int i = 0; i < 7; i++) {
                LocalDate date = startDate.plusDays(i);
                String dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                dailyOrdersMap.put(dateStr, 0);
            }

            for (Object[] result : results) {
                // Get the date from result[0]
                LocalDate date;
                if (result[0] instanceof java.sql.Date) {
                    date = ((java.sql.Date) result[0]).toLocalDate();
                } else if (result[0] instanceof String) {
                    date = LocalDate.parse((String) result[0]);
                } else {
                    date = convertToLocalDate((Date) result[0]);
                }

                Number countObj = (Number) result[1];
                int count = countObj.intValue();

                String dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                if (dailyOrdersMap.containsKey(dateStr)) {
                    dailyOrdersMap.put(dateStr, count);
                }
            }

            List<DailyOrdersDTO> dtoList = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : dailyOrdersMap.entrySet()) {
                dtoList.add(new DailyOrdersDTO(entry.getKey(), entry.getValue()));
            }

            return dtoList;
        } catch (Exception e) {
            System.err.println("Error in service method: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private LocalDate convertToLocalDate(Date date) {
        if (date == null) {
            return null;
        }
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }

    public List<StatusDistributionDTO> getOrderStatusDistribution() {
        return commandeRepository.countOrdersByStatus().stream()
                .map(result -> new StatusDistributionDTO(
                        ((EtatCommande) result[0]).toString(),
                        (Long) result[1]
                ))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getOrderStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total Orders
        stats.put("totalOrders", commandeRepository.count());

        // Pending Orders (using your existing countByEtatIn method)
        stats.put("pendingOrders", commandeRepository.countByEtatIn(
                List.of(EtatCommande.EnCoursDeTraitement, EtatCommande.PayeEtEnCoursDeTraitement)
        ));

        // Completed Orders
        stats.put("completedOrders", commandeRepository.countByEtatIn(
                List.of(EtatCommande.Livree,EtatCommande.LivreeEtPaye)
        ));

        // Total Revenue
        stats.put("totalRevenue", commandeRepository.getTotalRevenue());

        return stats;
    }

    public Map<String, List<ClientOrderDTO>> getClientOrdersGroupedByStatus(Long clientId) {
        List<Commande> clientOrders = commandeRepository.findCommandesByClientIdOrderByDateCommandeDesc(clientId);

        List<ClientOrderDTO> completedOrders = new ArrayList<>();
        List<ClientOrderDTO> ongoingOrders = new ArrayList<>();

        for (Commande commande : clientOrders) {
            ClientOrderDTO dto = new ClientOrderDTO();
            dto.setOrderId(commande.getIdCommande());
            dto.setOrderType(commande.getType().toString());
            dto.setTotal(commande.getTotal());
            dto.setStatus(commande.getEtat().toString());
            dto.setOrderDate(commande.getDateCommande());
            dto.setPaymentType(commande.getType_paiment());

            if (commande.getEtat() == EtatCommande.Livree || commande.getEtat() == EtatCommande.LivreeEtPaye) {
                completedOrders.add(dto);
            } else {
                // Set human-readable delivery status for ongoing orders
                dto.setDeliveryStatus(getDeliveryStatusText(commande.getEtat()));
                ongoingOrders.add(dto);
            }
        }

        Map<String, List<ClientOrderDTO>> result = new HashMap<>();
        result.put("completed", completedOrders);
        result.put("ongoing", ongoingOrders);

        return result;
    }

    private String getDeliveryStatusText(EtatCommande status) {
        switch (status) {
            case EnCoursDeTraitement:
                return "Preparing";
            case EnTransit:
                return "In Transit";
            case EnCoursDeLivraison:
                return "Out for Delivery";
            case EnRetour:
                return "Return in Progress";
            case Annulee:
                return "Cancelled";
            default:
                return "Processing";
        }
    }

    public List<CategorySalesDTO> getSalesByCategory() {
        return commandeRepository.findSalesByCategory()
                .stream()
                .map(result -> new CategorySalesDTO(
                        ((String) result[0]).toLowerCase(), // Uniformisation des noms
                        ((Number) result[1]).doubleValue()
                ))
                .collect(Collectors.toList());
    }
}