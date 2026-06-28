package com.example.OnlineSellingApplicationBackend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@IdClass(CleFavoris.class)
public class Favoris {

    @Id
    @Column(name = "client_id")
    private Long clientId;

    @Id
    @Column(name = "produit_id")
    private Long produitId;

    @ManyToOne
    @JoinColumn(name = "client_id", insertable = false, updatable = false)
    @JsonIgnore // Avoid serializing the client in the response
    private Client client;

    @ManyToOne
    @JoinColumn(name = "produit_id", insertable = false, updatable = false)
    @JsonIgnore // Avoid serializing the client in the response
    private Produits produits;

    // Setters explicites
    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public void setProduits(Produits produits) {
        this.produits = produits;
    }

    public Long getClientId() {
        return clientId;
    }

    public Long getProduitId() {
        return produitId;
    }

    public Client getClient() {
        return client;
    }

    public Produits getProduits() {
        return produits;
    }
}