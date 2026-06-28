package com.example.OnlineSellingApplicationBackend.entities;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CleFavoris implements Serializable {
    private Long clientId;
    private Long produitId;
}
