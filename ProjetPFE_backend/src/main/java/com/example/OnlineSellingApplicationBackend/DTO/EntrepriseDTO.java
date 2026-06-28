package com.example.OnlineSellingApplicationBackend.DTO;

public class EntrepriseDTO {

    private String MatriculeFiscale;
    private String nom;
    private String description;
    private String adresse;

    public String getMatriculeFiscale() {
        return MatriculeFiscale;
    }

    public void setMatriculeFiscale(String matriculeFiscale) {
        MatriculeFiscale = matriculeFiscale;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }
}
