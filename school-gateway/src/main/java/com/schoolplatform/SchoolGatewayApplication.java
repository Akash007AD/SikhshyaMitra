package com.schoolplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // Required for Bloom filter rebuild in TenantResolutionFilter
public class SchoolGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(SchoolGatewayApplication.class, args);
	}

}
