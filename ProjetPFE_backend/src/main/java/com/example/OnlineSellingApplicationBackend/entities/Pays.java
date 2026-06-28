package com.example.OnlineSellingApplicationBackend.entities;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;


@AllArgsConstructor
@Data
@Entity
public class Pays {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ou une autre stratégie selon votre besoin
    private Long id;
    @Column(unique = true)
    private String nom;
    @OneToMany(mappedBy = "pays", cascade = CascadeType.ALL)
    private List<Ville> villes;
    public Pays(String nomPay) {
        this.nom=nomPay;
    }
    public Pays(){

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



    public List<Ville> getVilles() {
        return villes;
    }

    public void setVilles(List<Ville> villes) {
        this.villes = villes;
    }
    // Pays.java
    public void setNom(String nom) {
        this.nom = nom != null ? nom.trim().toLowerCase() : null;
    }


}
