package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.Security.CustomUserDetails;
import com.example.OnlineSellingApplicationBackend.Security.JwtUtils;
import com.example.OnlineSellingApplicationBackend.Security.UserDetailsServiceImpl;
import com.example.OnlineSellingApplicationBackend.DTO.*;
import com.example.OnlineSellingApplicationBackend.Services.ClientService;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtils jwtUtils;

    @Autowired
    private ClientService clientService;

    public AuthController(AuthenticationManager authenticationManager,
                          UserDetailsServiceImpl userDetailsService,
                          JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin) {
                Optional<Client> clientOpt = clientService.findClientByEmail(userDetails.getUsername());
                if (clientOpt.isPresent()) {
                    Client client = clientOpt.get();

                    if (!client.isActif()) {
                        if (!client.isEmailVerified()) {
                            return ResponseEntity.status(403).body(Map.of(
                                    "error", "Your account is inactive. Please verify your email address by checking your mailbox.",
                                    "status", 403,
                                    "reason", "EMAIL_NOT_VERIFIED"
                            ));
                        } else {
                            return ResponseEntity.status(403).body(Map.of(
                                    "error", "Your account has been blocked by the administrator.",
                                    "status", 403,
                                    "reason", "ACCOUNT_BLOCKED"
                            ));
                        }
                    }

                    clientService.updateLastLogin(userDetails.getUserId());
                }
            }

            String token = jwtUtils.generateToken(
                    userDetails.getUsername(),
                    userDetails.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList()),
                    userDetails.getUserId()
            );

            return ResponseEntity.ok(Map.of(
                    "data", Map.of(
                            "token", token,
                            "user", Map.of(
                                    "id", userDetails.getUserId(),
                                    "email", userDetails.getUsername(),
                                    "roles", userDetails.getAuthorities().stream()
                                            .map(GrantedAuthority::getAuthority)
                                            .collect(Collectors.toList())
                            )
                    )
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Invalid email or password",
                    "status", 401
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Authentication failed",
                    "status", 401
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "status", 500
            ));
        }
    }
}