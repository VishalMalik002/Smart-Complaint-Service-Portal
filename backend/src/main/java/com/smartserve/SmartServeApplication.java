package com.smartserve;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SmartServeApplication {
  public static void main(String[] args) { SpringApplication.run(SmartServeApplication.class, args); }
}
