package com.example.risk.service;

import com.example.risk.config.LlmProperties;
import com.example.risk.model.CommercialCustomerRequest;
import com.example.risk.model.RiskAssessmentResult;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class NarrativeService {

    private final LlmProperties llmProperties;
    private final RestClient restClient;

    public NarrativeService(LlmProperties llmProperties) {
        this.llmProperties = llmProperties;
        this.restClient = RestClient.builder().build();
    }

    public String buildSummary(CommercialCustomerRequest request, RiskAssessmentResult result) {
        if (!llmProperties.isEnabled() || llmProperties.getApiKey() == null || llmProperties.getApiKey().isBlank()) {
            return fallbackSummary(request, result);
        }

        try {
            Map<String, Object> payload = Map.of(
                    "model", llmProperties.getModel(),
                    "temperature", llmProperties.getTemperature(),
                    "messages", List.of(
                            Map.of(
                                    "role", "system",
                                    "content",
                                    "You are a commercial banking AML analyst. Write a concise onboarding summary based only on the provided deterministic assessment. Do not alter the rating, decision, or controls."),
                            Map.of(
                                    "role", "user",
                                    "content", buildPrompt(request, result))));

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(llmProperties.getApiUrl())
                    .header("Authorization", "Bearer " + llmProperties.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            String content = extractContent(response);
            return content == null || content.isBlank() ? fallbackSummary(request, result) : content;
        } catch (RestClientException ex) {
            return fallbackSummary(request, result);
        }
    }

    private String fallbackSummary(CommercialCustomerRequest request, RiskAssessmentResult result) {
        String controls = result.getRequiredControls().isEmpty()
                ? "standard controls"
                : String.join(", ", result.getRequiredControls());
        String drivers = result.getDrivers().isEmpty()
                ? "no material risk drivers"
                : String.join(", ", result.getDrivers());

        return "Application for " + request.getCompanyInfo().getLegalName()
                + " in " + request.getCompanyInfo().getIndustry()
                + " is rated " + result.getRiskRating()
                + " with score " + result.getRiskScore()
                + ". Decision is " + result.getAccountDecision()
                + ". Key drivers: " + drivers
                + ". Required controls: " + controls + ".";
    }

    private String buildPrompt(CommercialCustomerRequest request, RiskAssessmentResult result) {
        return "Brand: " + request.getBrandName() + "\n"
                + "Form title: " + request.getFormTitle() + "\n"
                + "Legal name: " + request.getCompanyInfo().getLegalName() + "\n"
                + "Entity type: " + request.getCompanyInfo().getEntityType() + "\n"
                + "Industry: " + request.getCompanyInfo().getIndustry() + "\n"
                + "Country of incorporation: " + request.getCompanyInfo().getIncorporationCountry() + "\n"
                + "Account purpose: " + request.getBankingProfile().getAccountPurpose() + "\n"
                + "Requested products: " + String.join(", ", request.getBankingProfile().getRequestedProducts()) + "\n"
                + "International activity: " + request.getBankingProfile().getInternationalActivity() + "\n"
                + "Risk score: " + result.getRiskScore() + "\n"
                + "Risk rating: " + result.getRiskRating() + "\n"
                + "Decision: " + result.getAccountDecision() + "\n"
                + "Override reason: " + result.getOverrideReason() + "\n"
                + "Drivers: " + String.join(", ", result.getDrivers()) + "\n"
                + "Required controls: " + String.join(", ", result.getRequiredControls()) + "\n"
                + "Write a short, formal analyst summary for case notes.";
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<String, Object> response) {
        if (response == null) {
            return null;
        }
        Object choicesObject = response.get("choices");
        if (!(choicesObject instanceof List<?> choices) || choices.isEmpty()) {
            return null;
        }
        Object firstChoice = choices.get(0);
        if (!(firstChoice instanceof Map<?, ?> choiceMap)) {
            return null;
        }
        Object messageObject = choiceMap.get("message");
        if (!(messageObject instanceof Map<?, ?> messageMap)) {
            return null;
        }
        Object content = messageMap.get("content");
        return content == null ? null : Objects.toString(content, null);
    }
}
