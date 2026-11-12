import { z } from "zod";
import {
  FLAGSHIP_DELIVERABLE_TYPES,
  LAB_HOURS_MAX,
  LAB_HOURS_MIN,
  LAB_HOURS_STEP,
  THEMES,
  type Stage,
  type Track,
} from "../curriculum";

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(min, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

const httpUrl = (label: string) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .pipe(z.url({ protocol: /^https?$/, error: `${label} must be a valid http(s) link.` }));

const optionalHttpUrl = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.url({ protocol: /^https?$/, error: `${label} must be a valid http(s) link.` }).optional());

/** Field schema for each stage of each track. Stored as the submission's JSON `data`. */
export function stageSchema(track: Track, stage: Stage) {
  switch (stage) {
    case 1:
      return z.object({
        theme: z.enum(THEMES[track] as [string, ...string[]], { error: "Choose a theme from the list." }),
      });
    case 2:
      return track === "flagship"
        ? z.object({
            problemStatement: text("Problem statement", 20, 3000),
            deliverableType: z.enum(FLAGSHIP_DELIVERABLE_TYPES, { error: "Choose a deliverable type." }),
            methodology: text("Methodology", 20, 3000),
          })
        : z.object({ problemStatement: text("Problem statement", 20, 3000) });
    case 3:
      return track === "flagship"
        ? z.object({
            reportUrl: httpUrl("Report link"),
            repoUrl: optionalHttpUrl("Repository link"),
            executiveSummary: z.string().trim().max(3000).optional(),
          })
        : z.object({ reportUrl: httpUrl("Report link") });
    case 4:
      return z.object({ slidesUrl: httpUrl("Presentation slides link") });
  }
}

/** Today's date (YYYY-MM-DD) in the program's timezone (FAMU is in Tallahassee). */
export function todayInProgramTz(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

export function labLogSchema(today = todayInProgramTz()) {
  return z.object({
    date: z
      .string({ error: "Date is required." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required.")
      .refine((d) => !Number.isNaN(Date.parse(d)), "Enter a valid date.")
      .refine((d) => d <= today, "Lab hours can't be logged for a future date."),
    hours: z.coerce
      .number({ error: "Hours must be a number." })
      .min(LAB_HOURS_MIN, `Log at least ${LAB_HOURS_MIN} hours.`)
      .max(LAB_HOURS_MAX, `A single entry can't exceed ${LAB_HOURS_MAX} hours.`)
      .refine((h) => Number.isInteger(h / LAB_HOURS_STEP), `Hours must be in ${LAB_HOURS_STEP}-hour increments.`),
    location: text("Location", 2, 120),
    activity: text("Activity description", 5, 1000),
  });
}

export const reviewSchema = z
  .object({
    decision: z.enum(["approved", "revision", "returned"]),
    comment: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.decision === "approved" || (v.comment && v.comment.length > 0), {
    path: ["comment"],
    message: "Add a comment explaining what needs to change.",
  });

/** Result shape every form action returns. */
export type ActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) out[key] = value;
  }
  return out;
}

export function validationFailure(error: z.ZodError): ActionResult {
  return {
    ok: false,
    message: "Please fix the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}
