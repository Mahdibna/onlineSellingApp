// ClientTypeDTO.java
package com.example.OnlineSellingApplicationBackend.DTO;

public class ClientTypeDTO {
    private String clientType;
    private Long count;

    public ClientTypeDTO(String clientType, Long count) {
        this.clientType = clientType;
        this.count = count;
    }

    // Getters
    public String getClientType() { return clientType; }
    public Long getCount() { return count; }
}