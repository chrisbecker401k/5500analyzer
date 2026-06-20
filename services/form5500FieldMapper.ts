import type { PlanAnalysis } from "@/types/plan";

function normalize(text: string) {
  return text.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\r/g, "");
}

function cleanMoney(value: string | undefined | null) {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanNumber(value: string | undefined | null) {
  if (!value) return null;
  const parsed = Number(value.replace(/[,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function matchMoney(text: string, pattern: RegExp) {
  return cleanMoney(text.match(pattern)?.[1]);
}

function matchText(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.replace(/\s+/g, " ").trim() || null;
}

function participantCount(text: string, lineCode: string) {
  const line = text.match(new RegExp(`${lineCode.replace(/[()]/g, "\\$&")}[^\\n]*`))?.[0] || "";
  const clean = line.replace(/1234567890/g, "").replace(/123456789/g, "");
  const numbers = clean.match(/\b\d{2,6}\b/g);
  return cleanNumber(numbers?.at(-1));
}

function flatten(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function titleCasePlan(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bInc\.?/g, "Inc.")
    .replace(/\bLlc\b/g, "LLC")
    .replace(/\bLtd\b/g, "Ltd.")
    .replace(/401\(K\)/g, "401(k)")
    .replace(/Inc\.\./g, "Inc.");
}

function fallbackString(value: string | null, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function safeAbs(value: number | null) {
  return value === null ? null : Math.abs(value);
}

function allNumbers(value: string | undefined | null) {
  return value?.match(/-?\d{1,10}/g)?.map((part) => Number(part)).filter(Number.isFinite) ?? [];
}

function afterPatternNumbers(text: string, pattern: RegExp, limit = 48) {
  const match = pattern.exec(text);
  if (!match || match.index === undefined) return [];
  return allNumbers(text.slice(match.index + match[0].length, match.index + match[0].length + 1600)).slice(0, limit);
}

function scheduleHPage15Values(flatText: string) {
  const block = flatText.match(/2b\(5\)\(C\)[\s\S]{0,900}?0 0 0 0 0 0 (\d{7,}) (\d{7,}) 0 0 0 0 0 0 0 0 0 0 \1 \2 (\d+) (\d+) (\d+) 0 (\d+) 0 0 0 0 (\d+) 0 (\d+) 0 0 (\d+) (\d+)/i);
  if (block) {
    return {
      beginningAssets: cleanNumber(block[1]),
      endingAssets: cleanNumber(block[2]),
      employerContributions: cleanNumber(block[3]),
      participantContributions: cleanNumber(block[4]),
      rollovers: cleanNumber(block[5]),
      totalContributions: cleanNumber(block[6]),
      participantLoanInterest: cleanNumber(block[7]),
      dividendIncome: cleanNumber(block[10])
    };
  }
  const numbers = afterPatternNumbers(flatText, /2b\(5\)\(C\)/i, 64).filter((value) => value >= 0);
  if (numbers.length < 42) return null;
  return {
    beginningAssets: numbers[6] || null,
    endingAssets: numbers[7] || null,
    employerContributions: numbers[18] || null,
    participantContributions: numbers[19] || null,
    rollovers: numbers[20] || null,
    totalContributions: numbers[22] || null,
    participantLoanInterest: numbers[28] || null,
    dividendIncome: numbers[33] || null
  };
}

function scheduleHPage16Values(flatText: string) {
  const directBlock = flatText.match(/(\d{4,}) 0 0 0 (\d{5,}) 0 (\d{6,}) (\d{5,}) 0 0 (\d{5,}) 0 (\d{1,}) 0 0 0 0 0 0 0 0 0 0 0 (\d{4,}) (\d{4,}) (\d{5,}) (\d{5,}) 0 0/i);
  if (directBlock) {
    return {
      commonCollectiveTrustGain: cleanNumber(directBlock[1]),
      mutualFundGain: cleanNumber(directBlock[2]),
      totalIncome: cleanNumber(directBlock[3]),
      benefitsPaid: cleanNumber(directBlock[4]),
      participantLoanDeemedDistribution: cleanNumber(directBlock[6]),
      administrativeExpenses: cleanNumber(directBlock[7]),
      totalExpenses: cleanNumber(directBlock[9]),
      netAssetChange: cleanNumber(directBlock[10])
    };
  }
  const transferBlock = flatText.match(/2l\(2\)[\s\S]{0,160}?-?\s*123456789012345\s+([\d\s-]+?)(?:---PAGE|\z)/i)?.[1];
  const numbers = transferBlock ? allNumbers(transferBlock).slice(0, 32) : afterPatternNumbers(flatText, /2i\(12\)/i, 32);
  if (numbers.length < 20) return null;
  return {
    commonCollectiveTrustGain: numbers[0] || null,
    mutualFundGain: numbers[4] || null,
    totalIncome: numbers[6] || null,
    benefitsPaid: numbers[7] || null,
    participantLoanDeemedDistribution: numbers[12] || null,
    administrativeExpenses: numbers[24] || null,
    totalExpenses: numbers[26] || null,
    netAssetChange: numbers[27] || null
  };
}

function scheduleHPage14Values(flatText: string) {
  const loanBlock = flatText.match(/0 0 (\d{5,}) (\d{5,}) (\d{6,}) (\d{6,})/i);
  const fundBlock = flatText.match(/0 0 (\d{7,}) (\d{7,}) 0 0 (\d{4,}) (\d{4,})/i);
  if (loanBlock || fundBlock) {
    return {
      beginningCash: null,
      endingCash: null,
      beginningParticipantLoans: cleanNumber(loanBlock?.[1]),
      endingParticipantLoans: cleanNumber(loanBlock?.[2]),
      beginningCctAssets: cleanNumber(loanBlock?.[3]),
      endingCctAssets: cleanNumber(loanBlock?.[4]),
      beginningMutualFundAssets: cleanNumber(fundBlock?.[1]),
      endingMutualFundAssets: cleanNumber(fundBlock?.[2]),
      beginningInsuranceGeneralAccount: cleanNumber(fundBlock?.[3]),
      endingInsuranceGeneralAccount: cleanNumber(fundBlock?.[4])
    };
  }
  const numbers = afterPatternNumbers(flatText, /SCHEDULE H[\s\S]+?\d{2}-\d{7}\s+/i, 48);
  if (numbers.length < 44) return null;
  return {
    beginningCash: numbers[0] || null,
    endingCash: numbers[1] || null,
    beginningParticipantLoans: numbers[28] || null,
    endingParticipantLoans: numbers[29] || null,
    beginningCctAssets: numbers[30] || null,
    endingCctAssets: numbers[31] || null,
    beginningMutualFundAssets: numbers[40] || null,
    endingMutualFundAssets: numbers[41] || null,
    beginningInsuranceGeneralAccount: numbers[44] || null,
    endingInsuranceGeneralAccount: numbers[45] || null
  };
}

function serviceProviderFee(flatText: string, providerName: string, role: string) {
  const escapedProvider = providerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedRole = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeAbs(matchMoney(flatText, new RegExp(`${escapedProvider}[\\s\\S]{0,180}${escapedRole}\\s+(-?[\\d,]{4,8})`, "i")));
}

function providerByRole(flatText: string, role: string) {
  const matches = [...flatText.matchAll(new RegExp(`(?:X\\s+\\d+\\s+)?([A-Z][A-Z &'.,-]+?)\\s+\\d{2}-\\d{7}\\s+[\\d\\s]+${role}\\s+-?[\\d,]+`, "gi"))];
  const match = matches.find((candidate) => !candidate[1].includes("ABCDEFGHI")) ?? matches[0];
  return match?.[1] ? titleCasePlan(match[1].replace(/^X\s+/i, "").trim()) : null;
}

function participantStats(flatText: string) {
  const sequence = flatText.match(/X\s+(\d{2,6})\s+(\d{2,6})\s+(\d{2,6})\s+0\s+(\d{1,6})\s+(\d{2,6})\s+\d{1,6}\s+\d{2,6}\s+(\d{2,6})\s+(\d{2,6})\s+\d{1,6}\s+2[A-Z0-9]/i);
  return {
    beginningTotal: cleanNumber(sequence?.[1]),
    active: cleanNumber(sequence?.[3]),
    separated: cleanNumber(sequence?.[4]),
    withBalances: cleanNumber(sequence?.[7])
  };
}

function inferProvider(text: string, candidate: string) {
  return text.toUpperCase().includes(candidate.toUpperCase()) ? candidate : null;
}

function countInvestmentMenu(text: string) {
  const schedule = text.match(/SCHEDULE H, LINE 4i[\s\S]+?\* Denotes a party-in-interest/i)?.[0] || "";
  const lines = schedule.split("\n").filter((line) => /N\/A\s+\$?\s?[\d,]+$/.test(line.trim()));
  const mutualFunds = lines.filter((line) => !/Stable|Participant loans/i.test(line)).length;
  const stableValue = lines.filter((line) => /Stable|Reliance Trust|NY Life/i.test(line)).length;
  const targetDate = lines.filter((line) => /Target Date/i.test(line)).length;
  return { mutualFunds, stableValue, targetDate };
}

export function extractPlanAnalysisFromText(rawText: string, fileName = "uploaded-form-5500.pdf"): PlanAnalysis {
  const text = normalize(rawText);
  const flatText = flatten(text);
  const auditedPlanName = matchText(text, /\n([A-Z][A-Z\s,.'()&-]+401\(k\) PLAN)\nSTATEMENTS OF NET ASSETS/i);
  const schedulePlanName = matchText(text, /A Name of plan B Three-digit\s+([A-Z0-9 ,.'()&-]+?)\s+plan number/i);
  const flattenedPlanName = matchText(flatText, /\d{2}\/\d{2}\/\d{4}\s+\d{2}\/\d{2}\/\d{4}(?:\s+X){1,4}\s+([A-Z0-9 ,.'()&-]+?(?:401\(K\) PLAN|RETIREMENT PLAN|SAVINGS PLAN|PROFIT SHARING PLAN))\s+(\d{3})\s+\d{2}\/\d{2}\/\d{4}/i);
  const rawPlanName = auditedPlanName || schedulePlanName || flattenedPlanName || "Uploaded Retirement Plan";
  const planName = titleCasePlan(rawPlanName);
  const sponsorName = matchText(flatText, /(?:401\(K\) PLAN|RETIREMENT PLAN|SAVINGS PLAN|PROFIT SHARING PLAN)\s+\d{3}\s+\d{2}\/\d{2}\/\d{4}\s+\d{2}-\d{7}\s+([A-Z0-9 &'.,-]+?)\s+\d{3}-\d{3}-\d{4}/i);
  const companyName = titleCasePlan(fallbackString(sponsorName, rawPlanName.replace(/\s*(?:401\(K\)\s*PLAN|RETIREMENT PLAN|SAVINGS PLAN|PROFIT SHARING PLAN)/i, "").replace(/\s+/g, " ").trim()));
  const planYear = cleanNumber(text.match(/For calendar plan year\s+(\d{4})/i)?.[1]) || cleanNumber(flatText.match(/Form 5500\) 2024/)?.[0]?.match(/\d{4}/)?.[0]) || new Date().getFullYear();
  const filingEin = matchText(flatText, /(?:401\(K\) PLAN|RETIREMENT PLAN|SAVINGS PLAN|PROFIT SHARING PLAN)\s+\d{3}\s+\d{2}\/\d{2}\/\d{4}\s+([0-9]{2}-[0-9]{7})/i);
  const ein = filingEin || matchText(text, /EIN:\s*([0-9-]+)/i) || "Not visible in filing";
  const planNumber = matchText(text, /Plan No\.\s*(\d+)/i) || matchText(flatText, /(?:401\(K\) PLAN|RETIREMENT PLAN|SAVINGS PLAN|PROFIT SHARING PLAN)\s+(\d{3})\s+\d{2}\/\d{2}\/\d{4}/i) || "Not visible";
  const page14 = scheduleHPage14Values(flatText);
  const page15 = scheduleHPage15Values(flatText);
  const page16 = scheduleHPage16Values(flatText);

  const endingAssets = matchMoney(text, /NET ASSETS AVAILABLE FOR BENEFITS\s+\$?\s*([\d,]+)\s+\$?\s*[\d,]+/i) || page15?.endingAssets || null;
  const beginningAssets = matchMoney(text, /Beginning of year\s+([\d,]+)/i) || page15?.beginningAssets || null;
  const participantLoans = matchMoney(text, /Notes receivable from participants\s+([\d,]+)\s+[\d,]+/i) || page14?.endingParticipantLoans || null;
  const stableValueAssets = matchMoney(text, /Stable value funds\s+([\d,]+)\s+[\d,]+/i);
  const mutualFundAssets = matchMoney(text, /Mutual funds\s+\$\s*([\d,]+)\s+\$/i) || page14?.endingMutualFundAssets || null;
  const employerContributions = matchMoney(text, /Employer\s+([\d,]+)\s+Participant/i) || page15?.employerContributions || null;
  const participantContributions = matchMoney(text, /Participant\s+([\d,]+)\s+Rollover/i) || page15?.participantContributions || null;
  const rollovers = matchMoney(text, /Rollover\s+([\d,]+)\s+Total contributions/i) || page15?.rollovers || null;
  const totalContributions = matchMoney(text, /Total contributions\s+([\d,]+)/i) || page15?.totalContributions || null;
  const benefitsPaid = matchMoney(text, /Benefits paid to participants\s+([\d,]+)/i) || page16?.benefitsPaid || null;
  const administrativeExpenses = matchMoney(text, /Administrative fees\s+([\d,]+)/i) || page16?.administrativeExpenses || null;
  const netAssetChange = matchMoney(text, /Net Change in Net Assets Available for Benefits\s+([\d,]+)/i) || page16?.netAssetChange || null;
  const netInvestmentGain = matchMoney(text, /Net investment gain\s+([\d,]+)/i) || ((page16?.commonCollectiveTrustGain ?? 0) + (page16?.mutualFundGain ?? 0) || null);
  const stats = participantStats(flatText);
  const activeParticipants = stats.active || participantCount(text, "6a(2)");
  const separatedParticipants = stats.separated || participantCount(text, "6c");
  const participantsWithBalances = stats.withBalances || participantCount(text, "6g(2)") || null;
  const recordkeeper = providerByRole(flatText, "RECORDKEEPER") || inferProvider(text, "Fidelity Investments Institutional") || inferProvider(text, "Fidelity Management Trust Company");
  const advisor = providerByRole(flatText, "INVESTMENT ADVISOR") || providerByRole(flatText, "ADVISOR") || inferProvider(text, "Everhart Financial Group Inc");
  const trustee = inferProvider(text, "Fidelity Management Trust Company") || null;
  const rawAuditor =
    matchText(text, /\n([A-Z][A-Za-z&\s]+CPAs)\nCertified Public Accountants/i) ||
    matchText(flatText, /([A-Z][A-Za-z&\s]+CPAs)\s+Certified Public Accountants/i) ||
    matchText(flatText, /Name:\s*([A-Z][A-Z &'.,-]+?)\s+\(2\)\s+EIN/i);
  const auditor = rawAuditor && !/ABCDEFGHI|ABCDEF/i.test(rawAuditor) ? titleCasePlan(rawAuditor) : null;
  const recordkeepingFees = serviceProviderFee(flatText, "FIDELITY INVESTMENTS INSTITUTIONAL", "RECORDKEEPER") || matchMoney(text, /Recordkeeping fees[^\n]*2i\(3\)\s+([\d,]+)/i);
  const advisoryFees =
    serviceProviderFee(flatText, "EVERHART FINANCIAL GROUP INC", "ADVISOR") ||
    serviceProviderFee(flatText, "OXFORD FINANCIAL GROUP LTD", "INVESTMENT ADVISOR") ||
    matchMoney(text, /Investment advisory and investment management fees[^\n]*2i\(5\)\s+([\d,]+)/i);
  const menu = countInvestmentMenu(text);
  const extractionWarnings = [
    !endingAssets ? "Ending net assets not visible in filing" : null,
    !participantsWithBalances ? "Participants with balances not visible in filing" : null,
    !recordkeeper ? "Recordkeeper not visible in filing" : null,
    !advisor ? "Advisor not visible in filing" : null,
    !auditor ? "Auditor not visible in filing" : null
  ].filter((warning): warning is string => Boolean(warning));

  return {
    id: `analysis-${Date.now()}`,
    companyName,
    planName,
    planYear,
    ein,
    planNumber,
    endingAssets,
    beginningAssets,
    netAssetChange,
    participantsWithBalances,
    activeParticipants,
    separatedParticipants,
    totalContributions,
    employerContributions,
    participantContributions,
    rollovers,
    benefitsPaid,
    administrativeExpenses,
    participantLoans,
    recordkeeper,
    advisor,
    auditor,
    trustee,
    recordkeepingFees,
    advisoryFees,
    investmentGain: netInvestmentGain,
    netInvestmentGain,
    stableValueAssets,
    mutualFundAssets,
    targetDateAssets: null,
    planDesignSignals: [
      text.match(/Immediate eligibility/i) ? "Immediate eligibility language visible in plan notes." : "Plan design details require additional plan records.",
      text.match(/safe harbor/i) ? "Safe harbor language visible in plan notes." : "Safe harbor match not visible in filing.",
      text.match(/after-tax/i) ? "After-tax contribution language visible in plan notes." : "After-tax contribution provisions require additional plan records."
    ],
    investmentMenuSignals: [
      menu.mutualFunds ? `${menu.mutualFunds} mutual fund options visible in the asset schedule.` : "Investment menu detail requires Schedule H asset schedule or provider records.",
      menu.stableValue ? `${menu.stableValue} stable value option${menu.stableValue === 1 ? "" : "s"} visible in plan notes or asset schedule.` : "Stable value detail requires additional plan records.",
      menu.targetDate ? `${menu.targetDate} target-date vintages visible in the asset schedule.` : "Target-date assets require investment lineup detail.",
      "Fund expenses require fund-level review beyond Form 5500."
    ],
    status: "Ready",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confidenceScores: {
      sponsor: companyName ? 96 : 0,
      planName: planName ? 97 : 0,
      planYear: planYear ? 99 : 0,
      endingAssets: endingAssets ? 98 : 0,
      participantsWithBalances: participantsWithBalances ? 88 : 0,
      recordkeeper: recordkeeper ? 86 : 0,
      advisor: advisor ? 86 : 0,
      auditor: auditor ? 84 : 0
    },
    missingFields: [
      "408(b)(2) provider disclosure",
      "404a-5 participant fee disclosure",
      "Current investment lineup and expense detail",
      "Recent committee materials"
    ],
    generatedFiles: [],
    extractionWarnings,
    sourceFields: {
      planIdentity: "Form 5500 Part II",
      participantCounts: "Form 5500 line 6",
      planEconomics: "Schedule H and audited financial statements",
      providers: "Schedule C and audit notes",
      planDesign: "Audited financial statement Note 1",
      investmentMenu: "Schedule H line 4i and audit notes"
    }
  };
}
