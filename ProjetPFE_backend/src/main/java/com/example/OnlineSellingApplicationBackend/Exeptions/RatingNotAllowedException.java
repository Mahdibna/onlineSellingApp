package com.example.OnlineSellingApplicationBackend.Exeptions;

 public class RatingNotAllowedException extends RuntimeException {
    public RatingNotAllowedException(String message) {
        super(message);
    }
}
