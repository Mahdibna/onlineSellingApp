package com.example.OnlineSellingApplicationBackend.Controllers;

import com.example.OnlineSellingApplicationBackend.DTO.CategorySalesDTO;
import com.example.OnlineSellingApplicationBackend.DTO.DailySalesDTO;
import com.example.OnlineSellingApplicationBackend.DTO.SalesDataDTO;
import com.example.OnlineSellingApplicationBackend.Services.CommandeService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private final CommandeService commandeService;

    public SalesController(CommandeService commandeService) {
        this.commandeService = commandeService;
    }

    @GetMapping
    public ResponseEntity<List<SalesDataDTO>> getSalesData(
            @RequestParam String range,
            @RequestParam(required = false, defaultValue = "Europe/Paris") String timezone) {
        return ResponseEntity.ok(commandeService.getSalesData(range, timezone));
    }

    @GetMapping("/daily")
    public ResponseEntity<List<DailySalesDTO>> getDailySales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(commandeService.getDailySales(startDate, endDate));
    }
    @GetMapping("/categories")
    public ResponseEntity<List<CategorySalesDTO>> getSalesByCategory() {
        return ResponseEntity.ok(commandeService.getSalesByCategory());
    }
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getSalesMetrics() {
        return ResponseEntity.ok(commandeService.getSalesMetrics());
    }
}