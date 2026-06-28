package com.example.OnlineSellingApplicationBackend.Controllers;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {
    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }

    private final JavaMailSender mailSender;
    public TestController(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    @GetMapping("/email")
    public String sendTestEmail() {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("maamounaouini29@gmail.com");
        message.setSubject("Test Email");
        message.setText("This is a test email from Spring Boot");
        mailSender.send(message);
        return "Email sent successfully";
    }
}