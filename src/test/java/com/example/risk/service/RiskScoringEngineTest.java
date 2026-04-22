package com.example.risk.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.risk.config.LlmProperties;
import com.example.risk.config.RiskPolicyProperties;
import com.example.risk.model.CommercialCustomerRequest;
import com.example.risk.model.RiskAssessmentResult;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import org.junit.jupiter.api.Test;

class RiskScoringEngineTest {

    private final RiskScoringEngine engine = new RiskScoringEngine(
            buildProperties(),
            new NarrativeService(new LlmProperties()));

    @Test
    void shouldReturnMediumRiskForDomesticTechnologyApplicant() {
        CommercialCustomerRequest request = buildBaseRequest();

        RiskAssessmentResult result = engine.assess(request);

        assertThat(result.getRiskRating()).isEqualTo("MEDIUM");
        assertThat(result.getAccountDecision()).isEqualTo("APPROVE_WITH_INCREASED_MONITORING");
        assertThat(result.getRiskScore()).isEqualTo(35);
    }

    @Test
    void shouldRejectWhenIncorporationCountryIsSanctioned() {
        CommercialCustomerRequest request = buildBaseRequest();
        request.getCompanyInfo().setIncorporationCountry("Iran");

        RiskAssessmentResult result = engine.assess(request);

        assertThat(result.getAccountDecision()).isEqualTo("REJECT");
        assertThat(result.getOverrideReason()).contains("sanctioned incorporation country");
        assertThat(result.getRiskRating()).isEqualTo("UNACCEPTABLE");
    }

    @Test
    void shouldStopAccountOpeningWhenRequiredDocumentsMissing() {
        CommercialCustomerRequest request = buildBaseRequest();
        request.getDocuments().setOwnershipChart(false);

        RiskAssessmentResult result = engine.assess(request);

        assertThat(result.getAccountDecision()).isEqualTo("NO_ACCOUNT_OPENING");
        assertThat(result.getOverrideReason()).contains("required documents missing");
        assertThat(result.getMissingDocuments()).contains("Ownership Chart");
    }

    @Test
    void shouldHoldTransactionsWhenSignerIdentificationMissing() {
        CommercialCustomerRequest request = buildBaseRequest();
        request.getDocuments().setSignerIdentification(false);

        RiskAssessmentResult result = engine.assess(request);

        assertThat(result.getAccountDecision()).isEqualTo("HOLD_TRANSACTIONS");
        assertThat(result.getOverrideReason()).contains("signer identification outstanding");
    }

    private RiskPolicyProperties buildProperties() {
        RiskPolicyProperties properties = new RiskPolicyProperties();
        properties.getCountryBands().setSanctioned(List.of("IRAN", "NORTH KOREA"));
        properties.getCountryBands().setHighRisk(List.of("IRAN", "SYRIA", "AFGHANISTAN"));
        properties.getIndustryBands().setMediumRisk(List.of("TECHNOLOGY SERVICES", "CONSULTING"));
        properties.getIndustryBands().setHighRisk(List.of("CRYPTO", "GAMBLING", "MSB"));
        properties.getProductMapping().setAchOriginationProducts(List.of("ACH ORIGINATION"));
        properties.getProductMapping().setWireTransferProducts(List.of("WIRE TRANSFERS"));
        properties.getDocumentation().setNoAccountOpeningDocuments(List.of(
                "certificateOfFormation",
                "taxIdLetter",
                "ownershipChart"));
        properties.getDocumentation().setHoldTransactionDocuments(List.of("signerIdentification"));
        properties.getDocumentation().setRiskEscalationDocuments(List.of("addressProof"));
        LinkedHashMap<String, List<String>> industryKeywords = new LinkedHashMap<>();
        industryKeywords.put("TECHNOLOGY SERVICES", List.of("CLIENT", "TREASURY", "RECEIPTS", "OPERATING"));
        properties.getConsistency().setIndustryPurposeKeywords(industryKeywords);
        return properties;
    }

