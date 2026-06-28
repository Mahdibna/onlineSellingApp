package com.example.OnlineSellingApplicationBackend.Exeptions;

// Custom exception for invalid requests
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
