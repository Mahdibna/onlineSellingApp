package com.example.OnlineSellingApplicationBackend.DTO;
import com.example.OnlineSellingApplicationBackend.entities.TypeClient;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;

// ClientRegistrationRequest.java
@AllArgsConstructor
public class ClientRegistrationRequest {
    private String nom;
    @Enumerated(EnumType.STRING)  // Explicit enum mapping
    private TypeClient type;
    private String description;
    private String tel;
    private String profil;
    private boolean actif = true;
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8)
    private String motDePasse;

    private AddressResponse address;
    public TypeClient getType() {
        return type;
    }

    public void setType(TypeClient type) {
        this.type = type;
    }
    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getProfil() {
        return profil;
    }

    public void setProfil(String profil) {
        this.profil = profil;
    }

    public boolean isActif() {
        return actif;
    }

    public void setActif(boolean actif) {
        this.actif = actif;
    }

    public @NotBlank @Size(min = 8) String getMotDePasse() {
        return motDePasse;
    }

    public void setMotDePasse(@NotBlank @Size(min = 8) String motDePasse) {
        this.motDePasse = motDePasse;
    }
    // ClientRegistrationRequest.java


    // Add other validation annotations as needed
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public static TypeClient fromString(String type) {
        for (TypeClient t : TypeClient.values()) {
            if (t.name().equalsIgnoreCase(type)) {
                return t;
            }
        }
        throw new IllegalArgumentException("Invalid TypeClient: " + type);
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public AddressResponse getAddress() {
        return address;
    }

    public void setAddress(AddressResponse address) {
        this.address = address;
    }
}
