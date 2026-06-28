package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.Notification.NotificationType;

import java.util.Date;

public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private Date createdAt;
    private NotificationType type;
    private boolean isRead;
    private Long referenceId;

    // Constructors
    public NotificationDTO() {
    }

    public NotificationDTO(Long id, String title, String message, Date createdAt,
                           NotificationType type, boolean isRead, Long referenceId) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.createdAt = createdAt;
        this.type = type;
        this.isRead = isRead;
        this.referenceId = referenceId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean isRead) {
        this.isRead = isRead;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }
}