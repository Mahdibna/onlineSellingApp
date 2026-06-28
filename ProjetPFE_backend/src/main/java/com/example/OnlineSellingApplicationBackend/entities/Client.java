package com.example.OnlineSellingApplicationBackend.entities;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Client extends Utilisateur {
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeClient type = TypeClient.Individual;
    private String description;
    private boolean actif = true;
    private String tel;
    @OneToOne(mappedBy = "client")
    private Entreprise entreprise;
    @ManyToOne // Correction ici
    @JoinColumn(name = "adresse_id", nullable = true)
    @JsonIgnore
    private Adresse adresse; // Plusieurs clients peuvent avoir la même adresse
    @OneToMany(mappedBy = "client")
    private Set<Favoris> favoris;
    @OneToMany(mappedBy = "client")
    private Set<Note> notes;
    @OneToMany(mappedBy = "client")
    private Set<Commande> commandes;
    @OneToMany(mappedBy = "client")
    private Set<Reclamation> reclamations;

    @Column(nullable = false)
    private boolean emailVerified = false;
    // ✅ New Field: Registration Date
    @Column(name = "registration_date", nullable = false, updatable = false)
    private LocalDateTime registrationDate;
    // ✅ Automatically Set Registration Date Before Insert
    @PrePersist
    protected void onCreate() {
        this.registrationDate = LocalDateTime.now();
    }
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
// Add this field and its getters/setters to your Client entity
    @Column(name = "fcm_token")
    private String fcmToken;
    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getFcmToken() {
        return fcmToken;
    }

    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }
    // Add getter and setter
    public LocalDateTime getLastLogin() {
        return lastLogin;
    }
    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }
    // Méthode pour vérifier si le client a effectué au moins une commande

    public boolean aPasseCommande() {
        return !commandes.isEmpty();  // Vérifie si le client a au moins une commande
    }
    private boolean isClientPartner(Client client) {
        if (client == null) return false;

        // Check the client type using the TypeClient enum
        return TypeClient.Partner.equals(client.getType());
    }
    public Set<Reclamation> getReclamations() {
        return reclamations;
    }

    public void setReclamations(Set<Reclamation> reclamations) {
        this.reclamations = reclamations;
    }

    public Set<Favoris> getFavoris() {
        return favoris;
    }

    public Set<Note> getNotes() {
        return notes;
    }

    public Set<Commande> getCommandes() {
        return commandes;
    }

    public TypeClient getType() {
        return type;
    }

    public void setType(TypeClient type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActif() {
        return actif;
    }

    public void setActif(boolean actif) {
        this.actif = actif;
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public Entreprise getEntreprise() {
        return entreprise;
    }

    public void setEntreprise(Entreprise entreprise) {
        this.entreprise = entreprise;
    }

    public Adresse getAdresse() {
        return adresse;
    }

    public void setAdresse(Adresse adresse) {
        this.adresse = adresse;
    }

    public void setFavoris(Set<Favoris> favoris) {
        this.favoris = favoris;
    }

    public void setNotes(Set<Note> notes) {
        this.notes = notes;
    }

    public void setCommandes(Set<Commande> commandes) {
        this.commandes = commandes;
    }

}
