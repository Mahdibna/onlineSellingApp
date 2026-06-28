package com.example.OnlineSellingApplicationBackend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CartItem> cartItems = new HashSet<>();

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date expiresAt;

    private static final int EXPIRATION_MINUTES = 30;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        // Set expiration to EXPIRATION_MINUTES from creation
        updateExpirationTime();
    }

    /**
     * Updates the expiration time to be EXPIRATION_MINUTES from now
     * This should be called whenever the cart is modified
     */
    public void updateExpirationTime() {
        Date now = new Date();
        expiresAt = new Date(now.getTime() + EXPIRATION_MINUTES * 60 * 1000);
    }

    /**
     * Checks if the cart has expired
     * @return true if expired, false otherwise
     */
    public boolean isExpired() {
        Date now = new Date();
        return expiresAt == null || expiresAt.before(now);
    }

    /**
     * Gets the remaining time until expiration in minutes
     * @return remaining minutes, or 0 if expired
     */
    public int getRemainingMinutes() {
        if (isExpired()) {
            return 0;
        }

        Date now = new Date();
        long remainingMillis = expiresAt.getTime() - now.getTime();
        return (int) Math.max(0, remainingMillis / (60 * 1000));
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public Set<CartItem> getCartItems() {
        return cartItems;
    }

    public void setCartItems(Set<CartItem> cartItems) {
        this.cartItems = cartItems;
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
}