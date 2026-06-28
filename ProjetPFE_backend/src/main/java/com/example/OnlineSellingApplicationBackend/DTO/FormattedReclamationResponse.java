package com.example.OnlineSellingApplicationBackend.DTO;

public class FormattedReclamationResponse {
    private String clientName;
    private String title;
    private String description;
    private String dateReclamation;
    private Long commandeId;
    private Long idReclamation;
    private String type;
    private String status;
    private String tel;
    private String email;
    public FormattedReclamationResponse(String clientName, String title, String description,
                                        String dateReclamation, Long commandeId, Long idReclamation,
                                        String type, String status, String tel, String email) {
        this.clientName = clientName;
        this.title = title;
        this.description = description;
        this.dateReclamation = dateReclamation; // Now using the parameter
        this.commandeId = commandeId;
        this.idReclamation = idReclamation;
        this.type = type;
        this.status = status;
        this.tel = tel;
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
// Getters and Setters

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDateReclamation() {
        return dateReclamation;
    }

    public void setDateReclamation(String dateReclamation) {
        this.dateReclamation = dateReclamation;
    }

    public Long getCommandeId() {
        return commandeId;
    }

    public void setCommandeId(Long commandeId) {
        this.commandeId = commandeId;
    }
    public Long getIdReclamation() {
        return idReclamation;
    }

    public void setIdReclamation(Long idReclamation) { // Fix parameter name
        this.idReclamation = idReclamation;
    }
}