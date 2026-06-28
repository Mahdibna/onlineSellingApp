package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.CartDTO;
import com.example.OnlineSellingApplicationBackend.DTO.CartItemDTO;
import com.example.OnlineSellingApplicationBackend.DTO.CartOperationRequest;
import com.example.OnlineSellingApplicationBackend.Repositories.CartItemRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.CartRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.PaquetRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ProduitsRepository;
import com.example.OnlineSellingApplicationBackend.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ProduitsRepository produitRepository;

    @Autowired
    private PaquetRepository paquetRepository;

    @Transactional
    public CartDTO getOrCreateCart(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        Cart cart = cartRepository.findByClientId(clientId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setClient(client);
                    newCart.setCreatedAt(new Date());
                    newCart.updateExpirationTime(); // Set initial expiration
                    return cartRepository.save(newCart);
                });
        if (cart.isExpired()) {
            resetExpiredCart(cart);
        }

        return convertToDTO(cart);
    }
    @Transactional
    private void resetExpiredCart(Cart cart) {
        // Return items to stock
        returnCartItemsToStock(cart);

        // Clear all items
        cart.getCartItems().clear();

        // Reset timestamps
        cart.setCreatedAt(new Date());
        cart.updateExpirationTime();

        cartRepository.save(cart);
    }

    @Transactional
    private void resetEmptyCart(Cart cart) {
        // Reset timestamps
        cart.setCreatedAt(new Date());
        cart.updateExpirationTime();

        cartRepository.save(cart);
    }

    @Transactional
    private void returnCartItemsToStock(Cart cart) {
        for (CartItem item : cart.getCartItems()) {
            if (item.getProduit() != null) {
                // Return product to stock
                Produits product = item.getProduit();
                product.setQuantite(product.getQuantite() + item.getQuantity());
                produitRepository.save(product);
            } else if (item.getPaquet() != null) {
                // Return pack to stock
                Paquet pack = item.getPaquet();
                pack.setQuantite(pack.getQuantite() + item.getQuantity());
                paquetRepository.save(pack);
            }
        }
    }
    @Transactional
    public CartDTO addToCart(Long clientId, CartOperationRequest request) {
        if (request.getProductId() == null && request.getPackId() == null) {
            throw new IllegalArgumentException("Either productId or packId must be provided");
        }

        Cart cart = getCartEntity(clientId);

        if (cart.isExpired()) {
            resetExpiredCart(cart);
        }
        else if (cart.getCartItems().isEmpty()) {
            resetEmptyCart(cart);
        }

        if (request.getProductId() != null) {
            addProductToCart(cart, request.getProductId(), request.getQuantity());
        } else {
            addPackToCart(cart, request.getPackId(), request.getQuantity());
        }

        cart = cartRepository.save(cart);

        return convertToDTO(cart);
    }

    @Transactional
    public CartDTO updateCartItemQuantity(Long clientId, Long cartItemId, Integer quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        Cart cart = getCartEntity(clientId);

        if (cart.isExpired()) {
            throw new RuntimeException("Cart has expired");
        }

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Cart item does not belong to this cart");
        }

        int quantityDifference = quantity - cartItem.getQuantity();

        if (quantityDifference != 0) {
            if (cartItem.getProduit() != null) {
                Produits product = cartItem.getProduit();
                if (quantityDifference > 0) {
                    int availableStock = product.getQuantite();
                    if (quantityDifference > availableStock) {
                        throw new RuntimeException("Not enough stock available");
                    }
                    product.setQuantite(product.getQuantite() - quantityDifference);
                } else {
                    product.setQuantite(product.getQuantite() - quantityDifference);
                }
                produitRepository.save(product);
            } else if (cartItem.getPaquet() != null) {
                Paquet pack = cartItem.getPaquet();
                if (quantityDifference > 0) {
                    int availableStock = pack.getQuantite();
                    if (quantityDifference > availableStock) {
                        throw new RuntimeException("Not enough stock available");
                    }
                    pack.setQuantite(pack.getQuantite() - quantityDifference);
                } else {
                    pack.setQuantite(pack.getQuantite() - quantityDifference);
                }
                paquetRepository.save(pack);
            }
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);

        cart = cartRepository.save(cart);

        return convertToDTO(cart);
    }

    @Transactional
    public CartDTO removeCartItem(Long clientId, Long cartItemId) {
        Cart cart = getCartEntity(clientId);

        if (cart.isExpired()) {
            throw new RuntimeException("Cart has expired");
        }

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Cart item does not belong to this cart");
        }

        if (cartItem.getProduit() != null) {
            Produits product = cartItem.getProduit();
            product.setQuantite(product.getQuantite() + cartItem.getQuantity());
            produitRepository.save(product);
        } else if (cartItem.getPaquet() != null) {
            Paquet pack = cartItem.getPaquet();
            pack.setQuantite(pack.getQuantite() + cartItem.getQuantity());
            paquetRepository.save(pack);
        }

        cart.getCartItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        cart = cartRepository.save(cart);

        return convertToDTO(cart);
    }

    @Transactional
    public CartDTO clearCart(Long clientId) {
        Cart cart = getCartEntity(clientId);

        returnCartItemsToStock(cart);

        cart.getCartItems().clear();

        cart = cartRepository.save(cart);

        return convertToDTO(cart);
    }

    @Transactional
    public void clearCartAfterOrder(Long clientId) {
        Optional<Cart> cartOpt = cartRepository.findByClientId(clientId);

        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cart.getCartItems().clear();
            cartRepository.save(cart);
        }
    }

    private void addProductToCart(Cart cart, Long productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            quantity = 1;
        }

        Produits product = produitRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.isDisponibilite()) {
            throw new RuntimeException("Product is not available");
        }

        if (product.getQuantite() < quantity) {
            throw new RuntimeException("Not enough stock available");
        }

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + quantity;

            if (quantity > product.getQuantite()) {
                throw new RuntimeException("Not enough stock available");
            }

            product.setQuantite(product.getQuantite() - quantity);
            produitRepository.save(product);

            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduit(product);
            newItem.setPaquet(null);
            newItem.setQuantity(quantity);

            product.setQuantite(product.getQuantite() - quantity);
            produitRepository.save(product);

            cart.getCartItems().add(newItem);
            cartItemRepository.save(newItem);
        }
    }

    private void addPackToCart(Cart cart, Long packId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            quantity = 1;
        }

        Paquet pack = paquetRepository.findById(packId)
                .orElseThrow(() -> new RuntimeException("Pack not found"));

        if (!pack.isDisponibilite()) {
            throw new RuntimeException("Pack is not available");
        }

        if (pack.getQuantite() < quantity) {
            throw new RuntimeException("Not enough stock available");
        }

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndPackId(cart.getId(), packId);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + quantity;
            if (quantity > pack.getQuantite()) {
                throw new RuntimeException("Not enough stock available");
            }

            pack.setQuantite(pack.getQuantite() - quantity);
            paquetRepository.save(pack);

            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduit(null);
            newItem.setPaquet(pack);
            newItem.setQuantity(quantity);

            pack.setQuantite(pack.getQuantite() - quantity);
            paquetRepository.save(pack);

            cart.getCartItems().add(newItem);
            cartItemRepository.save(newItem);
        }
    }


    private Cart getCartEntity(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        return cartRepository.findByClientId(clientId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setClient(client);
                    newCart.setCreatedAt(new Date());
                    newCart.updateExpirationTime();
                    return cartRepository.save(newCart);
                });
    }



    @Transactional
    private CartDTO convertToDTO(Cart cart) {
        CartDTO dto = new CartDTO();
        dto.setCartId(cart.getId());
        dto.setClientId(cart.getClient().getId());
        dto.setCreatedAt(cart.getCreatedAt());
        dto.setExpiresAt(cart.getExpiresAt());
        dto.setTimeRemainingMinutes(cart.getRemainingMinutes());

        boolean isPartner = TypeClient.Partner.equals(cart.getClient().getType());

        List<CartItemDTO> itemDTOs = new ArrayList<>();
        double total = 0.0;

        for (CartItem item : cart.getCartItems()) {
            CartItemDTO itemDTO = new CartItemDTO();
            itemDTO.setCartItemId(item.getId());
            itemDTO.setQuantity(item.getQuantity());

            if (item.getProduit() != null) {
                Produits product = item.getProduit();
                itemDTO.setType("PRODUCT");
                itemDTO.setProductId(product.getId());
                itemDTO.setName(product.getNom());
                itemDTO.setUnitPrice(product.getPrix());

                itemDTO.setPromotionPartenaire(product.getPromotionPartenaire());
                itemDTO.setPromotionParticulier(product.getPromotionParticulier());

                double appliedPrice = calculateAppliedPrice(product.getPrix(),
                        product.getPromotionPartenaire(),
                        product.getPromotionParticulier(),
                        isPartner);
                itemDTO.setPrixApplique(appliedPrice);

                double subtotal = appliedPrice * item.getQuantity();
                itemDTO.setSubtotal(subtotal);
                itemDTO.setStockRemaining(product.getQuantite());

                if (product.getCategories() != null && !product.getCategories().isEmpty()) {
                    Categories firstCategory = product.getCategories().iterator().next();
                    itemDTO.setCategory(firstCategory.getNom());
                }

                if (product.getPhotos() != null && !product.getPhotos().isEmpty()) {
                    String firstPhoto = product.getPhotos().iterator().next();
                    itemDTO.setImageUrl(firstPhoto);
                }

                total += subtotal;
            } else if (item.getPaquet() != null) {
                Paquet pack = item.getPaquet();
                itemDTO.setType("PACK");
                itemDTO.setPackId(pack.getId());
                itemDTO.setName(pack.getNom());
                itemDTO.setUnitPrice(pack.getPrix());

                itemDTO.setPromotionPartenaire(0);
                itemDTO.setPromotionParticulier(0);

                double appliedPrice = pack.getPrix();
                itemDTO.setPrixApplique(appliedPrice);

                double subtotal = appliedPrice * item.getQuantity();
                itemDTO.setSubtotal(subtotal);
                itemDTO.setStockRemaining(pack.getQuantite());

                if (pack.getPhotos() != null && !pack.getPhotos().isEmpty()) {
                    String firstPhoto = pack.getPhotos().iterator().next();
                    itemDTO.setImageUrl(firstPhoto);
                }
                total += subtotal;
            }

            itemDTOs.add(itemDTO);
        }

        dto.setItems(itemDTOs);
        dto.setTotal(total);

        return dto;
    }


    private double calculateAppliedPrice(double basePrice,
                                         double promotionPartenaire,
                                         double promotionParticulier,
                                         boolean isPartner) {
        if (isPartner && promotionPartenaire > 0) {
            if (promotionPartenaire > 1) {
                return basePrice * promotionPartenaire;
            } else {
                return basePrice * (1 - promotionPartenaire);
            }
        }
        else if (!isPartner && promotionParticulier > 0) {
            return basePrice * (1 - promotionParticulier);
        }

        return basePrice;
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupExpiredCarts() {
        Date currentTime = new Date();
        List<Cart> expiredCarts = cartRepository.findExpiredCarts(currentTime);

        for (Cart cart : expiredCarts) {
            returnCartItemsToStock(cart);

            cart.getCartItems().clear();
            cartRepository.save(cart);
        }
    }

    public static class Message {
        private String role;
        private String content;

        private Message() {}

        public static Message systemMessage(String content) {
            Message message = new Message();
            message.role = "system";
            message.content = content;
            return message;
        }

        public static Message userMessage(String content) {
            Message message = new Message();
            message.role = "user";
            message.content = content;
            return message;
        }

        public String getRole() {
            return role;
        }

        public String getContent() {
            return content;
        }
    }
}