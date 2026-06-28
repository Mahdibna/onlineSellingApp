package com.example.OnlineSellingApplicationBackend.entities;

public enum EtatCommande {
    PayeEtEnCoursDeTraitement,
    EnCoursDeTraitement,
    EnTransit,
    EnCoursDeLivraison,
    Livree,
    LivreeEtPaye,
    Annulee,
    EnRetour
}
