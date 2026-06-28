package com.example.OnlineSellingApplicationBackend.DTO;

import jakarta.annotation.Nullable;
import lombok.Data;

@Data
public class ClientInfoResponse {
    private Long id;
    private String nom;
    private String email;
    private String tel;
    private String type;
    private boolean isActif = true;
    private String description;
    private String entrepriseNom; // If client belongs to an entreprise
    private String matriculeFiscale; // If client belongs to an entreprise
    private @Nullable AddressResponse addressResponse;

    public ClientInfoResponse(Long id, boolean isActif, String nom, String email, String tel, String type, String description, String entrepriseNom, String matriculeFiscale) {
        this.id = id;
        this.isActif = isActif;
        this.nom = nom;
        this.email = email;
        this.tel = tel;
        this.type = type;
        this.description = description;
        this.entrepriseNom = entrepriseNom;
        this.matriculeFiscale = matriculeFiscale;
    }

    public ClientInfoResponse(Long id, String nom, String email, String tel, String type, String description, String entrepriseNom, String matriculeFiscale) {
        this.id = id;
        this.nom = nom;
        this.email = email;
        this.tel = tel;
        this.type = type;
        this.description = description;
        this.entrepriseNom = entrepriseNom;
        this.matriculeFiscale = matriculeFiscale;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isActif() {
        return isActif;
    }

    public void setActif(boolean actif) {
        isActif = actif;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEntrepriseNom() {
        return entrepriseNom;
    }

    public void setEntrepriseNom(String entrepriseNom) {
        this.entrepriseNom = entrepriseNom;
    }

    public String getMatriculeFiscale() {
        return matriculeFiscale;
    }

    public void setMatriculeFiscale(String matriculeFiscale) {
        this.matriculeFiscale = matriculeFiscale;
    }

    public AddressResponse getAddressResponse() {
        return addressResponse;
    }

    public void setAddressResponse(AddressResponse addressResponse) {
        this.addressResponse = addressResponse;
    }
}