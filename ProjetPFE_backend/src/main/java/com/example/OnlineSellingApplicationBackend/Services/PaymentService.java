package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.OrderCreationResponseDTO;
import com.example.OnlineSellingApplicationBackend.DTO.PaymentIntentDTO;
import com.example.OnlineSellingApplicationBackend.DTO.PaymentRequest;
import com.example.OnlineSellingApplicationBackend.DTO.PaymentResponse;
import com.example.OnlineSellingApplicationBackend.Repositories.CommandeRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.PaiementRepository;
import com.example.OnlineSellingApplicationBackend.entities.Commande;
import com.example.OnlineSellingApplicationBackend.entities.EtatCommande;
import com.example.OnlineSellingApplicationBackend.entities.Paiement;
import com.example.OnlineSellingApplicationBackend.entities.TypePaiment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private PaiementRepository paiementRepository;

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private MockStripeService mockStripeService;

    // Map to store pending payment intents that haven't been linked to an order yet
    private Map<String, Double> pendingPaymentIntents = new HashMap<>();

    /**
     * Create a standalone payment intent (without requiring an order first)
     */
    @Transactional
    public PaymentIntentDTO createStandalonePaymentIntent(double amount) {
        // Create a payment intent with our mock Stripe service
        PaymentIntentDTO intent = mockStripeService.createPaymentIntent(amount);

        // Store this intent for later linking to an order
        pendingPaymentIntents.put(intent.getId(), amount);

        System.out.println("Created standalone payment intent: " + intent.getId() + " for amount: " + amount);

        return intent;
    }

    /**
     * Process a standalone payment (before order creation)
     */
    @Transactional
    public PaymentResponse processStandalonePayment(PaymentRequest paymentRequest) {
        // Validate the payment request
        if (paymentRequest == null) {
            throw new IllegalArgumentException("Payment request cannot be null");
        }

        if (paymentRequest.getPaymentIntentId() == null) {
            throw new IllegalArgumentException("Payment intent ID cannot be null");
        }

        // Check if this intent exists in our pending map
        String paymentIntentId = paymentRequest.getPaymentIntentId();
        if (!pendingPaymentIntents.containsKey(paymentIntentId)) {
            throw new IllegalArgumentException("Payment intent not found or already processed");
        }

        System.out.println("Processing standalone payment for intent: " + paymentIntentId);

        // Process with mock Stripe service
        PaymentIntentDTO paymentIntent = mockStripeService.confirmPaymentIntent(
                paymentRequest.getPaymentIntentId(),
                paymentRequest.getCardNumber(),
                paymentRequest.getExpiryDate(),
                paymentRequest.getCvv(),
                paymentRequest.getCardholderName()
        );

        boolean isSuccessful = "succeeded".equals(paymentIntent.getStatus());
        System.out.println("Payment intent " + paymentIntentId + " status: " + paymentIntent.getStatus());

        // Create a standalone payment record (not linked to an order yet)
// Create a standalone payment record (not linked to an order yet)
        Paiement paiement = new Paiement();
        paiement.setMontant(pendingPaymentIntents.get(paymentIntentId));
        paiement.setDatePaiement(new Date());
        paiement.setModePaiement(paymentRequest.getPaymentMethod());
        paiement.setStatut(isSuccessful);
        paiement.setTransactionReference(UUID.randomUUID().toString());
        paiement.setPaymentIntentId(paymentIntent.getId());

        // Store last 4 digits of card number (for receipts)
        String cardNumber = paymentRequest.getCardNumber().replaceAll("\\s+", "");
        if (cardNumber.length() >= 4) {
            paiement.setCardNumberLast4(cardNumber.substring(cardNumber.length() - 4));
        }

        // Save payment record
        Paiement savedPaiement = paiementRepository.save(paiement);
        paiementRepository.flush(); // Force immediate database write

        System.out.println("Created payment record: " + savedPaiement.getIdPaiement() +
                " for intent: " + paymentIntentId);

        // Remove from pending map if processed
        if (isSuccessful) {
            pendingPaymentIntents.remove(paymentIntentId);
        }

        // Create and return response
        PaymentResponse response = new PaymentResponse();
        response.setPaymentId(savedPaiement.getIdPaiement());
        response.setAmount(paiement.getMontant());
        response.setSuccessful(isSuccessful);
        response.setTimestamp(new Date());
        response.setTransactionReference(paiement.getTransactionReference());
        response.setPaymentIntentId(paymentIntent.getId());

        if (isSuccessful) {
            response.setReceiptUrl(mockStripeService.generateReceiptUrl(paymentIntent.getId()));
        } else {
            response.setErrorMessage("Payment processing failed. Please try again or use a different payment method.");
        }

        return response;
    }

    /**
     * Link a previously processed payment to a newly created order
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void linkPaymentToOrder(Long orderId, String paymentIntentId) {
        if (orderId == null) {
            throw new IllegalArgumentException("Order ID cannot be null when linking payment");
        }
        if (paymentIntentId == null || paymentIntentId.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment intent ID cannot be null or empty when linking payment");
        }
        System.out.println("Linking payment intent " + paymentIntentId + " to order " + orderId);

        // Find the order - using findById instead of getOne to ensure entity is loaded
        Commande commande = commandeRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        // Find the payment by payment intent ID
        Paiement paiement = paiementRepository.findByPaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with intent ID: " + paymentIntentId));

        // Instead of trying to detach existing relationships and clearing collections,
        // which can cause problems with immutable collections, just set the new relationships

        // Update payment to point to order
        paiement.setCommande(commande);

        // Update order to point to this payment
        commande.setPaiement(paiement);

        // Update order status if payment is successful
        if (paiement.isStatut()) {
            commande.setEtat(EtatCommande.PayeEtEnCoursDeTraitement);
        }

        // Save both entities without using saveAndFlush
        paiementRepository.save(paiement);
        commandeRepository.save(commande);
        System.out.println("Successfully linked payment " + paiement.getIdPaiement() +
                " to order " + commande.getIdCommande());

        // Send notification
        if (paiement.isStatut()) {
            notificationService.notifyPaymentSuccess(commande.getIdCommande(),
                    commande.getClient().getId().toString());
        }
    }
    /**
     * Create a payment intent for an order
     */
    @Transactional
    public PaymentIntentDTO createPaymentIntent(Long orderId) {
        // Validate the orderId
        if (orderId == null) {
            throw new IllegalArgumentException("Order ID cannot be null");
        }

        // Log the orderId for debugging
        System.out.println("Creating payment intent for order ID: " + orderId);

        // Retrieve the order
        Commande commande = commandeRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        // Validate payment type
        if (commande.getType_paiment() != TypePaiment.EnLigne) {
            throw new IllegalStateException("This order is not set for online payment");
        }

        // Create a payment intent with our mock Stripe service
        return mockStripeService.createPaymentIntent(commande.getTotal());
    }

    /**
     * Process an online payment for an order
     */
    @Transactional
    public PaymentResponse processPayment(PaymentRequest paymentRequest) {
        // Validate the payment request
        if (paymentRequest == null) {
            throw new IllegalArgumentException("Payment request cannot be null");
        }

        if (paymentRequest.getOrderId() == null) {
            throw new IllegalArgumentException("Order ID cannot be null in payment request");
        }

        // Log the payment request for debugging
        System.out.println("Processing payment for order ID: " + paymentRequest.getOrderId());
        System.out.println("Payment intent ID: " + paymentRequest.getPaymentIntentId());

        // Retrieve the order
        Commande commande = commandeRepository.findById(paymentRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + paymentRequest.getOrderId()));

        // Validate payment type
        if (commande.getType_paiment() != TypePaiment.EnLigne) {
            throw new IllegalStateException("This order is not set for online payment");
        }

        // Process with mock Stripe service
        PaymentIntentDTO paymentIntent = mockStripeService.confirmPaymentIntent(
                paymentRequest.getPaymentIntentId(),
                paymentRequest.getCardNumber(),
                paymentRequest.getExpiryDate(),
                paymentRequest.getCvv(),
                paymentRequest.getCardholderName()
        );

        boolean isSuccessful = "succeeded".equals(paymentIntent.getStatus());

        // Create payment record
        Paiement paiement = new Paiement();
        paiement.setMontant(commande.getTotal());
        paiement.setDatePaiement(new Date());
        paiement.setModePaiement(paymentRequest.getPaymentMethod());
        paiement.setStatut(isSuccessful);
        paiement.setTransactionReference(UUID.randomUUID().toString());
        paiement.setPaymentIntentId(paymentIntent.getId());

        // Store last 4 digits of card number (for receipts)
        String cardNumber = paymentRequest.getCardNumber().replaceAll("\\s+", "");
        if (cardNumber.length() >= 4) {
            paiement.setCardNumberLast4(cardNumber.substring(cardNumber.length() - 4));
        }

        // Important: Set the commande before saving
        paiement.setCommande(commande);

        // Save payment record
        Paiement savedPaiement = paiementRepository.save(paiement);
        paiementRepository.flush(); // Force immediate database write

        // Update order status if payment successful
        if (isSuccessful) {
            commande.setEtat(EtatCommande.PayeEtEnCoursDeTraitement);
            commande.setPaiement(savedPaiement); // Use the saved payment with ID
            commandeRepository.save(commande);
            commandeRepository.flush(); // Force immediate database write

            // Notify about successful payment
            notificationService.notifyPaymentSuccess(commande.getIdCommande(),
                    commande.getClient().getId().toString());
        } else {
            // Notify about failed payment
            notificationService.notifyPaymentFailure(commande.getIdCommande(),
                    commande.getClient().getId().toString());
        }

        // Create and return response
        PaymentResponse response = new PaymentResponse();
        response.setPaymentId(savedPaiement.getIdPaiement());
        response.setOrderId(commande.getIdCommande());
        response.setAmount(commande.getTotal());
        response.setSuccessful(isSuccessful);
        response.setTimestamp(new Date());
        response.setTransactionReference(paiement.getTransactionReference());
        response.setPaymentIntentId(paymentIntent.getId());

        if (isSuccessful) {
            response.setReceiptUrl(mockStripeService.generateReceiptUrl(paymentIntent.getId()));
        } else {
            response.setErrorMessage("Payment processing failed. Please try again or use a different payment method.");
        }

        return response;
    }
    /**
     * Get payment details for an order
     */
    public PaymentResponse getPaymentDetails(Long orderId) {
        // Validate the orderId
        if (orderId == null) {
            throw new IllegalArgumentException("Order ID cannot be null");
        }

        System.out.println("Getting payment details for order: " + orderId);

        Commande commande = commandeRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        if (commande.getPaiement() == null) {
            throw new RuntimeException("No payment found for order with ID: " + orderId);
        }

        Paiement paiement = commande.getPaiement();
        System.out.println("Found payment: " + paiement.getIdPaiement() + " for order: " + orderId);

        PaymentResponse response = new PaymentResponse();
        response.setPaymentId(paiement.getIdPaiement());
        response.setOrderId(commande.getIdCommande());
        response.setAmount(paiement.getMontant());
        response.setSuccessful(paiement.isStatut());
        response.setTimestamp(paiement.getDatePaiement());
        response.setTransactionReference(paiement.getTransactionReference());
        response.setPaymentIntentId(paiement.getPaymentIntentId());

        if (paiement.isStatut()) {
            response.setReceiptUrl(mockStripeService.generateReceiptUrl(paiement.getPaymentIntentId()));
        }

        return response;
    }
    /**
     * Create a response DTO that combines order and payment information
     */
    public OrderCreationResponseDTO createOrderCreationResponse(Commande commande, String paymentIntentId) {
        PaymentResponse paymentResponse = null;
        try {
            // Try to get payment by order ID first
            paymentResponse = getPaymentDetails(commande.getIdCommande());
        } catch (Exception e) {
            System.err.println("Could not retrieve payment by order ID: " + e.getMessage());
            // If payment can't be fetched by order ID, try by payment intent ID
            if (paymentIntentId != null && !paymentIntentId.isEmpty()) {
                try {
                    // Find payment by payment intent ID
                    Paiement paiement = paiementRepository.findByPaymentIntentId(paymentIntentId)
                            .orElse(null);
                    if (paiement != null) {
                        // Create response from payment entity
                        paymentResponse = new PaymentResponse();
                        paymentResponse.setPaymentId(paiement.getIdPaiement());
                        paymentResponse.setOrderId(commande.getIdCommande());
                        paymentResponse.setAmount(paiement.getMontant());
                        paymentResponse.setSuccessful(paiement.isStatut());
                        paymentResponse.setTimestamp(paiement.getDatePaiement());
                        paymentResponse.setTransactionReference(paiement.getTransactionReference());
                        paymentResponse.setPaymentIntentId(paiement.getPaymentIntentId());

                        if (paiement.isStatut()) {
                            paymentResponse.setReceiptUrl(mockStripeService.generateReceiptUrl(paiement.getPaymentIntentId()));
                        }
                    }
                } catch (Exception ex) {
                    System.err.println("Could not retrieve payment by payment intent ID: " + ex.getMessage());
                }
            }
        }

        return new OrderCreationResponseDTO(commande, paymentResponse);
    }
}