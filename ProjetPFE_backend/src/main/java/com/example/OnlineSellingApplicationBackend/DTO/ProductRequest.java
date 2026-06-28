package com.example.OnlineSellingApplicationBackend.DTO;

public class ProductRequest {
    private Long id_product;
    private int quantité;

    // Getters and Setters
    public Long getId_product() {
        return id_product;
    }

    public void setId_product(Long id_product) {
        this.id_product = id_product;
    }

    public int getQuantité() {
        return quantité;
    }

    public void setQuantité(int quantité) {
        this.quantité = quantité;
    }
}
