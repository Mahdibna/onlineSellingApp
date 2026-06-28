package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.TypePaiment;

import java.util.Date;
import java.util.List;

public class OrderHistoryDTO {
    private Long orderId;
    private Date orderDate;
    private String orderState;
    private TypePaiment paymentType;
    private List<LigneCommandeDTO> ligneCommandes;
    private double total;

    public static class LigneCommandeDTO {
        private Long productId;
        private String productName;
        private int quantity;
        private double originalPrice;
        private double appliedPrice;

        // Getters and setters
        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        public double getOriginalPrice() {
            return originalPrice;
        }

        public void setOriginalPrice(double originalPrice) {
            this.originalPrice = originalPrice;
        }

        public double getAppliedPrice() {
            return appliedPrice;
        }

        public void setAppliedPrice(double appliedPrice) {
            this.appliedPrice = appliedPrice;
        }
    }

    // Getters and setters
    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
    }

    public String getOrderState() {
        return orderState;
    }

    public void setOrderState(String orderState) {
        this.orderState = orderState;
    }

    public TypePaiment getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(TypePaiment paymentType) {
        this.paymentType = paymentType;
    }

    public List<LigneCommandeDTO> getLigneCommandes() {
        return ligneCommandes;
    }

    public void setLigneCommandes(List<LigneCommandeDTO> ligneCommandes) {
        this.ligneCommandes = ligneCommandes;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }
}