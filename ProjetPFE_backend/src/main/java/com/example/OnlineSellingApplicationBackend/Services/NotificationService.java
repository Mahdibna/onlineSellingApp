package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.NotificationDTO;
import com.example.OnlineSellingApplicationBackend.Repositories.NotificationRepository;
import com.example.OnlineSellingApplicationBackend.entities.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private FirebaseService firebaseService;

    // Convert Entity to DTO
    private NotificationDTO convertToDTO(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getCreatedAt(),
                notification.getType(),
                notification.isRead(),
                notification.getReferenceId()
        );
    }
    public void notifyRoleChange(String clientId, String newRole) {
        // Create a special notification for role change
        Notification notification = new Notification(
                "Role Updated",
                "Your role has been updated to " + newRole + ". Please log in again.",
                Notification.NotificationType.ROLE_CHANGE, // Add this to your enum
                clientId,
                null
        );
        notificationRepository.save(notification);

        Map<String, Object> roleChangeNotification = new HashMap<>();
        roleChangeNotification.put("type", "ROLE_CHANGE");
        roleChangeNotification.put("newRole", newRole);
        roleChangeNotification.put("message", "Your role has been updated. Please log in again.");
        roleChangeNotification.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSendToUser(
                clientId,
                "/queue/role-change",
                roleChangeNotification
        );
    }
    // Create and send a notification
    public void sendNotification(String title, String message, Notification.NotificationType type,
                                 String recipientId, Long referenceId) {

        Notification notification = new Notification(title, message, type, recipientId, referenceId);
        notification = notificationRepository.save(notification);

        NotificationDTO notificationDTO = convertToDTO(notification);

        messagingTemplate.convertAndSendToUser(
                recipientId,
                "/queue/notifications",
                notificationDTO
        );

        if (type == Notification.NotificationType.NEW_ORDER ||
                type == Notification.NotificationType.NEW_COMPLAINT ||
                type == Notification.NotificationType.PARTNER_APPLICATION) {

            messagingTemplate.convertAndSend("/topic/admin", notificationDTO);
        }

        try {
            if (!recipientId.startsWith("admin")) {
                firebaseService.sendPushNotification(recipientId, title, message, type, referenceId);
            }
        } catch (Exception e) {
            System.err.println("Failed to send push notification: " + e.getMessage());
        }
    }

    public void notifyNewOrder(Long orderId, String clientId) {
        // Notify client
        sendNotification(
                "Order Successful",
                "Your order #" + orderId + " has been received and is being processed.",
                Notification.NotificationType.ORDER_STATUS,
                clientId,
                orderId
        );

        // Notify admin
        sendNotification(
                "New Order",
                "A new order #" + orderId + " has been placed.",
                Notification.NotificationType.NEW_ORDER,
                "admin",
                orderId
        );
    }

    public void notifyOrderStatusChange(Long orderId, String clientId, String newStatus) {
        sendNotification(
                "Order Status Updated",
                "Your order #" + orderId + " status has been updated to: " + newStatus,
                Notification.NotificationType.ORDER_STATUS,
                clientId,
                orderId
        );
    }

    public void notifyNewProduct(Long productId, String productName) {
        List<String> allClientIds = getAllClientIds();

        for (String clientId : allClientIds) {
            sendNotification(
                    "New Product Available",
                    "Check out our new product: " + productName,
                    Notification.NotificationType.NEW_PRODUCT,
                    clientId,
                    productId
            );
        }
    }

    public void notifyComplaintStatusChange(Long complaintId, String clientId, String newStatus) {
        sendNotification(
                "Complaint Status Updated",
                "Your complaint #" + complaintId + " status has been updated to: " + newStatus,
                Notification.NotificationType.COMPLAINT_STATUS,
                clientId,
                complaintId
        );
    }

    // Create a notification for partner application status change
    public void notifyPartnerApplicationStatusChange(Long applicationId, String clientId, String newStatus) {
        sendNotification(
                "Partnership Application Updated",
                "Your partnership application #" + applicationId + " status has been updated to: " + newStatus,
                Notification.NotificationType.PARTNER_APPLICATION,
                clientId,
                applicationId
        );
    }

    public void notifyNewDiscount(Long productId, String productName, double discountPercentage) {
        // Get all client IDs and send to each
        List<String> allClientIds = getAllClientIds();

        for (String clientId : allClientIds) {
            sendNotification(
                    "New Discount Available",
                    productName + " is now " + discountPercentage + "% off! Check it out now!",
                    Notification.NotificationType.DISCOUNT,
                    clientId,
                    productId
            );
        }
    }

    public List<NotificationDTO> getUserNotifications(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndIsRead(userId, false);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(userId, false);
        for (Notification notification : notifications) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(notifications);
    }
    private List<String> getAllClientIds() {
        return List.of("all-clients");
    }
    public void notifyPaymentSuccess(Long orderId, String clientId) {
        System.out.println("Payment succeeded for order " + orderId);
    }
    public void notifyPaymentFailure(Long orderId, String clientId) {
        System.out.println("Payment failed for order " + orderId);
    }
}