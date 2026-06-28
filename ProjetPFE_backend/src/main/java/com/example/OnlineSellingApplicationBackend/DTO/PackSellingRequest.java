package com.example.OnlineSellingApplicationBackend.DTO;
public class PackSellingRequest {
    private Long id_Pack;
    private int quantite;

    public Long getId_Pack() {
        return id_Pack;
    }

    public void setId_Pack(Long id_Pack) {
        this.id_Pack = id_Pack;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }
}