    private CommercialCustomerRequest buildBaseRequest() {
        CommercialCustomerRequest request = new CommercialCustomerRequest();
        request.setBrandName("Harbor Commercial");
        request.setFormTitle("Corporate Account Opening Application");

        CommercialCustomerRequest.CompanyInfo companyInfo = new CommercialCustomerRequest.CompanyInfo();
        companyInfo.setLegalName("Atlas Meridian Holdings, Inc.");
        companyInfo.setTradingName("Atlas Meridian");
        companyInfo.setEntityType("Corporation");
        companyInfo.setRegistrationNumber("C4839201");
        companyInfo.setTaxId("12-3456789");
        companyInfo.setIncorporationDate(LocalDate.of(2017, 5, 18));
        companyInfo.setIncorporationState("Delaware");
        companyInfo.setIncorporationCountry("United States");
        companyInfo.setIndustry("Technology services");
        companyInfo.setWebsite("https://atlasmeridian.com");
        companyInfo.setAnnualRevenue(new BigDecimal("25000000"));
        companyInfo.setEmployeeCount(120);
        request.setCompanyInfo(companyInfo);

        CommercialCustomerRequest.PrimaryContact primaryContact = new CommercialCustomerRequest.PrimaryContact();
        primaryContact.setFullName("Morgan Chen");
        primaryContact.setTitle("Chief Financial Officer");
        primaryContact.setEmail("morgan.chen@atlasmeridian.com");
        primaryContact.setPhone("4155550199");
        primaryContact.setExtension("204");
        request.setPrimaryContact(primaryContact);

        CommercialCustomerRequest.Addresses addresses = new CommercialCustomerRequest.Addresses();
        addresses.setRegisteredLine1("100 Market Street");
        addresses.setRegisteredLine2("Suite 1200");
        addresses.setCity("San Francisco");
        addresses.setState("California");
        addresses.setPostalCode("94105");
        addresses.setCountry("United States");
        addresses.setOperatingSameAsRegistered(true);
        addresses.setOperatingCountry("United States");
        request.setAddresses(addresses);

        CommercialCustomerRequest.BankingProfile bankingProfile = new CommercialCustomerRequest.BankingProfile();
        bankingProfile.setAccountPurpose("Operating account for client receipts and treasury disbursements");
        bankingProfile.setRequestedProducts(List.of("Operating account", "ACH origination"));
        bankingProfile.setExpectedOpeningDeposit(new BigDecimal("250000"));
        bankingProfile.setMonthlyIncoming(new BigDecimal("900000"));
        bankingProfile.setMonthlyOutgoing(new BigDecimal("720000"));
        bankingProfile.setOnlineBankingUsers(2);
        bankingProfile.setInternationalActivity(false);
        bankingProfile.setJurisdictionsInScope("");
        bankingProfile.setNeedsCommercialCards(false);
        request.setBankingProfile(bankingProfile);

        CommercialCustomerRequest.BeneficialOwner owner = new CommercialCustomerRequest.BeneficialOwner();
        owner.setId("owner-1");
        owner.setFullName("Morgan Chen");
        owner.setTitle("Chief Financial Officer");
        owner.setOwnershipPercentage(new BigDecimal("35"));
        owner.setEmail("morgan.chen@atlasmeridian.com");
        owner.setPhone("4155550199");
        owner.setIsAuthorizedSigner(true);
        request.setBeneficialOwners(List.of(owner));

        CommercialCustomerRequest.Documents documents = new CommercialCustomerRequest.Documents();
        documents.setCertificateOfFormation(true);
        documents.setTaxIdLetter(true);
        documents.setOwnershipChart(true);
        documents.setBoardResolution(true);
        documents.setSignerIdentification(true);
        documents.setAddressProof(true);
        request.setDocuments(documents);

        CommercialCustomerRequest.Declarations declarations = new CommercialCustomerRequest.Declarations();
        declarations.setCertifyAuthority(true);
        declarations.setCertifyBeneficialOwners(true);
        declarations.setConfirmTaxCompliance(true);
        declarations.setConfirmTerms(true);
        request.setDeclarations(declarations);

        request.setAdditionalNotes("");
        return request;
    }
}
