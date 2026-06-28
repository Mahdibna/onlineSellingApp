package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@IdClass(CleLCommandPack.class)
public class LigneCommandPack {

    @Id
    @ManyToOne
    @JoinColumn(name = "commande_id") // Assure-toi que le nom correspond à la BDD
    private Commande commande;

    @Id
    @ManyToOne
    @JoinColumn(name = "paquet_id") // Assure-toi que le nom correspond à la BDD
    private Paquet paquet; // Utiliser "paquet" et non "paquett" pour correspondre à l'IDClass
    private int quantite;


    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public Commande getCommande() {
        return commande;
    }

    public Paquet getPaquet() {
        return paquet;
    }

    public void setPaquet(Paquet paquet) {
        this.paquet = paquet;
    }

    public void setCommande(Commande commande) {
        this.commande = commande;
    }
}
