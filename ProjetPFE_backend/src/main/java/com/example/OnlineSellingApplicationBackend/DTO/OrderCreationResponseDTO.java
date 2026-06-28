package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.Commande;
import com.example.OnlineSellingApplicationBackend.entities.EtatCommande;
import com.example.OnlineSellingApplicationBackend.entities.TypePaiment;

import java.util.Date;

public class OrderCreationResponseDTO {
    private Long orderId;
    private Double total;
    private Date orderDate;
    private EtatCommande status;
    private TypePaiment paymentType;
    private PaymentResponse payment;

    // Default constructor
    public OrderCreationResponseDTO() {
    }

    // Constructor from Commande and PaymentResponse
    public OrderCreationResponseDTO(Commande commande, PaymentResponse payment) {
        this.orderId = commande.getIdCommande();
        this.total = commande.getTotal();
        this.orderDate = commande.getDateCommande();
        this.status = commande.getEtat();
        this.paymentType = commande.getType_paiment();
        this.payment = payment;
    }

    // Getters and setters
    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
    }

    public EtatCommande getStatus() {
        return status;
    }

    public void setStatus(EtatCommande status) {
        this.status = status;
    }

    public TypePaiment getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(TypePaiment paymentType) {
        this.paymentType = paymentType;
    }

    public PaymentResponse getPayment() {
        return payment;
    }

    public void setPayment(PaymentResponse payment) {
        this.payment = payment;
    }
}