package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.StatusReclamation;

public class UpdateStatusDTO {
    private StatusReclamation status;

    public StatusReclamation getStatus() {
        return status;
    }

    public void setStatus(StatusReclamation status) {
        this.status = status;
    }
    // getter et setter
}
