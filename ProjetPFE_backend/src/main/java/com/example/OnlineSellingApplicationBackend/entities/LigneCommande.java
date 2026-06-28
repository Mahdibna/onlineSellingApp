    package com.example.OnlineSellingApplicationBackend.entities;
    import jakarta.persistence.Entity;
    import jakarta.persistence.Id;
    import jakarta.persistence.IdClass;
    import jakarta.persistence.ManyToOne;
    import lombok.EqualsAndHashCode;

    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.NoArgsConstructor;
    @AllArgsConstructor
    @NoArgsConstructor
    @Data
    @Entity
    @EqualsAndHashCode(onlyExplicitlyIncluded = true)
    @IdClass(CleLCommande.class)
    public class LigneCommande {
        private int quantite;
        @Id
        @ManyToOne
        private Commande commande;
        @Id
        @ManyToOne
        private Produits produit;

        public int getQuantite() {
            return quantite;
        }
    
        public Produits getProduit() {
            return produit;
        }
    
        public Commande getCommande() {
            return commande;
        }
    
        public void setCommande(Commande commande) {
            this.commande = commande;
        }
    
        public void setProduit(Produits produit) {
            this.produit = produit;
        }
    
        public void setQuantite(int quantite) {
            this.quantite = quantite;
        }
    }
