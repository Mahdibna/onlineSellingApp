package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_product_interactions")
@Data
@NoArgsConstructor
public class UserProductInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Produits produit;

    @Enumerated(EnumType.STRING)
    private InteractionType type;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public UserProductInteraction(Client client, Produits produit, InteractionType type) {
        this.client = client;
        this.produit = produit;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public Produits getProduit() {
        return produit;
    }

    public void setProduit(Produits produit) {
        this.produit = produit;
    }

    public InteractionType getType() {
        return type;
    }

    public void setType(InteractionType type) {
        this.type = type;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }


    public UserProductInteraction(Long id, Client client, Produits produit, InteractionType type, LocalDateTime createdAt) {
        this.id = id;
        this.client = client;
        this.produit = produit;
        this.type = type;
        this.createdAt = createdAt;
    }
}
