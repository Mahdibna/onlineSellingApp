package com.example.OnlineSellingApplicationBackend.DTO;

import java.time.LocalDate;

public class DailyOrdersDTO {
    private String date;      // Use String to control exact format
    private int orderCount;   // Match the frontend property name

    public DailyOrdersDTO(String date, int orderCount) {
        this.date = date;
        this.orderCount = orderCount;
    }

    // Getters
    public String getDate() {
        return date;
    }

    public int getOrderCount() {
        return orderCount;
    }
}