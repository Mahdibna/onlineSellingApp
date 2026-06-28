package com.example.OnlineSellingApplicationBackend.DTO;

import lombok.Data;

@Data
public class RatingUpdateRequest {
    private int rating;
    private String comment; // Note this field name matches frontend

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}