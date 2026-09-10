import { z } from "zod";

/**
 * Triad Selector Hierarchy:
 * 1. Primary: Accessible Name & ARIA Role (getByRole('button', { name: 'Deploy Model' }))
 * 2. Secondary: Stable test or debug ID ([data-test-id='mg-deploy-btn'])
 * 3. Fallback: Normalized spatial bounding-box [ymin, xmin, ymax, xmax] (0 to 1000)
 * FORBIDDEN: Angular generated classes (.mat-mdc-button-base-...)
 */
export const TriadSelectorSchema = z.object({
  primary: z.object({
    role: z.string(),
    name: z.string(),
    exact: z.boolean().default(true)
  }),
  secondary: z.object({
    testId: z.string()
  }).optional(),
  fallback: z.object({
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]) // [ymin, xmin, ymax, xmax] in 0..1000 space
  }).optional()
});

export const ConditionGateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("network_idle"),
    timeoutMs: z.number().default(5000)
  }),
  z.object({
    type: z.literal("selector_visible"),
    selector: z.string(),
    timeoutMs: z.number().default(5000)
  }),
  z.object({
    type: z.literal("dom_mutation"),
    targetSelector: z.string(),
    timeoutMs: z.number().default(5000)
  })
]);

export const TraceStepSchema = z.object({
  id: z.string(),
  index: z.number(),
  act: z.enum(["act1_cold_open", "act2_whiteboard", "act3_live_console", "act4_chaos_debug", "act5_checklist"]),
  intent: z.string(),
  action: z.enum([
    "navigate",
    "click",
    "type",
    "hover",
    "select",
    "wait_condition",
    "clear_input",
    "press_key"
  ]),
  targetUrl: z.string().optional(),
  selector: TriadSelectorSchema.optional(),
  textValue: z.string().optional(),
  key: z.string().optional(),
  conditionGate: ConditionGateSchema.optional(),
  dwellTimeMs: z.number().default(150),
  redactPii: z.boolean().default(false),
  cameraFocus: z.boolean().default(true)
});

export const StepTraceSchema = z.object({
  $schema: z.string().optional(),
  traceId: z.string(),
  topicId: z.string(),
  version: z.string().default("2.0.0"),
  targetConsole: z.enum(["gcp", "aws", "azure", "salesforce", "servicenow"]).default("gcp"),
  viewport: z.object({
    width: z.number().default(1920),
    height: z.number().default(1080),
    deviceScaleFactor: z.number().default(2)
  }),
  steps: z.array(TraceStepSchema)
});

export type TriadSelector = z.infer<typeof TriadSelectorSchema>;
export type ConditionGate = z.infer<typeof ConditionGateSchema>;
export type TraceStep = z.infer<typeof TraceStepSchema>;
export type StepTrace = z.infer<typeof StepTraceSchema>;
