package com.example.OnlineSellingApplicationBackend.Security;
import com.example.OnlineSellingApplicationBackend.Repositories.AdminRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.SuperAdminRepository;
import com.example.OnlineSellingApplicationBackend.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
@Service
public class UserDetailsServiceImpl implements UserDetailsService{
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private AdminRepository adminRepository;
    @Autowired
    private SuperAdminRepository superAdminRepository;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<Client> client = clientRepository.findByEmail(username);
        if (client.isPresent()) {
            return buildUserDetails(client.get());
        }

        Optional<Admin> admin = adminRepository.findByEmail(username);
        if (admin.isPresent()) {
            return buildUserDetails(admin.get());
        }

        Optional<SuperAdmin> superAdmin = superAdminRepository.findByEmail(username);
        if (superAdmin.isPresent()) {
            return buildUserDetails(superAdmin.get());
        }

        throw new UsernameNotFoundException("User not found with email: " + username);
    }

    private UserDetails buildUserDetails(Utilisateur user) {
        String role = determineRole(user);
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + role) // e.g., "ROLE_SUPERADMIN"
        );
        return new CustomUserDetails(
                user.getEmail(),
                user.getMotDePasse(),
                authorities,
                user.getId() // Assuming Utilisateur has getId()
        );
    }
    private String determineRole(Utilisateur user) {
        if (user instanceof SuperAdmin) return "SUPERADMIN";
        if (user instanceof Admin) return "ADMIN";
        if (user instanceof Client) {
            return ((Client) user).getType() == TypeClient.Partner
                    ? "USERPARTNER" : "USERSTANDARD";
        }
        throw new IllegalArgumentException("Unknown user type");
    }
}