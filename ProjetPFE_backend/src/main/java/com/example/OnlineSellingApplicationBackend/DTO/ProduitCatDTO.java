package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.Produits;

public class ProduitCatDTO {
    private Long id;
    private String nom;
    private double prix;
    private int quantite;
    private boolean disponibilite;

    // Constructeur qui initialise les valeurs à partir de l'entité Produit
    public ProduitCatDTO(Produits produit) {
        this.id = produit.getId();
        this.nom = produit.getNom();
        this.prix = produit.getPrix();
        this.quantite = produit.getQuantite();
        this.disponibilite = produit.isDisponibilite();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public double getPrix() {
        return prix;
    }

    public void setPrix(double prix) {
        this.prix = prix;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public boolean isDisponibilite() {
        return disponibilite;
    }

    public void setDisponibilite(boolean disponibilite) {
        this.disponibilite = disponibilite;
    }
}
