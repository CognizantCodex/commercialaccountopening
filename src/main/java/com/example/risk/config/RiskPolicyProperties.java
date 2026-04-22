package com.example.risk.config;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "risk")
public class RiskPolicyProperties {

    private CountryBands countryBands = new CountryBands();
    private IndustryBands industryBands = new IndustryBands();
    private ProductMapping productMapping = new ProductMapping();
    private Documentation documentation = new Documentation();
    private Thresholds thresholds = new Thresholds();
    private Consistency consistency = new Consistency();

    public CountryBands getCountryBands() {
        return countryBands;
    }

    public void setCountryBands(CountryBands countryBands) {
        this.countryBands = countryBands;
    }

    public IndustryBands getIndustryBands() {
        return industryBands;
    }

    public void setIndustryBands(IndustryBands industryBands) {
        this.industryBands = industryBands;
    }

    public ProductMapping getProductMapping() {
        return productMapping;
    }

    public void setProductMapping(ProductMapping productMapping) {
        this.productMapping = productMapping;
    }

    public Documentation getDocumentation() {
        return documentation;
    }

    public void setDocumentation(Documentation documentation) {
        this.documentation = documentation;
    }

    public Thresholds getThresholds() {
        return thresholds;
    }

    public void setThresholds(Thresholds thresholds) {
        this.thresholds = thresholds;
    }

    public Consistency getConsistency() {
        return consistency;
    }

    public void setConsistency(Consistency consistency) {
        this.consistency = consistency;
    }

    public static class CountryBands {
        private List<String> sanctioned = new ArrayList<>();
        private List<String> highRisk = new ArrayList<>();

        public List<String> getSanctioned() {
            return sanctioned;
        }

        public void setSanctioned(List<String> sanctioned) {
            this.sanctioned = sanctioned;
        }

        public List<String> getHighRisk() {
            return highRisk;
        }

        public void setHighRisk(List<String> highRisk) {
            this.highRisk = highRisk;
        }
    }

    public static class IndustryBands {
        private List<String> mediumRisk = new ArrayList<>();
        private List<String> highRisk = new ArrayList<>();

        public List<String> getMediumRisk() {
            return mediumRisk;
        }

        public void setMediumRisk(List<String> mediumRisk) {
            this.mediumRisk = mediumRisk;
        }

        public List<String> getHighRisk() {
            return highRisk;
        }

        public void setHighRisk(List<String> highRisk) {
            this.highRisk = highRisk;
        }
    }

    public static class ProductMapping {
        private List<String> achOriginationProducts = new ArrayList<>();
        private List<String> wireTransferProducts = new ArrayList<>();

        public List<String> getAchOriginationProducts() {
            return achOriginationProducts;
        }

        public void setAchOriginationProducts(List<String> achOriginationProducts) {
            this.achOriginationProducts = achOriginationProducts;
        }

        public List<String> getWireTransferProducts() {
            return wireTransferProducts;
        }

        public void setWireTransferProducts(List<String> wireTransferProducts) {
            this.wireTransferProducts = wireTransferProducts;
        }
    }

    public static class Documentation {
        private List<String> noAccountOpeningDocuments = new ArrayList<>();
        private List<String> holdTransactionDocuments = new ArrayList<>();
        private List<String> riskEscalationDocuments = new ArrayList<>();

        public List<String> getNoAccountOpeningDocuments() {
            return noAccountOpeningDocuments;
        }

        public void setNoAccountOpeningDocuments(List<String> noAccountOpeningDocuments) {
            this.noAccountOpeningDocuments = noAccountOpeningDocuments;
        }

        public List<String> getHoldTransactionDocuments() {
            return holdTransactionDocuments;
        }

        public void setHoldTransactionDocuments(List<String> holdTransactionDocuments) {
            this.holdTransactionDocuments = holdTransactionDocuments;
        }

        public List<String> getRiskEscalationDocuments() {
            return riskEscalationDocuments;
        }

        public void setRiskEscalationDocuments(List<String> riskEscalationDocuments) {
            this.riskEscalationDocuments = riskEscalationDocuments;
        }
    }

    public static class Thresholds {
        private int lowMax = 30;
        private int mediumMax = 60;
        private int highMax = 80;
        private int newEntityMonths = 12;
        private int youngEntityMonths = 24;
        private BigDecimal highOpeningDeposit = new BigDecimal("100000");
        private BigDecimal annualizedRevenueMultiplier = new BigDecimal("1.50");
        private BigDecimal monthlyIncomingPerEmployeeLimit = new BigDecimal("100000");
        private BigDecimal passThroughRatioThreshold = new BigDecimal("0.90");
        private BigDecimal beneficialOwnershipThreshold = new BigDecimal("25");

        public int getLowMax() {
            return lowMax;
        }

        public void setLowMax(int lowMax) {
            this.lowMax = lowMax;
        }

        public int getMediumMax() {
            return mediumMax;
        }

        public void setMediumMax(int mediumMax) {
            this.mediumMax = mediumMax;
        }

        public int getHighMax() {
            return highMax;
        }

        public void setHighMax(int highMax) {
            this.highMax = highMax;
        }

        public int getNewEntityMonths() {
            return newEntityMonths;
        }

        public void setNewEntityMonths(int newEntityMonths) {
            this.newEntityMonths = newEntityMonths;
        }

        public int getYoungEntityMonths() {
            return youngEntityMonths;
        }

        public void setYoungEntityMonths(int youngEntityMonths) {
            this.youngEntityMonths = youngEntityMonths;
        }

        public BigDecimal getHighOpeningDeposit() {
            return highOpeningDeposit;
        }

        public void setHighOpeningDeposit(BigDecimal highOpeningDeposit) {
            this.highOpeningDeposit = highOpeningDeposit;
        }

        public BigDecimal getAnnualizedRevenueMultiplier() {
            return annualizedRevenueMultiplier;
        }

        public void setAnnualizedRevenueMultiplier(BigDecimal annualizedRevenueMultiplier) {
            this.annualizedRevenueMultiplier = annualizedRevenueMultiplier;
        }

        public BigDecimal getMonthlyIncomingPerEmployeeLimit() {
            return monthlyIncomingPerEmployeeLimit;
        }

        public void setMonthlyIncomingPerEmployeeLimit(BigDecimal monthlyIncomingPerEmployeeLimit) {
            this.monthlyIncomingPerEmployeeLimit = monthlyIncomingPerEmployeeLimit;
        }

        public BigDecimal getPassThroughRatioThreshold() {
            return passThroughRatioThreshold;
        }

        public void setPassThroughRatioThreshold(BigDecimal passThroughRatioThreshold) {
            this.passThroughRatioThreshold = passThroughRatioThreshold;
        }

        public BigDecimal getBeneficialOwnershipThreshold() {
            return beneficialOwnershipThreshold;
        }

        public void setBeneficialOwnershipThreshold(BigDecimal beneficialOwnershipThreshold) {
            this.beneficialOwnershipThreshold = beneficialOwnershipThreshold;
        }
    }

    public static class Consistency {
        private Map<String, List<String>> industryPurposeKeywords = new LinkedHashMap<>();

        public Map<String, List<String>> getIndustryPurposeKeywords() {
            return industryPurposeKeywords;
        }

        public void setIndustryPurposeKeywords(Map<String, List<String>> industryPurposeKeywords) {
            this.industryPurposeKeywords = industryPurposeKeywords;
        }
    }
}
