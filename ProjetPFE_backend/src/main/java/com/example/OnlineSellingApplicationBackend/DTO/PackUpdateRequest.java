package com.example.OnlineSellingApplicationBackend.DTO;

import java.util.List;

public class PackUpdateRequest {
    private String nomPaquet;
    private Double prixPack;
    private List<ProduitQuantite> produits;

    // Getters and setters
    public String getNomPaquet() { return nomPaquet; }
    public void setNomPaquet(String nomPaquet) { this.nomPaquet = nomPaquet; }

    public Double getPrixPack() { return prixPack; }
    public void setPrixPack(Double prixPack) { this.prixPack = prixPack; }

    public List<ProduitQuantite> getProduits() { return produits; }
    public void setProduits(List<ProduitQuantite> produits) { this.produits = produits; }
}