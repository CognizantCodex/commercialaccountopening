package com.example.risk.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CommercialCustomerRequest {

    @NotBlank
    private String brandName;

    @NotBlank
    private String formTitle;

    @Valid
    @NotNull
    private CompanyInfo companyInfo;

    @Valid
    @NotNull
    private PrimaryContact primaryContact;

    @Valid
    @NotNull
    private Addresses addresses;

    @Valid
    @NotNull
    private BankingProfile bankingProfile;

    @Valid
    @NotEmpty
    private List<BeneficialOwner> beneficialOwners = new ArrayList<>();

    @Valid
    @NotNull
    private Documents documents;

    @Valid
    @NotNull
    private Declarations declarations;

    private String additionalNotes;

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public String getFormTitle() {
        return formTitle;
    }

    public void setFormTitle(String formTitle) {
        this.formTitle = formTitle;
    }

    public CompanyInfo getCompanyInfo() {
        return companyInfo;
    }

    public void setCompanyInfo(CompanyInfo companyInfo) {
        this.companyInfo = companyInfo;
    }

    public PrimaryContact getPrimaryContact() {
        return primaryContact;
    }

    public void setPrimaryContact(PrimaryContact primaryContact) {
        this.primaryContact = primaryContact;
    }

    public Addresses getAddresses() {
        return addresses;
    }

    public void setAddresses(Addresses addresses) {
        this.addresses = addresses;
    }

    public BankingProfile getBankingProfile() {
        return bankingProfile;
    }

    public void setBankingProfile(BankingProfile bankingProfile) {
        this.bankingProfile = bankingProfile;
    }

    public List<BeneficialOwner> getBeneficialOwners() {
        return beneficialOwners;
    }

    public void setBeneficialOwners(List<BeneficialOwner> beneficialOwners) {
        this.beneficialOwners = beneficialOwners;
    }

    public Documents getDocuments() {
        return documents;
    }

    public void setDocuments(Documents documents) {
        this.documents = documents;
    }

    public Declarations getDeclarations() {
        return declarations;
    }

    public void setDeclarations(Declarations declarations) {
        this.declarations = declarations;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public static class CompanyInfo {
        @NotBlank
        private String legalName;
        private String tradingName;
        @NotBlank
        private String entityType;
        @NotBlank
        private String registrationNumber;
        private String taxId;
        @NotNull
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate incorporationDate;
        private String incorporationState;
        @NotBlank
        private String incorporationCountry;
        @NotBlank
        private String industry;
        private String website;
        @DecimalMin("0.0")
        private BigDecimal annualRevenue;
        @Min(0)
        private Integer employeeCount;

        public String getLegalName() {
            return legalName;
        }

        public void setLegalName(String legalName) {
            this.legalName = legalName;
        }

        public String getTradingName() {
            return tradingName;
        }

        public void setTradingName(String tradingName) {
            this.tradingName = tradingName;
        }

        public String getEntityType() {
            return entityType;
        }

        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }

        public String getRegistrationNumber() {
            return registrationNumber;
        }

        public void setRegistrationNumber(String registrationNumber) {
            this.registrationNumber = registrationNumber;
        }

        public String getTaxId() {
            return taxId;
        }

        public void setTaxId(String taxId) {
            this.taxId = taxId;
        }

        public LocalDate getIncorporationDate() {
            return incorporationDate;
        }

        public void setIncorporationDate(LocalDate incorporationDate) {
            this.incorporationDate = incorporationDate;
        }

        public String getIncorporationState() {
            return incorporationState;
        }

        public void setIncorporationState(String incorporationState) {
            this.incorporationState = incorporationState;
        }

        public String getIncorporationCountry() {
            return incorporationCountry;
        }

        public void setIncorporationCountry(String incorporationCountry) {
            this.incorporationCountry = incorporationCountry;
        }

        public String getIndustry() {
            return industry;
        }

        public void setIndustry(String industry) {
            this.industry = industry;
        }

        public String getWebsite() {
            return website;
        }

        public void setWebsite(String website) {
            this.website = website;
        }

        public BigDecimal getAnnualRevenue() {
            return annualRevenue;
        }

        public void setAnnualRevenue(BigDecimal annualRevenue) {
            this.annualRevenue = annualRevenue;
        }

        public Integer getEmployeeCount() {
            return employeeCount;
        }

        public void setEmployeeCount(Integer employeeCount) {
            this.employeeCount = employeeCount;
        }
    }

    public static class PrimaryContact {
        @NotBlank
        private String fullName;
        private String title;
        @NotBlank
        private String email;
        @NotBlank
        private String phone;
        private String extension;

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getExtension() {
            return extension;
        }

        public void setExtension(String extension) {
            this.extension = extension;
        }
    }

    public static class Addresses {
        @NotBlank
        private String registeredLine1;
        private String registeredLine2;
        @NotBlank
        private String city;
        @NotBlank
        private String state;
        @NotBlank
        private String postalCode;
        @NotBlank
        private String country;
        @NotNull
        private Boolean operatingSameAsRegistered;
        private String operatingLine1;
        private String operatingLine2;
        private String operatingCity;
        private String operatingState;
        private String operatingPostalCode;
        private String operatingCountry;

        public String getRegisteredLine1() {
            return registeredLine1;
        }

        public void setRegisteredLine1(String registeredLine1) {
            this.registeredLine1 = registeredLine1;
        }

        public String getRegisteredLine2() {
            return registeredLine2;
        }

        public void setRegisteredLine2(String registeredLine2) {
            this.registeredLine2 = registeredLine2;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getState() {
            return state;
        }

        public void setState(String state) {
            this.state = state;
        }

        public String getPostalCode() {
            return postalCode;
        }

        public void setPostalCode(String postalCode) {
            this.postalCode = postalCode;
        }

        public String getCountry() {
            return country;
        }

        public void setCountry(String country) {
            this.country = country;
        }

        public Boolean getOperatingSameAsRegistered() {
            return operatingSameAsRegistered;
        }

        public void setOperatingSameAsRegistered(Boolean operatingSameAsRegistered) {
            this.operatingSameAsRegistered = operatingSameAsRegistered;
        }

        public String getOperatingLine1() {
            return operatingLine1;
        }

        public void setOperatingLine1(String operatingLine1) {
            this.operatingLine1 = operatingLine1;
        }

        public String getOperatingLine2() {
            return operatingLine2;
        }

        public void setOperatingLine2(String operatingLine2) {
            this.operatingLine2 = operatingLine2;
        }

        public String getOperatingCity() {
            return operatingCity;
        }

        public void setOperatingCity(String operatingCity) {
            this.operatingCity = operatingCity;
        }

        public String getOperatingState() {
            return operatingState;
        }

        public void setOperatingState(String operatingState) {
            this.operatingState = operatingState;
        }

        public String getOperatingPostalCode() {
            return operatingPostalCode;
        }

        public void setOperatingPostalCode(String operatingPostalCode) {
            this.operatingPostalCode = operatingPostalCode;
        }

        public String getOperatingCountry() {
            return operatingCountry;
        }

        public void setOperatingCountry(String operatingCountry) {
            this.operatingCountry = operatingCountry;
        }
    }

    public static class BankingProfile {
        @NotBlank
        private String accountPurpose;
        private List<String> requestedProducts = new ArrayList<>();
        @DecimalMin("0.0")
        private BigDecimal expectedOpeningDeposit;
        @DecimalMin("0.0")
        private BigDecimal monthlyIncoming;
        @DecimalMin("0.0")
        private BigDecimal monthlyOutgoing;
        @Min(0)
        private Integer onlineBankingUsers;
        @NotNull
        private Boolean internationalActivity;
        private String jurisdictionsInScope;
        @NotNull
        private Boolean needsCommercialCards;

        public String getAccountPurpose() {
            return accountPurpose;
        }

        public void setAccountPurpose(String accountPurpose) {
            this.accountPurpose = accountPurpose;
        }

        public List<String> getRequestedProducts() {
            return requestedProducts;
        }

        public void setRequestedProducts(List<String> requestedProducts) {
            this.requestedProducts = requestedProducts;
        }

        public BigDecimal getExpectedOpeningDeposit() {
            return expectedOpeningDeposit;
        }

        public void setExpectedOpeningDeposit(BigDecimal expectedOpeningDeposit) {
            this.expectedOpeningDeposit = expectedOpeningDeposit;
        }

        public BigDecimal getMonthlyIncoming() {
            return monthlyIncoming;
        }

        public void setMonthlyIncoming(BigDecimal monthlyIncoming) {
            this.monthlyIncoming = monthlyIncoming;
        }

        public BigDecimal getMonthlyOutgoing() {
            return monthlyOutgoing;
        }

        public void setMonthlyOutgoing(BigDecimal monthlyOutgoing) {
            this.monthlyOutgoing = monthlyOutgoing;
        }

        public Integer getOnlineBankingUsers() {
            return onlineBankingUsers;
        }

        public void setOnlineBankingUsers(Integer onlineBankingUsers) {
            this.onlineBankingUsers = onlineBankingUsers;
        }

        public Boolean getInternationalActivity() {
            return internationalActivity;
        }

        public void setInternationalActivity(Boolean internationalActivity) {
            this.internationalActivity = internationalActivity;
        }

        public String getJurisdictionsInScope() {
            return jurisdictionsInScope;
        }

        public void setJurisdictionsInScope(String jurisdictionsInScope) {
            this.jurisdictionsInScope = jurisdictionsInScope;
        }

        public Boolean getNeedsCommercialCards() {
            return needsCommercialCards;
        }

        public void setNeedsCommercialCards(Boolean needsCommercialCards) {
            this.needsCommercialCards = needsCommercialCards;
        }
    }

    public static class BeneficialOwner {
        private String id;
        @NotBlank
        private String fullName;
        private String title;
        @DecimalMin("0.0")
        private BigDecimal ownershipPercentage = BigDecimal.ZERO;
        private String email;
        private String phone;
        @NotNull
        private Boolean isAuthorizedSigner;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public BigDecimal getOwnershipPercentage() {
            return ownershipPercentage;
        }

        public void setOwnershipPercentage(BigDecimal ownershipPercentage) {
            this.ownershipPercentage = ownershipPercentage;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public Boolean getIsAuthorizedSigner() {
            return isAuthorizedSigner;
        }

        public void setIsAuthorizedSigner(Boolean authorizedSigner) {
            isAuthorizedSigner = authorizedSigner;
        }
    }

    public static class Documents {
        @NotNull
        private Boolean certificateOfFormation;
        @NotNull
        private Boolean taxIdLetter;
        @NotNull
        private Boolean ownershipChart;
        @NotNull
        private Boolean boardResolution;
        @NotNull
        private Boolean signerIdentification;
        @NotNull
        private Boolean addressProof;

        public Boolean getCertificateOfFormation() {
            return certificateOfFormation;
        }

        public void setCertificateOfFormation(Boolean certificateOfFormation) {
            this.certificateOfFormation = certificateOfFormation;
        }

        public Boolean getTaxIdLetter() {
            return taxIdLetter;
        }

        public void setTaxIdLetter(Boolean taxIdLetter) {
            this.taxIdLetter = taxIdLetter;
        }

        public Boolean getOwnershipChart() {
            return ownershipChart;
        }

        public void setOwnershipChart(Boolean ownershipChart) {
            this.ownershipChart = ownershipChart;
        }

        public Boolean getBoardResolution() {
            return boardResolution;
        }

        public void setBoardResolution(Boolean boardResolution) {
            this.boardResolution = boardResolution;
        }

        public Boolean getSignerIdentification() {
            return signerIdentification;
        }

        public void setSignerIdentification(Boolean signerIdentification) {
            this.signerIdentification = signerIdentification;
        }

        public Boolean getAddressProof() {
            return addressProof;
        }

        public void setAddressProof(Boolean addressProof) {
            this.addressProof = addressProof;
        }
    }

    public static class Declarations {
        @NotNull
        private Boolean certifyAuthority;
        @NotNull
        private Boolean certifyBeneficialOwners;
        @NotNull
        private Boolean confirmTaxCompliance;
        @NotNull
        private Boolean confirmTerms;

        public Boolean getCertifyAuthority() {
            return certifyAuthority;
        }

        public void setCertifyAuthority(Boolean certifyAuthority) {
            this.certifyAuthority = certifyAuthority;
        }

        public Boolean getCertifyBeneficialOwners() {
            return certifyBeneficialOwners;
        }

        public void setCertifyBeneficialOwners(Boolean certifyBeneficialOwners) {
            this.certifyBeneficialOwners = certifyBeneficialOwners;
        }

        public Boolean getConfirmTaxCompliance() {
            return confirmTaxCompliance;
        }

        public void setConfirmTaxCompliance(Boolean confirmTaxCompliance) {
            this.confirmTaxCompliance = confirmTaxCompliance;
        }

        public Boolean getConfirmTerms() {
            return confirmTerms;
        }

        public void setConfirmTerms(Boolean confirmTerms) {
            this.confirmTerms = confirmTerms;
        }
    }
}
