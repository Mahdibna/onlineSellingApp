package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.TypePaiment;

import java.util.Date;

public class ClientOrderDTO {
    private Long orderId;
    private String orderType;
    private Double total;
    private String status;
    private Date orderDate;
    private String deliveryStatus; // Only for ongoing orders
    private String formattedDate; // For better display in frontend
    private TypePaiment paymentType;


    public void setFormattedDate(String formattedDate) {
        this.formattedDate = formattedDate;
    }

    public TypePaiment getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(TypePaiment paymentType) {
        this.paymentType = paymentType;
    }

    // Getters and Setters
    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
        this.formattedDate = formatDate(orderDate);
    }

    public String getDeliveryStatus() {
        return deliveryStatus;
    }

    public void setDeliveryStatus(String deliveryStatus) {
        this.deliveryStatus = deliveryStatus;
    }

    public String getFormattedDate() {
        return formattedDate;
    }

    private String formatDate(Date date) {
        // Implement your date formatting logic here
        // Example: SimpleDateFormat or DateTimeFormatter
        return "Jun 15, 2023"; // Example formatted date
    }
}