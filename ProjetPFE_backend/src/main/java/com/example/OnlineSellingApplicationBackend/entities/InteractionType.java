package com.example.OnlineSellingApplicationBackend.entities;

/**
 * Types of interactions that users can have with products
 */
public enum InteractionType {
    VIEW,           // User viewed the product details
    ADD_TO_CART,    // User added the product to their cart
    PURCHASE,       // User purchased the product
    WISHLIST        // User added the product to their wishlist
}