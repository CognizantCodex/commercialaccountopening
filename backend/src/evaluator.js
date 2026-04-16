function normalize(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function joinText(...parts) {
  return parts.filter(Boolean).map(normalizeText).join(" ");
}

function containsAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function response(stage, decision, confidence, rationale, keyFactors) {
  return { stage, decision, confidence, rationale, keyFactors };
}

function evaluateDocumentReview(request) {
  const combined = joinText(
    request.document?.ocrText,
    request.aggregatedOcrSummary,
    request.notes,
  );

  if (!request.aggregatedOcrSummary && !request.document?.ocrText) {
    return response(
      "DOCUMENT_REVIEW",
      "MANUAL_REVIEW",
      24,
      "Document evidence is missing, so business identity support cannot be established from the provided context.",
      [
        "No redacted OCR text was provided",
        "No aggregated OCR summary was provided",
        "Manual document review is required for incomplete evidence",
      ],
    );
  }

  if (containsAny(combined, ["mismatch", "contradiction", "inconsistent", "does not match", "conflict"])) {
    return response(
      "DOCUMENT_REVIEW",
      "MANUAL_REVIEW",
      41,
      "Document context contains inconsistency signals that require a manual review of the supporting evidence.",
      [
        "Provided text includes contradiction or mismatch indicators",
        "Document consistency cannot be confirmed from the supplied context",
        "Risk flag requires human follow-up",
      ],
    );
  }

  if (containsAny(combined, ["illegible", "blurred", "unreadable", "cut off", "partial", "missing page", "incomplete", "unclear", "cannot verify"])) {
    return response(
      "DOCUMENT_REVIEW",
      "MANUAL_REVIEW",
      47,
      "Document content appears incomplete or unclear, preventing a reliable business identity determination.",
      [
        "Provided OCR context includes incomplete or unclear indicators",
        "Document quality limits verification confidence",
        "Manual review is required under the document review rules",
      ],
    );
  }

  if (containsAny(combined, ["certificate of formation", "articles of incorporation", "business license", "registration", "state filing", "ein confirmation", "tax registration", "secretary of state", "incorporated", "llc", "corporation"])) {
    return response(
      "DOCUMENT_REVIEW",
      "APPROVED",
      92,
      "The provided document context supports business identity and does not show an explicit contradiction in the supplied inputs.",
      [
        "OCR content includes business registration or formation indicators",
        "No explicit contradiction signal was detected in the provided context",
        "Document review signals support the business identity requirement",
      ],
    );
  }

  return response(
    "DOCUMENT_REVIEW",
    "MANUAL_REVIEW",
    52,
    "The provided document context does not clearly support business identity, so a manual review is required.",
    [
      "Document content was provided but identity support is not clear",
      "No definitive contradiction was detected",
      "Conservative review path is required for ambiguous evidence",
    ],
  );
}

function evaluateKyc(request) {
  const combined = joinText(
    request.aggregatedOcrSummary,
    request.document?.ocrText,
    request.notes,
  );

  if (containsAny(combined, ["sanctions", "fraud", "fraudulent", "terrorist financing", "shell company", "watchlist", "forged", "fake", "stolen identity"])) {
    return response(
      "KYC",
      "REJECTED",
      94,
      "The provided context includes explicit severe KYC risk indicators, which requires rejection under the stated rules.",
      [
        "Supplied context includes explicit fraud or sanctions-related signals",
        "KYC policy requires rejection for severe adverse indicators",
        "Decision is based strictly on the provided negative evidence",
      ],
    );
  }

  if (containsAny(combined, ["mismatch", "contradiction", "inconsistent", "does not match", "conflict"])) {
    return response(
      "KYC",
      "MANUAL_REVIEW",
      55,
      "The provided registration or ownership context is not fully consistent, so KYC cannot be approved automatically.",
      [
        "Consistency issues were detected in the supplied context",
        "KYC requires aligned registration and ownership signals",
        "Manual review is required for inconsistent information",
      ],
    );
  }

  const hasRegistration = containsAny(combined, ["registered", "registration", "certificate of formation", "articles of incorporation", "secretary of state", "business license", "good standing", "active status"]);
  const hasOwnership = containsAny(combined, ["owner", "ownership", "managing member", "member", "shareholder", "director", "beneficial owner", "partner"]);

  if (hasRegistration && hasOwnership) {
    return response(
      "KYC",
      "APPROVED",
      90,
      "The supplied context supports business registration validity and ownership clarity without explicit severe inconsistency signals.",
      [
        "Registration indicators are present in the provided context",
        "Ownership indicators are present in the provided context",
        "No explicit severe adverse KYC signal was detected",
      ],
    );
  }

  return response(
    "KYC",
    "MANUAL_REVIEW",
    44,
    "The supplied context does not clearly establish both valid registration and ownership clarity, so KYC requires manual review.",
    [
      "Registration evidence is incomplete or unclear in the provided context",
      "Ownership clarity is incomplete or unclear in the provided context",
      "Policy requires manual review when key KYC elements are missing",
    ],
  );
}

function evaluateCredit(request) {
  const combined = joinText(request.aggregatedOcrSummary, request.notes);

  if (containsAny(combined, ["bankruptcy", "default", "delinquent", "charge off", "charge-off", "collections", "tax lien", "judgment", "negative credit", "poor credit"])) {
    return response(
      "CREDIT",
      "REJECTED",
      91,
      "The provided context includes explicit negative credit indicators, which requires rejection under the stated credit rules.",
      [
        "Supplied context includes explicit adverse credit indicators",
        "Credit policy requires rejection for clear negative signals",
        "Decision is limited to the provided credit context",
      ],
    );
  }

  if (containsAny(combined, ["strong credit", "low risk", "stable cash flow", "profitable", "positive payment history", "well capitalized", "good standing", "strong balance sheet", "investment grade"])) {
    return response(
      "CREDIT",
      "APPROVED",
      88,
      "The provided context contains strong credit quality signals with no explicit adverse indicator in the supplied inputs.",
      [
        "Credit context includes strong or stable performance indicators",
        "No explicit adverse credit signal was detected",
        "Credit rules allow approval on clear positive signals",
      ],
    );
  }

  if (!combined || containsAny(combined, ["thin file", "limited history", "uncertain", "mixed", "manual review", "borderline", "insufficient data"])) {
    return response(
      "CREDIT",
      "MANUAL_REVIEW",
      46,
      "The credit context is thin, mixed, or incomplete, so the case cannot be approved automatically.",
      [
        "Credit evidence is limited or mixed in the provided context",
        "No clear strong signal is established from the supplied inputs",
        "Manual review is required for uncertain credit quality",
      ],
    );
  }

  return response(
    "CREDIT",
    "MANUAL_REVIEW",
    54,
    "The provided credit context is not clearly negative, but it is not strong enough to support automatic approval.",
    [
      "No explicit adverse credit signal was detected",
      "No clear strong credit signal was detected",
      "Conservative manual review is appropriate for ambiguous credit inputs",
    ],
  );
}

function evaluateRisk(request) {
  const decisions = new Map();
  for (const item of request.priorStageDecisions ?? []) {
    if (item?.stage && item?.decision) {
      decisions.set(normalize(item.stage), normalize(item.decision));
    }
  }

  if (decisions.size === 0) {
    return response(
      "RISK",
      "MANUAL_REVIEW",
      34,
      "Final risk review requires prior stage outcomes, and none were supplied in the provided context.",
      [
        "No prior stage decisions were provided",
        "Final risk review depends on upstream stage outcomes",
        "Manual review is required when required context is missing",
      ],
    );
  }

  if ([...decisions.values()].includes("REJECTED")) {
    return response(
      "RISK",
      "REJECTED",
      96,
      "At least one prior stage is rejected in the provided context, so final risk must also be rejected under the stated rules.",
      [
        "A provided prior stage decision is REJECTED",
        "Final risk rules require rejection when any prior stage is rejected",
        "Decision is based strictly on the supplied stage outcomes",
      ],
    );
  }

  if ([...decisions.values()].includes("MANUAL_REVIEW")) {
    return response(
      "RISK",
      "MANUAL_REVIEW",
      84,
      "At least one prior stage remains uncertain in the supplied context, so final risk requires manual review.",
      [
        "A provided prior stage decision is MANUAL_REVIEW",
        "Final risk rules require manual review when uncertainty remains",
        "Automatic approval is not permitted with unresolved upstream risk",
      ],
    );
  }

  const requiredStages = ["DOCUMENT_REVIEW", "KYC", "CREDIT"];
  const missingStages = requiredStages.some((stage) => !decisions.has(stage));
  if (missingStages) {
    return response(
      "RISK",
      "MANUAL_REVIEW",
      58,
      "Not all expected prior stage outcomes are present in the supplied context, so final risk cannot be approved automatically.",
      [
        "Some expected prior stage decisions are missing",
        "Final risk approval requires clean and complete upstream outcomes",
        "Manual review is required when prior-stage evidence is incomplete",
      ],
    );
  }

  return response(
    "RISK",
    "APPROVED",
    93,
    "All supplied prior stage decisions are approved and no unresolved uncertainty is present in the provided context.",
    [
      "Provided DOCUMENT_REVIEW outcome is approved",
      "Provided KYC and CREDIT outcomes are approved",
      "Final risk rules allow approval when all supplied signals are clean and consistent",
    ],
  );
}

function evaluateRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("Request body must be a JSON object.");
  }

  if (!request.stage || typeof request.stage !== "string") {
    throw new Error("The 'stage' field is required.");
  }

  switch (normalize(request.stage)) {
    case "DOCUMENT_REVIEW":
      return evaluateDocumentReview(request);
    case "KYC":
      return evaluateKyc(request);
    case "CREDIT":
      return evaluateCredit(request);
    case "RISK":
      return evaluateRisk(request);
    default:
      throw new Error(`Unsupported stage '${request.stage}'. Use DOCUMENT_REVIEW, KYC, CREDIT, or RISK.`);
  }
}

module.exports = {
  evaluateRequest,
};
