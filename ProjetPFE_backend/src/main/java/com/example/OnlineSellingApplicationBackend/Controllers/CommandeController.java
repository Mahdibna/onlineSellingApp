package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Services.CommandeService;
import com.example.OnlineSellingApplicationBackend.Services.PartnerService;
import com.example.OnlineSellingApplicationBackend.Services.ClientService;

import com.example.OnlineSellingApplicationBackend.Services.PaymentService;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Commande;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/commandes")
public class CommandeController {
    @Autowired
    private PartnerService partnerService;
    @Autowired
    private ClientService clientService;
    @Autowired
    private CommandeService commandeService;

    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private PaymentService paymentService;
    @PostMapping("/{clientId}/Pack")
    public ResponseEntity<OrderCreationResponseDTO> createPartnerCommand(
            @PathVariable Long clientId,
            @RequestBody CreateCommandeRequest commandRequest) {
        try {
            // Create the pack order
            Commande commande = partnerService.createCommand(
                    clientId,
                    commandRequest.getAddressRequest(),
                    commandRequest.getPacks(),
                    commandRequest.getPaymentType(),
                    commandRequest.getPaymentIntentId()
            );
            OrderCreationResponseDTO responseDTO = paymentService.createOrderCreationResponse(
                    commande,
                    commandRequest.getPaymentIntentId()
            );

            return ResponseEntity.status(201).body(responseDTO);
        } catch (Exception e) {
            System.err.println("Error creating pack order: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @PostMapping("/{clientId}")
    public ResponseEntity<OrderCreationResponseDTO> createClientCommand(
            @PathVariable Long clientId,
            @RequestBody CommandRequest commandRequest) {
        try {

            Commande commande = commandeService.createCommand(
                clientId,
                commandRequest.getAddress(),
                commandRequest.getProducts(),
                commandRequest.getPaymentType(),
                commandRequest.getPaymentIntentId()
        );

        OrderCreationResponseDTO responseDTO = paymentService.createOrderCreationResponse(
                commande,
                commandRequest.getPaymentIntentId()
        );

        return ResponseEntity.ok(responseDTO);
    }catch(Exception e){
        System.err.println("Error creating pack order: " + e.getMessage());
        e.printStackTrace();
        throw e;
    }}
    @GetMapping("/{clientId}")
    public ResponseEntity<List<OrderHistoryDTO>> getCommandsHistory(@PathVariable Long clientId) {
        List<Commande> orderHistory = clientService.getOrderHistory(clientId);
        List<OrderHistoryDTO> orderHistoryDTO = clientService.mapCommandeToDTO(orderHistory);
        return ResponseEntity.ok(orderHistoryDTO);
    }
    @GetMapping("/orders/all")
    public ResponseEntity<List<AdminOrderDTO>> getAllOrdersForAdmin() {
        List<Commande> commandes = commandeService.getAllOrders();
        List<AdminOrderDTO> dtos = commandeService.mapToAdminOrderDTO(commandes);
        return ResponseEntity.ok(dtos);


    }
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> statusRequest
    ) {
        commandeService.updateOrderStatus(orderId, statusRequest.get("newStatus"));
        return ResponseEntity.ok().build();
    }


    @GetMapping("/{orderId}/details")
    public ResponseEntity<CommandeDetailDTO> getOrderDetails(@PathVariable Long orderId) {
        CommandeDetailDTO orderDetails = commandeService.getOrderDetails(orderId);
        return ResponseEntity.ok(orderDetails);
    }
    @GetMapping("/orders/daily")
    public ResponseEntity<?> getDailyOrders(
            @RequestParam(required = false) String startDateParam,
            @RequestParam(required = false) String endDateParam) {

        try {
            LocalDate startDate;
            LocalDate endDate;

            if (startDateParam != null && endDateParam != null) {
                startDate = LocalDate.parse(startDateParam);
                endDate = LocalDate.parse(endDateParam);
            } else {
                endDate = LocalDate.now();
                startDate = endDate.minusDays(6);
            }

            System.out.println("Using date range: " + startDate + " to " + endDate);

            List<DailyOrdersDTO> results = commandeService.getDailyOrders(startDate, endDate);
            System.out.println("Query returned " + results.size() + " results");

            return ResponseEntity.ok(results);

        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Invalid date format. Please use yyyy-MM-dd");
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error processing request: " + e.getMessage());
        }
    }

    @GetMapping("/orders/status-distribution")
    public ResponseEntity<List<StatusDistributionDTO>> getOrderStatusDistribution() {
        return ResponseEntity.ok(commandeService.getOrderStatusDistribution());
    }
    @GetMapping("/orders/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats() {
        return ResponseEntity.ok(commandeService.getOrderStats());
    }




}
