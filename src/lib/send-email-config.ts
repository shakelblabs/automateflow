import type { NodeConfigValues } from "@/lib/node-definitions";

export type SendEmailTemplateField =
  | "templateId"
  | "aTemplateId"
  | "bTemplateId";

/** v1 Send Email stored mode + inline content fields instead of templateId. */
export function isV1SendEmailConfig(config: NodeConfigValues): boolean {
  if (config.mode != null) return true;
  if (config.templateId) return false;
  return (
    config.subject != null ||
    config.body != null ||
    config.aiPrompt != null ||
    config.aiTone != null
  );
}

/** v1 A/B variant stored mode + inline content instead of *TemplateId (v2 §3.1). */
export function isV1AbVariantConfig(
  config: NodeConfigValues,
  variant: "a" | "b",
): boolean {
  const prefix = variant;
  const templateField = `${prefix}TemplateId` as const;
  if (config[`${prefix}Mode`] != null) return true;
  if (config[templateField]) return false;
  return (
    config[`${prefix}Subject`] != null ||
    config[`${prefix}Body`] != null ||
    config[`${prefix}Prompt`] != null ||
    config[`${prefix}Tone`] != null
  );
}

function isV1TemplateField(
  config: NodeConfigValues,
  field: SendEmailTemplateField,
): boolean {
  if (field === "templateId") return isV1SendEmailConfig(config);
  if (field === "aTemplateId") return isV1AbVariantConfig(config, "a");
  return isV1AbVariantConfig(config, "b");
}

/** Read-time template id — v1-shaped configs are treated as unmigrated (v2 §3.1). */
export function getEffectiveTemplateId(
  config: NodeConfigValues,
  field: SendEmailTemplateField = "templateId",
): string | undefined {
  if (isV1TemplateField(config, field)) return undefined;
  const id = config[field];
  return typeof id === "string" && id.length > 0 ? id : undefined;
}
