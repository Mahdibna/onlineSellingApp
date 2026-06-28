package com.example.OnlineSellingApplicationBackend.DTO;

public class UserGrowthDTO {
    private String month;
    private Integer users;

    // Corrected constructor parameter order
    public UserGrowthDTO(String month, Integer users) {
        this.month = month;
        this.users = users;
    }

    // Getters and Setters
    public String getMonth() { return month; }
    public Integer getUsers() { return users; }
    public void setMonth(String month) { this.month = month; }
    public void setUsers(Integer users) { this.users = users; }
}