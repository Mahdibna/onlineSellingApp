package com.example.OnlineSellingApplicationBackend.DTO;
import java.util.Set;
public class CategoryDTO {
    private Long id;
    private String nom;
    private String description;
    private String photo;
    public CategoryDTO(Long id, String nom, String description, String photo) {
        this.id = id;
        this.nom = nom;
        this.description = description;
        this.photo = photo;
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
    public void setNom(String nom) {
        this.nom = nom;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }
}