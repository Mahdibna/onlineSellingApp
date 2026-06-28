package com.example.OnlineSellingApplicationBackend.entities;

import java.io.Serializable;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CleNote implements Serializable {

    private Long client;  // Must match the field name in `Note`
    private Long produit; // Must match the field name in `Note`

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CleNote cleNote = (CleNote) o;
        return Objects.equals(client, cleNote.client) &&
                Objects.equals(produit, cleNote.produit);
    }

    @Override
    public int hashCode() {
        return Objects.hash(client, produit);
    }
}
