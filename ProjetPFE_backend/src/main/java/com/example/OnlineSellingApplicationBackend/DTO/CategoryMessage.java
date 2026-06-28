package com.example.OnlineSellingApplicationBackend.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CategoryMessage {
    private Long id;
    private String name;
    private String message;

    // Constructor for added categories (2 args)
    public CategoryMessage(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    // Constructor for skipped categories (3 args)
    public CategoryMessage(Long id, String name, String message) {
        this.id = id;
        this.name = name;
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}