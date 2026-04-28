const INDUSTRY_TO_NAICS_CODE = new Map([
  ["technology services", "541512"],
  ["distribution and wholesale", "423990"],
  ["manufacturing", "339999"],
  ["healthcare services", "621999"],
  ["professional services", "541611"],
  ["construction and engineering", "236220"],
  ["real estate management", "531390"],
  ["transportation and logistics", "484110"],
]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeIndustry(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeNaicsCode(value) {
  if (!hasText(value)) {
    return null;
  }

  const normalized = String(value).trim();
  return /^\d{2,6}$/.test(normalized) ? normalized : "";
}

export function getNaicsCodeForIndustry(industry) {
  return INDUSTRY_TO_NAICS_CODE.get(normalizeIndustry(industry)) ?? null;
}

export function resolveNaicsCode(payload = {}) {
  const explicitNaics = normalizeNaicsCode(payload.naics_code);

  if (explicitNaics !== null) {
    return explicitNaics;
  }

  return (
    getNaicsCodeForIndustry(payload.industry) ??
    getNaicsCodeForIndustry(payload.primary_industry) ??
    getNaicsCodeForIndustry(payload.primaryIndustry)
  );
}

export function listSupportedIndustryNaicsMappings() {
  return Object.fromEntries(INDUSTRY_TO_NAICS_CODE.entries());
}
