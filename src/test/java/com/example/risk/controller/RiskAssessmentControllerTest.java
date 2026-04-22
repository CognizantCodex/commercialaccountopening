package com.example.risk.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class RiskAssessmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldAssessUpdatedCommercialApplicationPayload() throws Exception {
        String payload = """
                {
                  "brandName": "Harbor Commercial",
                  "formTitle": "Corporate Account Opening Application",
                  "companyInfo": {
                    "legalName": "Atlas Meridian Holdings, Inc.",
                    "tradingName": "Atlas Meridian",
                    "entityType": "Corporation",
                    "registrationNumber": "C4839201",
                    "taxId": "12-3456789",
                    "incorporationDate": "2017-05-18",
                    "incorporationState": "Delaware",
                    "incorporationCountry": "United States",
                    "industry": "Technology services",
                    "website": "https://atlasmeridian.com",
                    "annualRevenue": "25000000",
                    "employeeCount": "120"
                  },
                  "primaryContact": {
                    "fullName": "Morgan Chen",
                    "title": "Chief Financial Officer",
                    "email": "morgan.chen@atlasmeridian.com",
                    "phone": "4155550199",
                    "extension": "204"
                  },
                  "addresses": {
                    "registeredLine1": "100 Market Street",
                    "registeredLine2": "Suite 1200",
                    "city": "San Francisco",
                    "state": "California",
                    "postalCode": "94105",
                    "country": "United States",
                    "operatingSameAsRegistered": true,
                    "operatingLine1": "",
                    "operatingLine2": "",
                    "operatingCity": "",
                    "operatingState": "",
                    "operatingPostalCode": "",
                    "operatingCountry": "United States"
                  },
                  "bankingProfile": {
                    "accountPurpose": "Operating account for client receipts and treasury disbursements",
                    "requestedProducts": [
                      "Operating account",
                      "ACH origination"
                    ],
                    "expectedOpeningDeposit": "250000",
                    "monthlyIncoming": "900000",
                    "monthlyOutgoing": "720000",
                    "onlineBankingUsers": "2",
                    "internationalActivity": false,
                    "jurisdictionsInScope": "",
                    "needsCommercialCards": false
                  },
                  "beneficialOwners": [
                    {
                      "id": "owner-1",
                      "fullName": "Morgan Chen",
                      "title": "Chief Financial Officer",
                      "ownershipPercentage": "35",
                      "email": "morgan.chen@atlasmeridian.com",
                      "phone": "4155550199",
                      "isAuthorizedSigner": true
                    }
                  ],
                  "documents": {
                    "certificateOfFormation": true,
                    "taxIdLetter": true,
                    "ownershipChart": true,
                    "boardResolution": true,
                    "signerIdentification": true,
                    "addressProof": true
                  },
                  "declarations": {
                    "certifyAuthority": true,
                    "certifyBeneficialOwners": true,
                    "confirmTaxCompliance": true,
                    "confirmTerms": true
                  },
                  "additionalNotes": ""
                }
                """;

        mockMvc.perform(post("/api/v1/risk-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.legalName").value("Atlas Meridian Holdings, Inc."))
                .andExpect(jsonPath("$.riskRating").value("MEDIUM"))
                .andExpect(jsonPath("$.accountDecision").value("APPROVE_WITH_INCREASED_MONITORING"));
    }
}
