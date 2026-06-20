export const complianceGuardrails = {
  noUnsupportedConclusions:
    "Do not infer conclusions that are not directly supported by visible filing data.",
  noAdvice:
    "Do not provide legal, tax, fiduciary, or investment advice in generated output.",
  missingData:
    "Missing values must be labeled as Not visible in filing or Requires additional plan records.",
  supportedCalculations:
    "Only calculate metrics when every source value required for the formula exists."
};

export function canCalculateMetric(...values: Array<number | null | undefined>) {
  return values.every((value) => typeof value === "number" && Number.isFinite(value));
}

export function missingDataLabel(sourceRecordsNeeded = false) {
  return sourceRecordsNeeded ? "Requires additional plan records" : "Not visible in filing";
}
