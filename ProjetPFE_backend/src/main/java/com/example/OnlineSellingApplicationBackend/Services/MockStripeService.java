package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.PaymentIntentDTO;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Service
public class MockStripeService {
    // In-memory store for payment intents
    private Map<String, PaymentIntentDTO> paymentIntents = new HashMap<>();


    public PaymentIntentDTO createPaymentIntent(double amount) {
        String id = "pi_" + generateRandomString(24);
        String clientSecret = id + "_secret_" + generateRandomString(16);

        PaymentIntentDTO intent = new PaymentIntentDTO();
        intent.setId(id);
        intent.setClientSecret(clientSecret);
        intent.setAmount(amount);
        intent.setStatus("requires_payment_method");

        // Store in our in-memory database
        paymentIntents.put(id, intent);

        return intent;
    }


    public PaymentIntentDTO confirmPaymentIntent(String paymentIntentId,
                                                 String cardNumber,
                                                 String expiryDate,
                                                 String cvv,
                                                 String cardholderName) {
        // Retrieve the payment intent
        PaymentIntentDTO intent = paymentIntents.get(paymentIntentId);
        if (intent == null) {
            throw new RuntimeException("Payment intent not found");
        }

        // Validate card format (basic validation)
        boolean validCard = validateCardDetails(cardNumber, expiryDate, cvv);

        // Update the payment intent status
        if (validCard) {
            // Simulate 95% success rate for valid cards
            if (new Random().nextDouble() <= 0.95) {
                intent.setStatus("succeeded");
            } else {
                intent.setStatus("failed");
            }
        } else {
            intent.setStatus("failed");
        }

        // Update in our in-memory database
        paymentIntents.put(paymentIntentId, intent);

        return intent;
    }

    /**
     * Retrieve a payment intent
     */
    public PaymentIntentDTO retrievePaymentIntent(String paymentIntentId) {
        return paymentIntents.get(paymentIntentId);
    }

    /**
     * Generate a mock receipt URL
     */
    public String generateReceiptUrl(String paymentIntentId) {
        return "https://yoursite.com/receipts/" + paymentIntentId;
    }

    /**
     * Basic card validation (for demonstration purposes)
     */
    private boolean validateCardDetails(String cardNumber, String expiryDate, String cvv) {
        // Remove spaces from card number
        cardNumber = cardNumber.replaceAll("\\s+", "");

        // Card number must be 16 digits
        if (cardNumber.length() != 16 || !cardNumber.matches("\\d+")) {
            return false;
        }

        // Expiry date format: MM/YY
        if (!expiryDate.matches("(0[1-9]|1[0-2])/[0-9]{2}")) {
            return false;
        }

        // CVV must be 3 or 4 digits
        if (!cvv.matches("[0-9]{3,4}")) {
            return false;
        }

        return true;
    }

    /**
     * Generate a random alphanumeric string
     */
    private String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();

        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        return sb.toString();
    }
}