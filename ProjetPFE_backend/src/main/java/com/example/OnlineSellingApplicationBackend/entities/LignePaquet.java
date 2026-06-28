package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@IdClass(ClePaquet.class)  // Keep this annotation
public class LignePaquet {

    // These fields must match exactly with ClePaquet fields
    @Id
    @Column(name = "paquet_id")
    private Long paquetId;

    @Id
    @Column(name = "produit_id")
    private Long produitId;

    @ManyToOne
    @MapsId("paquetId")  // This references the field above
    @JoinColumn(name = "paquet_id", insertable = false, updatable = false)
    private Paquet paquet;

    @ManyToOne
    @MapsId("produitId")  // This references the field above
    @JoinColumn(name = "produit_id", insertable = false, updatable = false)
    private Produits produit;

    private int quantite;

    public Long getPaquetId() {
        return paquetId;
    }

    public void setPaquetId(Long paquetId) {
        this.paquetId = paquetId;
    }

    public Long getProduitId() {
        return produitId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
    }

    public Paquet getPaquet() {
        return paquet;
    }

    public void setPaquet(Paquet paquet) {
        this.paquet = paquet;
    }

    public Produits getProduit() {
        return produit;
    }

    public void setProduit(Produits produit) {
        this.produit = produit;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }
// Getters and setters
}