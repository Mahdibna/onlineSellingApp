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
public class SuperAdmin extends Utilisateur{
    private String superAdminSpecificField; // Example field specific to SuperAdmin

    public String getSuperAdminSpecificField() {
        return superAdminSpecificField;
    }

    public void setSuperAdminSpecificField(String superAdminSpecificField) {
        this.superAdminSpecificField = superAdminSpecificField;
    }
}
