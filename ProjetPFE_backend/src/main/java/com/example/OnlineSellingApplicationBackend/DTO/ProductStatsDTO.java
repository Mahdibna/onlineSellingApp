package com.example.OnlineSellingApplicationBackend.DTO;

public class ProductStatsDTO {
    private long totalProducts;
    private long topSellingCount;
    private long lowStockCount;
    private double totalRevenue;

    // Constructeur par défaut
    public ProductStatsDTO() {}

    // Constructeur avec paramètres
    public ProductStatsDTO(long totalProducts, long topSellingCount, long lowStockCount, double totalRevenue) {
        this.totalProducts = totalProducts;
        this.topSellingCount = topSellingCount;
        this.lowStockCount = lowStockCount;
        this.totalRevenue = totalRevenue;
    }

    // Getters et setters
    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTopSellingCount() {
        return topSellingCount;
    }

    public void setTopSellingCount(long topSellingCount) {
        this.topSellingCount = topSellingCount;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }


}
