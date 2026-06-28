package com.example.OnlineSellingApplicationBackend.DTO;

public class ProduitQuantite {
    private Long produitId;
    private Integer quantite;

    // Constructors
    public ProduitQuantite() {}

    public ProduitQuantite(Long produitId, Integer quantite) {
        this.produitId = produitId;
        this.quantite = quantite;
    }

    // Getters and setters
    public Long getProduitId() { return produitId; }
    public void setProduitId(Long produitId) { this.produitId = produitId; }
    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }
}