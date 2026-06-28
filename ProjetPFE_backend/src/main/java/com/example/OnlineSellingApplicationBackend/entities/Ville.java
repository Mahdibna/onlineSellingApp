package com.example.OnlineSellingApplicationBackend.entities;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;



@Data
@Entity
public class Ville {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ou une autre stratégie selon votre besoin
    private Long id;
    @Column(name = "nom")
    private String nom;

    @ManyToOne
    private Pays pays;

    @OneToMany(mappedBy = "ville")
    private List<Adresse> adresses;

    public Ville(String nomVille, Pays pays) {
        this.nom = nomVille;
        this.pays = pays;
    }
    public Ville() {
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
    // Ville.java
    public void setNom(String nom) {
        this.nom = nom != null ? nom.trim().toLowerCase() : null;
    }
    public Pays getPays() {
        return pays;
    }

    public void setPays(Pays pays) {
        this.pays = pays;
    }

    public List<Adresse> getAdresses() {
        return adresses;
    }

    public void setAdresses(List<Adresse> adresses) {
        this.adresses = adresses;
    }
}
