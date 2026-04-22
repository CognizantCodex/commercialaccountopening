# commercialAccountOpening

Spring Boot project for commercial account opening risk assessment using the exact matrix you provided.

## Design

This project uses a hybrid approach:

- deterministic scoring engine for the official risk decision
- optional LLM-generated analyst narrative that never changes the deterministic decision

The deterministic engine is the source of truth for policy and audit.

## API

`POST /api/v1/risk-assessments`

`GET /api/v1/risk-assessments/{assessmentId}`

`GET /api/v1/risk-assessments`

`GET /api/v1/health`

## Run

```bash
mvn spring-boot:run
```

To enable the LLM summary layer:

```bash
set OPENAI_API_KEY=your_key_here
```

Then set this in [application.yml](C:/Users/977875/OneDrive%20-%20Cognizant/Documents/New%20project/src/main/resources/application.yml):

```yaml
risk:
  llm:
    enabled: true
```

## Test

```bash
mvn test
```

## Sample Requests

Sample request payloads for `POST /api/v1/risk-assessments` are available in [samples](C:/Users/977875/OneDrive%20-%20Cognizant/Documents/New%20project/samples):

- [medium-risk-tech-services.json](C:/Users/977875/OneDrive%20-%20Cognizant/Documents/New%20project/samples/medium-risk-tech-services.json)
- [missing-documents-no-account-opening.json](C:/Users/977875/OneDrive%20-%20Cognizant/Documents/New%20project/samples/missing-documents-no-account-opening.json)
- [sanctioned-country-reject.json](C:/Users/977875/OneDrive%20-%20Cognizant/Documents/New%20project/samples/sanctioned-country-reject.json)
- [signer-id-hold-transactions.json](C:/Users/977875/OneDrive%20-%20Cognizant/Documents/New%20project/samples/signer-id-hold-transactions.json)

Example PowerShell request:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8080/api/v1/risk-assessments `
  -ContentType "application/json" `
  -InFile ".\samples\medium-risk-tech-services.json"
```

## What is implemented

- commercial application scoring across eligibility, customer, industry, geography, product usage, transaction behavior, ownership, and document completeness
- override rules for sanctions, declarations, tax verification, opening-document gates, and signer identification
- optional OpenAI-compatible analyst summary generation with deterministic fallback
- final ratings:
  - `LOW`
  - `MEDIUM`
  - `HIGH`
  - `UNACCEPTABLE`
- decisions:
  - `AUTO_APPROVE`
  - `APPROVE_WITH_INCREASED_MONITORING`
  - `EDD_MANAGER_APPROVAL`
  - `HOLD`
  - `HOLD_TRANSACTIONS`
  - `REJECT`
  - `NO_ACCOUNT_OPENING`
  - `SENIOR_COMMITTEE`

## Important assumptions

- Country bands, industry bands, product mappings, document gates, and scoring thresholds live in configuration so compliance can tune them without code changes.
- Beneficial owner screening status is not an explicit field in the current request contract, so the engine enforces UBO screening as a required control rather than a separate request-field override.
- The LLM is used only for analyst narrative explanation and never changes policy decisions.
