package com.example.OnlineSellingApplicationBackend.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthEntryPoint authEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthEntryPoint authEntryPoint,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.authEntryPoint = authEntryPoint;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(eh -> eh.authenticationEntryPoint(authEntryPoint))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // === PUBLIC ENDPOINTS (MUST BE AT THE TOP) ===
                        .requestMatchers("/api/clients/register").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/clients/forgot-password").permitAll()
                        .requestMatchers("/api/clients/verify-otp").permitAll()
                        .requestMatchers("/api/clients/reset-password/**").permitAll()
                        .requestMatchers("/api/clients/verify-email").permitAll()
                        .requestMatchers("/api/clients/resend-verification").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/test/**").permitAll()

                        // === PROTECTED ENDPOINTS ===
                        .requestMatchers("/api/clients/profile").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER")
                        .requestMatchers("/api/clients/all").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/clients/stats/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/clients/{clientId}").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/clients/profile/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER")
                        .requestMatchers("/api/clients/products").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER")

                        // Admin & SuperAdmin
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/superadmin").permitAll()
                        .requestMatchers("/api/superadmin/**").hasAuthority("ROLE_SUPERADMIN")

                        // General protected routes
                        .requestMatchers("/api/Products/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER", "ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/categories/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER", "ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/commandes/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER", "ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/reclamations/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER", "ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/favorites/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER")
                        .requestMatchers("/api/cart/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER", "ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/rate/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER")
                        .requestMatchers("/api/partnerApplication/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER", "ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/notifications/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER", "ROLE_ADMIN", "ROLE_SUPERADMIN")
                        .requestMatchers("/api/advanced-recommendations/**").hasAnyAuthority("ROLE_USERSTANDARD", "ROLE_USERPARTNER")

                        // Fallback - everything else requires authentication
                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://10.0.2.2:*",
                "http://192.168.*.*:*",
                "exp://*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "content-type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}