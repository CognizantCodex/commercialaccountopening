package com.example.risk;

import com.example.risk.config.LlmProperties;
import com.example.risk.config.RiskPolicyProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({RiskPolicyProperties.class, LlmProperties.class})
public class RiskAssessmentApplication {

    public static void main(String[] args) {
        SpringApplication.run(RiskAssessmentApplication.class, args);
    }
}
