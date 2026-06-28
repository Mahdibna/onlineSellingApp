package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

public class ClePaquet implements Serializable {
    private Long paquetId;
    private Long produitId;

    // Constructors
    public ClePaquet() {}

    public ClePaquet(Long paquetId, Long produitId) {
        this.paquetId = paquetId;
        this.produitId = produitId;
    }

    // Getters and setters
    public Long getPaquetId() {
        return paquetId;
    }

    public void setPaquetId(Long paquetId) {
        this.paquetId = paquetId;
    }

    public Long getProduitId() {
        return produitId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ClePaquet clePaquet = (ClePaquet) o;
        return Objects.equals(paquetId, clePaquet.paquetId) &&
                Objects.equals(produitId, clePaquet.produitId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(paquetId, produitId);
    }

}