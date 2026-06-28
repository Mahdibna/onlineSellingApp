package com.example.OnlineSellingApplicationBackend.Services;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    public void sendPasswordResetOtp(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your Password Reset Code");
        message.setText("You requested to reset your password.\n\nYour verification code is: " + otp +
                "\n\nPlease use this code within 5 minutes. If you did not make this request, please ignore this message.");


        mailSender.send(message);
    }
    public void sendVerificationEmail(String email, String verificationCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Verify Your Email Address");
        message.setText("Thank you for registering with Xinxu!\n\n" +
                "Your email verification code is: " + verificationCode + "\n\n" +
                "Please enter this code in the app to confirm your email address.\n" +
                "Note: This code is valid for 5 minutes.");


        mailSender.send(message);
    }
}