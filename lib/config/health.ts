import { capabilityRequirements, missingForCapability, type Capability } from "./env";

export type CapabilityReport = Record<Capability, { ok: boolean; missing: string[] }>;

/** Which capabilities are configured, naming missing env vars but never values. */
export function buildCapabilityReport(
  source: Record<string, string | undefined>,
): CapabilityReport {
  const capabilities = Object.keys(capabilityRequirements) as Capability[];
  return capabilities.reduce<CapabilityReport>((report, capability) => {
    const missing = missingForCapability(capability, source);
    report[capability] = { ok: missing.length === 0, missing };
    return report;
  }, {} as CapabilityReport);
}
