// Create this file: com/example/OnlineSellingApplicationBackend/Services/PartnerApplicationService.java
package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.PartnerApplicationDTO;
import com.example.OnlineSellingApplicationBackend.Repositories.ClientRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.PartnerApplicationRepository;
import com.example.OnlineSellingApplicationBackend.entities.Client;
import com.example.OnlineSellingApplicationBackend.entities.Notification;
import com.example.OnlineSellingApplicationBackend.entities.PartnerApplication;
import com.example.OnlineSellingApplicationBackend.entities.TypeClient;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PartnerApplicationService {

    @Autowired
    private PartnerApplicationRepository partnerApplicationRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private NotificationService notificationService;
    @Transactional
    public PartnerApplication createApplication(
            String clientEmail,
            String businessName,
            String businessAddress,
            String businessDescription,
            String contactPerson,
            String contactPhone,
            String documentPath) {

        Client client = clientRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        List<PartnerApplication> existingApplications = partnerApplicationRepository.findByClientId(client.getId());

        if (!existingApplications.isEmpty()) {
            PartnerApplication latestApplication = existingApplications.stream()
                    .max((a1, a2) -> a1.getSubmissionDate().compareTo(a2.getSubmissionDate()))
                    .orElse(null);

            if (latestApplication != null) {
                if (latestApplication.getStatus() == PartnerApplication.ApplicationStatus.PENDING) {
                    throw new RuntimeException("You have already submitted a request, and it is currently being processed. Thank you for your patience!");
                } else if (latestApplication.getStatus() == PartnerApplication.ApplicationStatus.REJECTED) {
                    throw new RuntimeException("Your request has been declined. If you believe this is a mistake or would like more information, please feel free to contact our support team.");
                }
            }
        }

        PartnerApplication application = new PartnerApplication();
        application.setClient(client);
        application.setBusinessName(businessName);
        application.setBusinessAddress(businessAddress);
        application.setBusinessDescription(businessDescription);
        application.setContactPerson(client.getNom());
        application.setContactPhone(client.getTel());
        application.setDocumentPath(documentPath);
        PartnerApplication result = partnerApplicationRepository.save(application);
        notificationService.sendNotification(
                "New Partner Application",
                "A new partner application has been submitted by " + client.getNom(),
                Notification.NotificationType.PARTNER_APPLICATION,
                "admin",
                application.getId()
        );
        return result;
    }

    public List<PartnerApplicationDTO> getPendingApplications() {
        return partnerApplicationRepository.findByStatus(PartnerApplication.ApplicationStatus.PENDING)
                .stream()
                .map(app -> new PartnerApplicationDTO(
                        app.getId(),
                        app.getBusinessName(),
                        app.getBusinessAddress(),
                        app.getClient().getNom(),
                        app.getClient().getEmail(),
                        app.getContactPerson(),
                        app.getContactPhone(),
                        app.getSubmissionDate()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public Client approveApplication(Long applicationId) {
        PartnerApplication application = partnerApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        application.setStatus(PartnerApplication.ApplicationStatus.APPROVED);
        application.setReviewDate(LocalDateTime.now());
        partnerApplicationRepository.save(application);

        Client client = application.getClient();
        client.setType(TypeClient.Partner);
        Client result = clientRepository.save(client);

        notificationService.notifyPartnerApplicationStatusChange(
                applicationId,
                client.getId().toString(),
                "APPROVED"
        );

        notificationService.notifyRoleChange(
                client.getId().toString(),
                "Partner"
        );

        return result;
    }
    @Transactional
    public PartnerApplication rejectApplication(Long applicationId, String rejectionReason) {
        PartnerApplication application = partnerApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        application.setStatus(PartnerApplication.ApplicationStatus.REJECTED);
        application.setRejectionReason(rejectionReason);
        application.setReviewDate(LocalDateTime.now());
        PartnerApplication result = partnerApplicationRepository.save(application);
        notificationService.notifyPartnerApplicationStatusChange(
                applicationId,
                application.getClient().getId().toString(),
                "REJECTED"
        );
        return result;
    }
    public PartnerApplication.ApplicationStatus getClientApplicationStatus(Long clientId) {
        List<PartnerApplication> applications = partnerApplicationRepository.findByClientId(clientId);
        if (applications.isEmpty()) {
            return null;
        }

        return applications.stream()
                .max((a1, a2) -> a1.getSubmissionDate().compareTo(a2.getSubmissionDate()))
                .map(PartnerApplication::getStatus)
                .orElse(null);
    }
}