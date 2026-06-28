package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Admin extends Utilisateur {
    private String adminSpecificField; // Example field specific to Admin

    public void setAdminSpecificField(String adminSpecificField) {
        this.adminSpecificField = adminSpecificField;
    }

    public String getAdminSpecificField() {
        return adminSpecificField;
    }
}
