package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.PaymentIntentDTO;
import com.example.OnlineSellingApplicationBackend.DTO.PaymentRequest;
import com.example.OnlineSellingApplicationBackend.DTO.PaymentResponse;
import com.example.OnlineSellingApplicationBackend.Services.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-intent")
    public ResponseEntity<PaymentIntentDTO> createPaymentIntent(@RequestBody Map<String, Object> request) {
        try {
            Double amount = Double.parseDouble(request.get("amount").toString());
            PaymentIntentDTO intent = paymentService.createStandalonePaymentIntent(amount);
            return ResponseEntity.ok(intent);
        } catch (Exception e) {
            System.err.println("Error creating payment intent: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @PostMapping("/process-intent")
    public ResponseEntity<PaymentResponse> processPaymentIntent(@RequestBody PaymentRequest paymentRequest) {
        try {
            PaymentResponse response = paymentService.processStandalonePayment(paymentRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error processing payment intent: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @PostMapping("/intent/{orderId}")
    public ResponseEntity<PaymentIntentDTO> createOrderPaymentIntent(@PathVariable Long orderId) {
        try {
            PaymentIntentDTO intent = paymentService.createPaymentIntent(orderId);
            return ResponseEntity.ok(intent);
        } catch (Exception e) {
            System.err.println("Error creating order payment intent: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @PostMapping("/process")
    public ResponseEntity<PaymentResponse> processOrderPayment(@RequestBody PaymentRequest paymentRequest) {
        try {
            PaymentResponse response = paymentService.processPayment(paymentRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error processing order payment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrder(@PathVariable Long orderId) {
        try {
            PaymentResponse response = paymentService.getPaymentDetails(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error getting payment details: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}