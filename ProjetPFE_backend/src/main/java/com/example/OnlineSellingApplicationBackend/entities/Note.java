package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Objects;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@IdClass(CleNote.class)
public class Note {

    @Id
    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @Id
    @ManyToOne
    @JoinColumn(name = "produit_id")
    private Produits produit;

    private int rating;
    private String commentaire;
    private LocalDateTime date;

    public void setRating(int rating) {
        this.rating = rating;
        if (this.date == null) {
            this.date = LocalDateTime.now();
        }
    }

    // ==================== CRITICAL FIX ====================
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Note)) return false;
        Note note = (Note) o;
        return Objects.equals(client, note.client) &&
                Objects.equals(produit, note.produit);
    }

    @Override
    public int hashCode() {
        return Objects.hash(client, produit);
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

    public int getRating() {
        return rating;
    }


    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }
}