package com.example.OnlineSellingApplicationBackend.model;

import lombok.Data;

@Data
public class DocumentData {
    private String sujet;
    private Contenu contenu;

    @Data
    public static class Contenu {
        private String question;
        private String reponse;
    }
}