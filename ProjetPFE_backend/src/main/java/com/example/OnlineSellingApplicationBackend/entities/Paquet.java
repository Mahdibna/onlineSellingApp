package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Paquet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ✅ Correct placement
    private Long id;
    private Boolean disponibility = true;
    private String nom;
    private int quantite;
    private double prix;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pack_photos", joinColumns = @JoinColumn(name = "pack_id"))
    @Column(name = "photo_path")
    private Set<String> photos = new HashSet<>();

    public Set<String> getPhotos() {
        return photos;
    }
    public List<Produits> getProduits() {
        return lignePaquets.stream()
                .map(LignePaquet::getProduit)
                .collect(Collectors.toList());
    }
    public void setPhotos(Set<String> photos) {
        this.photos = photos;
    }

    @OneToMany(mappedBy = "paquet")
    private Set<LignePaquet> lignePaquets;

    @OneToMany(mappedBy = "paquet")
    private Set<LigneCommandPack> ligneCommandePack;

    public Set<LigneCommandPack> getLigneCommandePack() {
        return ligneCommandePack;
    }

    public void setLigneCommandePack(Set<LigneCommandPack> ligneCommandePack) {
        this.ligneCommandePack = ligneCommandePack;
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

    public Set<LignePaquet> getLignePaquets() {
        return lignePaquets;
    }

    public void setLignePaquets(Set<LignePaquet> lignePaquets) {
        this.lignePaquets = lignePaquets;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
    public Boolean getDisponibility() {
        return disponibility;
    }

    public void setDisponibility(Boolean disponibility) {
        this.disponibility = disponibility;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public boolean isDisponibilite() {
        return this.disponibility;
    }
}