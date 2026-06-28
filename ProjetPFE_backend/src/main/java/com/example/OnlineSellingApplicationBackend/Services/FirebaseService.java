package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Notification;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class FirebaseService {

    @Autowired
    private ClientRepository clientRepository;

    @PostConstruct
    public void initialize() {
        try {

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(
                            new ClassPathResource("onlinesellingapplication.json").getInputStream()))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("Failed to initialize Firebase: " + e.getMessage());
        }
    }

    public void sendPushNotification(String clientId, String title, String body,
                                     Notification.NotificationType type, Long referenceId) {
        try {
            String fcmToken = getFcmToken(clientId);

            if (fcmToken == null || fcmToken.isEmpty()) {
                System.out.println("No FCM token available for client: " + clientId);
                return;
            }

            Message message = createMessage(fcmToken, title, body, type, referenceId);

            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Successfully sent notification: " + response);

        } catch (FirebaseMessagingException e) {
            System.err.println("Failed to send push notification: " + e.getMessage());
        }
    }

    private String getFcmToken(String clientId) {
        try {
            Long id = Long.parseLong(clientId);
            Optional<Client> clientOpt = clientRepository.findById(id);

            if (clientOpt.isPresent()) {
                Client client = clientOpt.get();
                return client.getFcmToken();
            }
        } catch (NumberFormatException e) {
            System.err.println("Invalid client ID format: " + clientId);
        }

        return null;
    }

    private Message createMessage(String token, String title, String body,
                                  Notification.NotificationType type, Long referenceId) {

        com.google.firebase.messaging.Notification notification =
                com.google.firebase.messaging.Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build();

        Map<String, String> data = new HashMap<>();
        data.put("type", type.toString());
        if (referenceId != null) {
            data.put("referenceId", referenceId.toString());
        }

        return Message.builder()
                .setToken(token)
                .setNotification(notification)
                .putAllData(data)
                .setAndroidConfig(AndroidConfig.builder()
                        .setNotification(AndroidNotification.builder()
                                .setClickAction("OPEN_ACTIVITY_1")
                                .build())
                        .build())
                .setApnsConfig(ApnsConfig.builder()
                        .setAps(Aps.builder()
                                .setCategory("NOTIFICATION")
                                .setSound("default")
                                .build())
                        .build())
                .build();
    }
}