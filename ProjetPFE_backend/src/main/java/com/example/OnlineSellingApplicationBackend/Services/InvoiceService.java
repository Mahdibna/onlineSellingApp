package com.example.OnlineSellingApplicationBackend.Services;

import com.example.OnlineSellingApplicationBackend.DTO.CommandeDetailDTO;
import com.example.OnlineSellingApplicationBackend.entities.*;
import com.example.OnlineSellingApplicationBackend.Repositories.CommandeRepository;
import com.example.OnlineSellingApplicationBackend.Repositories.PaiementRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private CommandeService commandeService;

    @Autowired
    private PaiementRepository paiementRepository;

    /**
     * Generate a PDF invoice for any order type (online or delivery payment)
     */
    public byte[] generateInvoicePdf(Long orderId) {
        try {
            // Fetch order details
            CommandeDetailDTO orderDetails = commandeService.getOrderDetails(orderId);
            Commande commande = commandeRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Check if payment exists - for both online and delivery payment types
            Optional<Paiement> paiementOpt = Optional.empty();
            if (commande.getPaiement() != null) {
                paiementOpt = paiementRepository.findById(commande.getPaiement().getIdPaiement());
            }

            // Create PDF document
            Document document = new Document(PageSize.A4);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, baos);

            // Open document
            document.open();

            // Add header
            addHeader(document, orderDetails);

            // Add company and client info
            addCompanyAndClientInfo(document, orderDetails);

            // Add order details
            addOrderDetails(document, orderDetails);

            // Add items table with unit price and total price after reduction
            addEnhancedItemsTable(document, orderDetails, commande);

            // Add payment details - handle both payment types
            addPaymentDetails(document, orderDetails, paiementOpt.orElse(null));

            // Add footer
            addFooter(document);

            // Close document
            document.close();

            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating invoice PDF: " + e.getMessage(), e);
        }
    }

    private void addHeader(Document document, CommandeDetailDTO orderDetails) throws DocumentException {
        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
        Font subtitleFont = new Font(Font.HELVETICA, 14, Font.NORMAL);

        Paragraph title = new Paragraph("INVOICE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Paragraph subtitle = new Paragraph("Invoice #" + orderDetails.getOrderId(), subtitleFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        document.add(subtitle);

        // Add date
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy");
        String formattedDate = dateFormat.format(orderDetails.getOrderDate());
        Paragraph datePara = new Paragraph("Date: " + formattedDate);
        datePara.setAlignment(Element.ALIGN_RIGHT);
        document.add(datePara);

        document.add(Chunk.NEWLINE);
    }

    private void addCompanyAndClientInfo(Document document, CommandeDetailDTO orderDetails) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);

        // Company info
        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        Paragraph companyPara = new Paragraph("From:");
        companyPara.add(new Paragraph("Your Company Name"));
        companyPara.add(new Paragraph("123 Business Street"));
        companyPara.add(new Paragraph("Business City, 12345"));
        companyPara.add(new Paragraph("Email: contact@yourcompany.com"));
        companyCell.addElement(companyPara);
        table.addCell(companyCell);

        // Client info
        PdfPCell clientCell = new PdfPCell();
        clientCell.setBorder(Rectangle.NO_BORDER);
        Paragraph clientPara = new Paragraph("Bill To:");
        clientPara.add(new Paragraph(orderDetails.getClient().getName()));
        clientPara.add(new Paragraph("Email: " + orderDetails.getClient().getEmail()));
        clientPara.add(new Paragraph("Tel: " + orderDetails.getClient().getTel()));

        // Add delivery address
        if (orderDetails.getDeliveryAddress() != null) {
            String address = orderDetails.getDeliveryAddress().getStreet() + ", " +
                    orderDetails.getDeliveryAddress().getNumber() + ", " +
                    orderDetails.getDeliveryAddress().getCity() + ", " +
                    orderDetails.getDeliveryAddress().getCountry();
            clientPara.add(new Paragraph("Delivery Address: " + address));
        }

        clientCell.addElement(clientPara);
        table.addCell(clientCell);

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addOrderDetails(Document document, CommandeDetailDTO orderDetails) throws DocumentException {
        Font headingFont = new Font(Font.HELVETICA, 12, Font.BOLD);

        Paragraph orderInfo = new Paragraph("Order Information", headingFont);
        document.add(orderInfo);
        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);

        table.addCell(createLabelCell("Order ID:"));
        table.addCell(createValueCell(orderDetails.getOrderId().toString()));

        table.addCell(createLabelCell("Order Type:"));
        table.addCell(createValueCell(orderDetails.getOrderType()));

        table.addCell(createLabelCell("Order Date:"));
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
        table.addCell(createValueCell(dateFormat.format(orderDetails.getOrderDate())));

        table.addCell(createLabelCell("Payment Type:"));
        String paymentTypeStr = orderDetails.getPaymentType().toString();
        String displayPaymentType = "EnLigne".equals(paymentTypeStr) ? "Online Payment" : "Cash on Delivery";
        table.addCell(createValueCell(displayPaymentType));

        table.addCell(createLabelCell("Status:"));
        table.addCell(createValueCell(getHumanReadableStatus(orderDetails.getStatus())));

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    /**
     * Convert technical status to human-readable format
     */
    private String getHumanReadableStatus(String status) {
        if (status == null) return "N/A";

        switch (status) {
            case "PayeEtEnCoursDeTraitement": return "Paid & Processing";
            case "EnCoursDeTraitement": return "Processing";
            case "EnTransit": return "In Transit";
            case "EnCoursDeLivraison": return "Out for Delivery";
            case "Livree": return "Delivered";
            case "LivreeEtPaye": return "Delivered & Paid";
            case "Annulee": return "Cancelled";
            case "EnRetour": return "Returned";
            default: return status;
        }
    }

    private PdfPCell createLabelCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 10, Font.BOLD)));
        cell.setBackgroundColor(new Color(240, 240, 240));
        return cell;
    }

    private PdfPCell createValueCell(String text) {
        return new PdfPCell(new Phrase(text != null ? text : ""));
    }

    /**
     * Enhanced items table that shows unit price and total price after reduction
     */
    private void addEnhancedItemsTable(Document document, CommandeDetailDTO orderDetails, Commande commande) throws DocumentException {
        Font headingFont = new Font(Font.HELVETICA, 12, Font.BOLD);

        Paragraph itemsHeading = new Paragraph("Order Items", headingFont);
        document.add(itemsHeading);
        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(5); // Added columns for unit price and total
        table.setWidthPercentage(100);
        table.setWidths(new float[]{5, 1, 1, 1.5f, 1.5f}); // Adjusted column widths

        // Add header row
        Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);

        PdfPCell headerCell1 = new PdfPCell(new Phrase("Item", headerFont));
        headerCell1.setBackgroundColor(new Color(0, 51, 102));
        headerCell1.setPadding(5);
        table.addCell(headerCell1);

        PdfPCell headerCell2 = new PdfPCell(new Phrase("Type", headerFont));
        headerCell2.setBackgroundColor(new Color(0, 51, 102));
        headerCell2.setPadding(5);
        table.addCell(headerCell2);

        PdfPCell headerCell3 = new PdfPCell(new Phrase("Qty", headerFont));
        headerCell3.setBackgroundColor(new Color(0, 51, 102));
        headerCell3.setPadding(5);
        table.addCell(headerCell3);

        PdfPCell headerCell4 = new PdfPCell(new Phrase("Unit Price", headerFont));
        headerCell4.setBackgroundColor(new Color(0, 51, 102));
        headerCell4.setPadding(5);
        table.addCell(headerCell4);

        PdfPCell headerCell5 = new PdfPCell(new Phrase("Total Price", headerFont));
        headerCell5.setBackgroundColor(new Color(0, 51, 102));
        headerCell5.setPadding(5);
        table.addCell(headerCell5);

        // Add item rows - with unit and total prices
        if (orderDetails.getItems() != null) {
            for (CommandeDetailDTO.OrderItemDTO item : orderDetails.getItems()) {
                PdfPCell nameCell = new PdfPCell(new Phrase(item.getName()));
                table.addCell(nameCell);

                PdfPCell typeCell = new PdfPCell(new Phrase(item.getItemType()));
                table.addCell(typeCell);

                PdfPCell qtyCell = new PdfPCell(new Phrase(String.valueOf(item.getQuantity())));
                qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(qtyCell);

                // Handle unit and total prices differently for products and packs
                double unitPrice = 0.0;
                double totalPrice = 0.0;

                if ("product".equals(item.getItemType())) {
                    // Look up the product in the order's ligne commande to get the actual price
                    if (commande.getLigneCommandes() != null) {
                        for (LigneCommande lc : commande.getLigneCommandes()) {
                            if (lc.getProduit().getNom().equals(item.getName())) {
                                // Get price after any reductions
                                unitPrice = getPriceAfterReduction(lc.getProduit(), commande.getClient());
                                totalPrice = unitPrice * item.getQuantity();
                                break;
                            }
                        }
                    }
                } else if ("pack".equals(item.getItemType())) {
                    // For packs, look up in ligne command pack
                    if (commande.getLigneCommandePack() != null) {
                        for (LigneCommandPack lcp : commande.getLigneCommandePack()) {
                            if (lcp.getPaquet().getNom().equals(item.getName())) {
                                unitPrice = lcp.getPaquet().getPrix();
                                totalPrice = unitPrice * item.getQuantity();
                                break;
                            }
                        }
                    }
                }

                // Unit price cell
                PdfPCell unitPriceCell = new PdfPCell(new Phrase(String.format("%.2f TND", unitPrice)));
                unitPriceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(unitPriceCell);

                // Total price cell
                PdfPCell totalPriceCell = new PdfPCell(new Phrase(String.format("%.2f TND", totalPrice)));
                totalPriceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(totalPriceCell);
            }
        }

        document.add(table);
        document.add(Chunk.NEWLINE);

        // Add a subtotal, shipping, and grand total table
        addTotalSummary(document, orderDetails);
    }

    /**
     * Calculate price after applying any relevant reductions based on client type
     */
    private double getPriceAfterReduction(Produits produit, Client client) {
        if (produit == null || client == null) return 0.0;

        double basePrice = produit.getPrix();
        double reductionPercent = 0.0;

        // Apply different promotions based on client type
        if (client.getType() == TypeClient.Partner && produit.getPromotionPartenaire() > 0) {
            reductionPercent = produit.getPromotionPartenaire();
        } else if (client.getType() == TypeClient.Individual && produit.getPromotionParticulier() > 0) {
            reductionPercent = produit.getPromotionParticulier();
        }

        // Apply the reduction
        return basePrice * (1.0 - reductionPercent);
    }

    /**
     * Add subtotal, shipping fee and grand total section
     */
    private void addTotalSummary(Document document, CommandeDetailDTO orderDetails) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(50);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.setSpacingBefore(10);

        // Assuming shipping fee is $30 (you may need to adjust this or fetch from order)
        double shippingFee = 30.0;
        double subtotal = orderDetails.getTotal() - shippingFee;

        // Subtotal row
        PdfPCell subtotalLabelCell = new PdfPCell(new Phrase("Subtotal:"));
        subtotalLabelCell.setBorder(Rectangle.NO_BORDER);
        subtotalLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(subtotalLabelCell);

        PdfPCell subtotalValueCell = new PdfPCell(new Phrase(String.format("%.2f TND", subtotal)));
        subtotalValueCell.setBorder(Rectangle.NO_BORDER);
        subtotalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(subtotalValueCell);

        // Shipping row
        PdfPCell shippingLabelCell = new PdfPCell(new Phrase("Shipping:"));
        shippingLabelCell.setBorder(Rectangle.NO_BORDER);
        shippingLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(shippingLabelCell);

        PdfPCell shippingValueCell = new PdfPCell(new Phrase(String.format("%.2f TND", shippingFee)));
        shippingValueCell.setBorder(Rectangle.NO_BORDER);
        shippingValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(shippingValueCell);

        // Separator line
        PdfPCell separatorCell = new PdfPCell(new Phrase(""));
        separatorCell.setColspan(2);
        separatorCell.setPaddingTop(5);
        separatorCell.setPaddingBottom(5);
        separatorCell.setBorderWidthBottom(1);
        separatorCell.setBorderWidthTop(0);
        separatorCell.setBorderWidthLeft(0);
        separatorCell.setBorderWidthRight(0);
        table.addCell(separatorCell);

        // Total row
        Font totalFont = new Font(Font.HELVETICA, 12, Font.BOLD);

        PdfPCell totalLabelCell = new PdfPCell(new Phrase("Total:", totalFont));
        totalLabelCell.setBorder(Rectangle.NO_BORDER);
        totalLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(totalLabelCell);

        PdfPCell totalValueCell = new PdfPCell(new Phrase(String.format("%.2f TND", orderDetails.getTotal()), totalFont));
        totalValueCell.setBorder(Rectangle.NO_BORDER);
        totalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(totalValueCell);

        document.add(table);
    }

    private void addPaymentDetails(Document document, CommandeDetailDTO orderDetails, Paiement paiement) throws DocumentException {
        Font headingFont = new Font(Font.HELVETICA, 12, Font.BOLD);

        Paragraph paymentHeading = new Paragraph("Payment Details", headingFont);
        document.add(paymentHeading);
        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);

        // Add payment type info
        table.addCell(createLabelCell("Payment Type:"));
        String paymentType = orderDetails.getPaymentType().toString();
        boolean isOnlinePayment = "EnLigne".equals(paymentType);
        table.addCell(createValueCell(isOnlinePayment ? "Online Payment" : "Cash on Delivery"));

        // For online payments, show payment details if available
        if (isOnlinePayment && paiement != null) {
            table.addCell(createLabelCell("Payment ID:"));
            table.addCell(createValueCell(paiement.getIdPaiement().toString()));

            table.addCell(createLabelCell("Payment Date:"));
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
            table.addCell(createValueCell(dateFormat.format(paiement.getDatePaiement())));

            table.addCell(createLabelCell("Payment Method:"));
            table.addCell(createValueCell(paiement.getModePaiement()));

            table.addCell(createLabelCell("Transaction Reference:"));
            table.addCell(createValueCell(paiement.getTransactionReference()));

            if (paiement.getCardNumberLast4() != null && !paiement.getCardNumberLast4().isEmpty()) {
                table.addCell(createLabelCell("Card Number:"));
                table.addCell(createValueCell("**** **** **** " + paiement.getCardNumberLast4()));
            }

            table.addCell(createLabelCell("Payment Status:"));
            table.addCell(createValueCell(paiement.isStatut() ? "Paid" : "Pending"));
        } else if (!isOnlinePayment) {
            // For cash on delivery orders
            table.addCell(createLabelCell("Payment Status:"));
            String paymentStatus = "Pending Payment on Delivery";
            if ("LivreeEtPaye".equals(orderDetails.getStatus())) {
                paymentStatus = "Paid on Delivery";
            }
            table.addCell(createValueCell(paymentStatus));
        }

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addFooter(Document document) throws DocumentException {
        Paragraph footer = new Paragraph("Thank you for your business!", new Font(Font.HELVETICA, 10, Font.ITALIC));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        Paragraph terms = new Paragraph("Terms and Conditions Apply", new Font(Font.HELVETICA, 8, Font.NORMAL));
        terms.setAlignment(Element.ALIGN_CENTER);
        document.add(terms);
    }
}