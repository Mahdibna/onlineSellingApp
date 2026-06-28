package com.example.OnlineSellingApplicationBackend.DTO;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class CartDTO {
    private Long cartId;
    private Long clientId;
    private List<CartItemDTO> items = new ArrayList<>();
    private double total;
    private Date createdAt;
    private Date expiresAt;
    private int timeRemainingMinutes;

    // Getters and setters
    public Long getCartId() {
        return cartId;
    }

    public void setCartId(Long cartId) {
        this.cartId = cartId;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public List<CartItemDTO> getItems() {
        return items;
    }

    public void setItems(List<CartItemDTO> items) {
        this.items = items;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }

    public int getTimeRemainingMinutes() {
        return timeRemainingMinutes;
    }

    public void setTimeRemainingMinutes(int timeRemainingMinutes) {
        this.timeRemainingMinutes = timeRemainingMinutes;
    }
}