package com.example.OnlineSellingApplicationBackend.Security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String secret;

    // Keep the expiration property for backward compatibility, but we won't use it
    @Value("${jwt.expiration}")
    private int expiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Generate a new JWT token without expiration
     * @param username Username or email
     * @param roles List of user roles
     * @param userId User ID
     * @return JWT token string
     */
    public String generateToken(String username, List<String> roles, Long userId) {
        return Jwts.builder()
                .setSubject(username)
                .claim("roles", roles)
                .claim("userId", userId)
                .setIssuer("your-issuer")
                .setAudience("your-audience")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                // Removed the expiration date to make token non-expiring
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generate a token with client type information without expiration
     * @param username Username or email
     * @param roles List of user roles
     * @param userId User ID
     * @param clientType Client type (PARTNER or REGULAR)
     * @return JWT token string
     */
    public String generateTokenWithClientType(String username, List<String> roles, Long userId, String clientType) {
        return Jwts.builder()
                .setSubject(username)
                .claim("roles", roles)
                .claim("userId", userId)
                .claim("type", clientType)
                .setIssuer("your-issuer")
                .setAudience("your-audience")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                // Removed the expiration date to make token non-expiring
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extract all claims from a token
     * @param token JWT token string
     * @return Claims object
     */
    public Claims extractClaims(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Get username from token
     * @param token JWT token string
     * @return Username
     */
    public String getUsernameFromToken(String token) {
        return extractClaims(token).getSubject();
    }

    /**
     * Get client type from JWT token
     * @param token JWT token string
     * @return Client type string (PARTNER or REGULAR)
     */
    public String getClientTypeFromToken(String token) {
        Claims claims = extractClaims(token);

        // Return client type, defaulting to "REGULAR" if not found
        return claims.get("type", String.class) != null
                ? claims.get("type", String.class)
                : "REGULAR";
    }

    /**
     * Get client ID from JWT token
     * @param token JWT token string
     * @return Client ID
     */
    public Long getClientIdFromToken(String token) {
        Claims claims = extractClaims(token);

        // First try to get from userId claim
        if (claims.get("userId") != null) {
            return Long.valueOf(claims.get("userId").toString());
        }

        // Fallback to subject if it's numeric
        try {
            return Long.parseLong(claims.getSubject());
        } catch (NumberFormatException e) {
            logger.warn("Subject is not a valid client ID: {}", claims.getSubject());
            return null;
        }
    }

    /**
     * Validate JWT token - Modified to ignore expiration
     * @param token JWT token string
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            // Use parseClaimsJws to validate the token signature
            // This will not check for expiration since we're not setting it
            Jwts.parser().setSigningKey(getSigningKey()).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            // We're deliberately not catching ExpiredJwtException separately
            // since our tokens won't expire
            logger.error("Invalid token: {}", ex.getMessage());
        }
        return false;
    }
}
