package com.example.OnlineSellingApplicationBackend.DTO;

public class PaymentIntentDTO {
    private String id;
    private String clientSecret;
    private double amount;
    private String status; // 'requires_payment_method', 'requires_confirmation', 'succeeded', 'failed'

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}