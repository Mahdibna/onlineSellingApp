package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.TypePaiment;

import java.util.List;

public class CommandRequest {
    private AddressResponse address;
    private List<ProductRequest> products;
    private String TypeCommande;
    private TypePaiment paymentType;
    private String paymentIntentId;  // This field is crucial

    // Generate getters and setters
    public String getPaymentIntentId() {
        return paymentIntentId;
    }

    public void setPaymentIntentId(String paymentIntentId) {
        this.paymentIntentId = paymentIntentId;
    }

    public String getTypeCommande() {
        return TypeCommande;
    }

    public void setTypeCommande(String typeCommande) {
        TypeCommande = typeCommande;
    }
    // Getters and Setters
    public AddressResponse getAddress() {
        return address;
    }

    public void setAddress(AddressResponse address) {
        this.address = address;
    }

    public List<ProductRequest> getProducts() {
        return products;
    }

    public void setProducts(List<ProductRequest> products) {
        this.products = products;
    }

    public TypePaiment getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(TypePaiment paymentType) {
        this.paymentType = paymentType;
    }
}

