package com.example.OnlineSellingApplicationBackend.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class OtpService {

    // In-memory storage for OTPs (email -> OTP details)
    private final Map<String, OtpData> otpMap = new HashMap<>();

    // OTP validity duration in minutes
    private static final int OTP_VALIDITY_MINUTES = 15;

    // Generate a random OTP
    public String generateOtp(String email) {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000); // 6-digit OTP

        // Store OTP with creation time
        otpMap.put(email, new OtpData(String.valueOf(otp), LocalDateTime.now()));

        return String.valueOf(otp);
    }

    // Validate OTP
    public boolean validateOtp(String email, String otp) {
        OtpData otpData = otpMap.get(email);

        // Check if OTP exists and is valid
        if (otpData != null && otpData.getOtp().equals(otp)) {
            LocalDateTime expiryTime = otpData.getCreationTime().plusMinutes(OTP_VALIDITY_MINUTES);

            // Check if OTP is still valid (not expired)
            if (LocalDateTime.now().isBefore(expiryTime)) {
                // Remove OTP after successful validation
                otpMap.remove(email);
                return true;
            }
        }

        return false;
    }

    // Generate email verification code
    public String generateEmailVerificationCode(String email) {
        // For email verification, we'll use a 6-digit code
        return generateOtp(email);
    }

    // Inner class to store OTP data
    private static class OtpData {
        private final String otp;
        private final LocalDateTime creationTime;

        public OtpData(String otp, LocalDateTime creationTime) {
            this.otp = otp;
            this.creationTime = creationTime;
        }

        public String getOtp() {
            return otp;
        }

        public LocalDateTime getCreationTime() {
            return creationTime;
        }
    }
}
