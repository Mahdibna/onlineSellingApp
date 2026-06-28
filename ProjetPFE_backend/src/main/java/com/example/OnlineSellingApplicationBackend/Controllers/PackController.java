package com.example.OnlineSellingApplicationBackend.Controllers;
import com.example.OnlineSellingApplicationBackend.DTO.PackRequest;
import com.example.OnlineSellingApplicationBackend.Services.PackService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/packs")
@CrossOrigin(origins = "*")
public class PackController {
    private final PackService packService;
    private final ObjectMapper objectMapper;

    @Autowired
    public PackController(PackService packService, ObjectMapper objectMapper) {
        this.packService = packService;
        this.objectMapper = objectMapper;
    }
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllPacks() {
        return ResponseEntity.ok(packService.getAllPacks());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Map<String, Object>>> getAllAvailablePacks() {
        return ResponseEntity.ok(packService.getAllAvailablePacks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPackById(@PathVariable Long id) {
        return ResponseEntity.ok(packService.getPackById(id));
    }

    @GetMapping("/{id}/is-used")
    public ResponseEntity<Map<String, Object>> isPackUsedInOrders(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        response.put("isUsed", packService.isPackUsedInOrders(id));
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPack(
            @RequestParam("pack") String packJson,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos) {
        try {
            PackRequest packRequest = objectMapper.readValue(packJson, PackRequest.class);
            packRequest.setPhotos(photos);
            return ResponseEntity.status(HttpStatus.CREATED).body(packService.createPack(packRequest));
        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePack(
            @PathVariable Long id,
            @RequestParam("pack") String packJson,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos) {
        try {
            PackRequest packRequest = objectMapper.readValue(packJson, PackRequest.class);
            packRequest.setPhotos(photos);
            return ResponseEntity.ok(packService.updatePack(id, packRequest));
        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePack(
            @PathVariable Long id,
            @RequestParam(value = "forceDeactivate", required = false, defaultValue = "false") boolean forceDeactivate) {
        return ResponseEntity.ok(packService.handlePackDeletion(id, forceDeactivate));
    }

    @PatchMapping("/{id}/disponibility")
    public ResponseEntity<Map<String, Object>> toggleDisponibility(
            @PathVariable Long id,
            @RequestParam("disponibility") boolean disponibility) {
        return ResponseEntity.ok(packService.toggleDisponibility(id, disponibility));
    }
}