package com.kycnorthstar.platform;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PlatformControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void snapshotEndpointReturnsSeededDashboardData() throws Exception {
    mockMvc.perform(get("/api/v1/platform/snapshot"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.clients[0].id").exists())
        .andExpect(jsonPath("$.cases[0].id").exists())
        .andExpect(jsonPath("$.timeline[0].type").value("document_uploaded"))
        .andExpect(jsonPath("$.alerts[0].title").exists())
        .andExpect(jsonPath("$.decisionLogs[0].reasoningChain[0]").exists());
  }

  @Test
  void resolveAliasMovesAuroraCaseIntoMonitoring() throws Exception {
    mockMvc.perform(post("/api/cases/case-aurora-001/resolve")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"action\":\"resolve\",\"caseId\":\"case-aurora-001\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("resolved"))
        .andExpect(jsonPath("$.stage").value("monitoring"));
  }

  @Test
  void governanceAliasCreatesExplainabilityRecord() throws Exception {
    mockMvc.perform(post("/api/governance/cases/case-aurora-001/decision")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"action\":\"open-governance\",\"caseId\":\"case-aurora-001\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.caseId").value("case-aurora-001"))
        .andExpect(jsonPath("$.reasoningChain[0]").exists());

    mockMvc.perform(get("/api/v1/cases/case-aurora-001/explainability"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.caseId").value("case-aurora-001"))
        .andExpect(jsonPath("$.decision.id").exists());
  }

  @Test
  void checkKycReturnsMockedDecision() throws Exception {
    mockMvc.perform(post("/api/v1/checkKYC")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
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
                    "requestedProducts": ["Operating account", "ACH origination"],
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
                    "signerIdentification": false,
                    "addressProof": false
                  },
                  "declarations": {
                    "certifyAuthority": true,
                    "certifyBeneficialOwners": true,
                    "confirmTaxCompliance": true,
                    "confirmTerms": true
                  },
                  "additionalNotes": ""
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value(anyOf(is("pass"), is("fail"))))
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.checkedAt").exists());
  }

  @Test
  void checkKybReturnsPassForActiveCompanyWhenAddressAndTaxIdMatch() throws Exception {
    mockMvc.perform(post("/api/v1/checkKYB")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "entityName": "Atlas Meridian Holdings, Inc.",
                  "address": "100 Market Street, Suite 1200, San Francisco, California 94105, United States",
                  "taxId": "12-3456789"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("Pass"))
        .andExpect(jsonPath("$.entityName").value("Atlas Meridian Holdings, Inc."))
        .andExpect(jsonPath("$.addressMatched").value(true))
        .andExpect(jsonPath("$.taxIdMatched").value(true))
        .andExpect(jsonPath("$.companyStatus").value("Active"))
        .andExpect(jsonPath("$.checkedAt").exists());
  }

  @Test
  void checkKybReturnsFailForInactiveCompanyEvenWhenAddressAndTaxIdMatch() throws Exception {
    mockMvc.perform(post("/api/v1/checkKYB")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "entityName": "Harbor Logistics LLC",
                  "address": "500 Trade Center Drive, Newark, New Jersey 07102, United States",
                  "taxId": "98-7654321"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("Fail"))
        .andExpect(jsonPath("$.addressMatched").value(true))
        .andExpect(jsonPath("$.taxIdMatched").value(true))
        .andExpect(jsonPath("$.companyStatus").value("Inactive"));
  }

  @Test
  void checkKybReturnsFailWhenValidationDoesNotMatchStoredBusinessRecord() throws Exception {
    mockMvc.perform(post("/api/v1/checkKYB")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "entityName": "Atlas Meridian Holdings, Inc.",
                  "address": "10 Wrong Street, San Francisco, California 94105, United States",
                  "taxId": "00-0000000"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("Fail"))
        .andExpect(jsonPath("$.addressMatched").value(false))
        .andExpect(jsonPath("$.taxIdMatched").value(false))
        .andExpect(jsonPath("$.companyStatus").value("Active"));
  }
}
