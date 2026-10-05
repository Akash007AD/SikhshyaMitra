package com.schoolplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // Required for JwtService's nightly refresh token cleanup
public class SchoolAuthApplication {

	public static void main(String[] args) {
		SpringApplication.run(SchoolAuthApplication.class, args);
	}

}
