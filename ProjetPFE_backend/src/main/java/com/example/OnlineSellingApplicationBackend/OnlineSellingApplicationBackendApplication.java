package com.example.OnlineSellingApplicationBackend;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
@SpringBootApplication
@EnableScheduling  // Enable scheduled tasks like cart cleanup
public class OnlineSellingApplicationBackendApplication {
	public static void main(String[] args) {
		SpringApplication.run(OnlineSellingApplicationBackendApplication.class, args);
	}
}