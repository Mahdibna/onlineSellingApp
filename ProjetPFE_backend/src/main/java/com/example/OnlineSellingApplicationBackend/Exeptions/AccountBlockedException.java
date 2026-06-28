package com.example.OnlineSellingApplicationBackend.Exeptions;

import java.util.Map;

public class AccountBlockedException extends RuntimeException {
    private Map<String, String> data;

    public AccountBlockedException(String message, Map<String, String> data) {
        super(message);
        this.data = data;
    }

    public Map<String, String> getData() {
        return data;
    }
}