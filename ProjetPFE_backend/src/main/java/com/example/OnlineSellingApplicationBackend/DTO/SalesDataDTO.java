package com.example.OnlineSellingApplicationBackend.DTO;

import java.util.Date;

public class SalesDataDTO {
    private String period;
    private double total;

    public SalesDataDTO() {
    }

    public SalesDataDTO(String period, double total) {
        this.period = period;
        this.total = total;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }
}