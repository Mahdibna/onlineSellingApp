package com.example.OnlineSellingApplicationBackend.Repositories;

import com.example.OnlineSellingApplicationBackend.entities.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    /**
     * Find cart by client ID
     */
    @Query("SELECT c FROM Cart c WHERE c.client.id = :clientId")
    Optional<Cart> findByClientId(@Param("clientId") Long clientId);

    /**
     * Find all expired carts
     */
    @Query("SELECT c FROM Cart c WHERE c.expiresAt < :currentTime")
    List<Cart> findExpiredCarts(@Param("currentTime") Date currentTime);
}