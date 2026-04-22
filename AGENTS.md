# AGENTS.md

## Purpose

This repository implements a commercial account opening and AML risk assessment service in Spring Boot.

## Architecture

- `RiskScoringEngine` is the policy source of truth.
- Scoring must remain deterministic, auditable, and traceable to the approved risk matrix.
- LLM usage is assistive only.
- LLM output must never override score-based policy decisions or mandatory override rules.

## Rules For Agents

- Do not move business decisions from deterministic code into prompts.
- Keep risk thresholds, country bands, industry bands, and document rules configurable in `application.yml`.
- Preserve compatibility with the nested customer JSON contract.
- Treat sanctions, PEP plus adverse media, and incomplete KYC as hard policy overrides.
- Prefer small, reviewable changes with tests when updating scoring logic.

## LLM Guidance

- Use the LLM only for narrative summaries, analyst explanations, control recommendations, and case notes.
- If the LLM is unavailable, return a deterministic fallback summary.
- Do not expose secrets in logs or responses.

## Run

- `mvn spring-boot:run`
- `mvn test`
