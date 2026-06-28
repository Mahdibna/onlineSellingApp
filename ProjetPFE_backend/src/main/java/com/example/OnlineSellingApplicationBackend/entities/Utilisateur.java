package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS) // Separate table for each subclass
public abstract class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO) // Use AUTO for TABLE_PER_CLASS
    private Long id;
    private String nom;
    @Column(unique = true)
    private String email;
    private String motDePasse;
    private String profil;

    public Long getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public String getEmail() {
        return email;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public String getProfil() {
        return profil;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setMotDePasse(String motDePasse) {
        this.motDePasse = motDePasse;
    }

    public void setProfil(String profil) {
        this.profil = profil;
    }
}
