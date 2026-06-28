package com.example.OnlineSellingApplicationBackend.DTO;


import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public class PartnerApplicationDTO {
    private Long id;
    private String businessName;
    private String businessAddress;
    private String clientName;
    private String clientEmail;
    private String contactPerson;
    private String contactPhone;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submissionDate;

    // Constructors
    public PartnerApplicationDTO() {}

    public PartnerApplicationDTO(Long id, String businessName, String businessAddress, String clientName,
                                 String clientEmail, String contactPerson, String contactPhone,
                                 LocalDateTime submissionDate) {
        this.id = id;
        this.businessName = businessName;
        this.businessAddress = businessAddress;
        this.clientName = clientName;
        this.clientEmail = clientEmail;
        this.contactPerson = contactPerson;
        this.contactPhone = contactPhone;
        this.submissionDate = submissionDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getBusinessAddress() {
        return businessAddress;
    }

    public void setBusinessAddress(String businessAddress) {
        this.businessAddress = businessAddress;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getClientEmail() {
        return clientEmail;
    }

    public void setClientEmail(String clientEmail) {
        this.clientEmail = clientEmail;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public LocalDateTime getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(LocalDateTime submissionDate) {
        this.submissionDate = submissionDate;
    }
}
