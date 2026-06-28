package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.CartDTO;
import com.example.OnlineSellingApplicationBackend.DTO.CartOperationRequest;
import com.example.OnlineSellingApplicationBackend.Services.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    /**
     * Get cart for a client
     */
    @GetMapping("/{clientId}")
    public ResponseEntity<CartDTO> getCart(@PathVariable Long clientId) {
        CartDTO cart = cartService.getOrCreateCart(clientId);
        return ResponseEntity.ok(cart);
    }

    /**
     * Add an item to the cart
     */
    @PostMapping("/{clientId}/add")
    public ResponseEntity<CartDTO> addToCart(
            @PathVariable Long clientId,
            @RequestBody CartOperationRequest request) {
        CartDTO updatedCart = cartService.addToCart(clientId, request);
        return ResponseEntity.ok(updatedCart);
    }

    /**
     * Update item quantity in cart
     */
    @PutMapping("/{clientId}/items/{cartItemId}")
    public ResponseEntity<CartDTO> updateCartItemQuantity(
            @PathVariable Long clientId,
            @PathVariable Long cartItemId,
            @RequestParam Integer quantity) {
        if (quantity <= 0) {
            return ResponseEntity.badRequest().body(null);
        }
        CartDTO updatedCart = cartService.updateCartItemQuantity(clientId, cartItemId, quantity);
        return ResponseEntity.ok(updatedCart);
    }

    /**
     * Remove an item from the cart
     */
    @DeleteMapping("/{clientId}/items/{cartItemId}")
    public ResponseEntity<CartDTO> removeCartItem(
            @PathVariable Long clientId,
            @PathVariable Long cartItemId) {
        CartDTO updatedCart = cartService.removeCartItem(clientId, cartItemId);
        return ResponseEntity.ok(updatedCart);
    }

    /**
     * Clear all items from a cart
     */
    @DeleteMapping("/{clientId}/clear")
    public ResponseEntity<CartDTO> clearCart(@PathVariable Long clientId) {
        CartDTO emptyCart = cartService.clearCart(clientId);
        return ResponseEntity.ok(emptyCart);
    }
    /**
     * Clear cart after order is processed
     * This is a custom endpoint that can be called from the frontend after a successful order
     */
    @PostMapping("/{clientId}/clear-after-order")
    public ResponseEntity<Void> clearCartAfterOrder(@PathVariable Long clientId) {
        cartService.clearCartAfterOrder(clientId);
        return ResponseEntity.ok().build();
    }
}