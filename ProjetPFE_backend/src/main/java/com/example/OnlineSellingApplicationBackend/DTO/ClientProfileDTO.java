package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.Client;

public record ClientProfileDTO(
        Long id,
        String nom,
        String email,
        String tel,
        String type



) {
    public static ClientProfileDTO fromClient(Client client) {
        return new ClientProfileDTO(
                client.getId(),
                client.getNom(),
                client.getEmail(),
                client.getTel(),
                client.getType() != null ? client.getType().toString() : null
        );
    }
}
