package com.example.OnlineSellingApplicationBackend.entities;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CleLCommandPack implements Serializable {
    private Long commande; // Utiliser l'ID au lieu de l'entité
    private Long paquet;   // Utiliser l'ID au lieu de l'entité
}