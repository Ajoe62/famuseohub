// LTI 1.3 claim names and pure helpers (no I/O). Spec: https://www.imsglobal.org/spec/lti/v1p3

export const CLAIM = {
  messageType: "https://purl.imsglobal.org/spec/lti/claim/message_type",
  version: "https://purl.imsglobal.org/spec/lti/claim/version",
  deploymentId: "https://purl.imsglobal.org/spec/lti/claim/deployment_id",
  targetLinkUri: "https://purl.imsglobal.org/spec/lti/claim/target_link_uri",
  roles: "https://purl.imsglobal.org/spec/lti/claim/roles",
  context: "https://purl.imsglobal.org/spec/lti/claim/context",
  resourceLink: "https://purl.imsglobal.org/spec/lti/claim/resource_link",
  custom: "https://purl.imsglobal.org/spec/lti/claim/custom",
} as const;

export type LaunchClaims = {
  iss: string;
  sub: string;
  aud: string | string[];
  azp?: string;
  nonce?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  [CLAIM.messageType]?: string;
  [CLAIM.version]?: string;
  [CLAIM.deploymentId]?: string;
  [CLAIM.roles]?: string[];
  [CLAIM.context]?: { id?: string; title?: string; label?: string };
  [CLAIM.custom]?: Record<string, string>;
};

const MEMBERSHIP = "http://purl.imsglobal.org/vocab/lis/v2/membership";

/**
 * Maps LTI context roles to app roles. Only course (membership) roles count. Institution roles
 * such as "Administrator" don't grant advisor access to a course they aren't teaching.
 *   Instructor, Teaching Assistant, Content Developer, course Administrator → advisor
 *   Learner → student
 *   anything else (e.g. Observer/Mentor) → null (not allowed)
 */
export function appRoleFromLti(roles: readonly string[] | undefined): "advisor" | "student" | null {
  if (!roles?.length) return null;
  const isAny = (...names: string[]) => roles.some((r) => names.includes(r));
  if (
    isAny(
      `${MEMBERSHIP}#Instructor`,
      `${MEMBERSHIP}/Instructor#TeachingAssistant`,
      `${MEMBERSHIP}#ContentDeveloper`,
      `${MEMBERSHIP}#Administrator`,
    ) ||
    roles.some((r) => r.startsWith(`${MEMBERSHIP}/Instructor#`))
  ) {
    return "advisor";
  }
  if (isAny(`${MEMBERSHIP}#Learner`) || roles.some((r) => r.startsWith(`${MEMBERSHIP}/Learner#`))) return "student";
  return null;
}

/** Best display name from the claims. With Canvas's "Name only" privacy level, `name` is present. */
export function displayName(c: LaunchClaims): string {
  const full = c.name?.trim() || [c.given_name, c.family_name].filter(Boolean).join(" ").trim();
  return full || "Canvas user";
}

/** Reasons a launch can fail. Codes are shown to users; details go to server logs only. */
export type LaunchErrorCode =
  | "unknown_platform"
  | "unknown_deployment"
  | "invalid_state"
  | "invalid_token"
  | "unsupported_message"
  | "missing_context"
  | "role_not_allowed"
  | "platform_error";

export const LAUNCH_ERROR_MESSAGES: Record<LaunchErrorCode, string> = {
  unknown_platform: "This Canvas instance isn't registered with the Capstone Hub. Contact your Canvas administrator.",
  unknown_deployment: "This installation of the Capstone Hub isn't registered yet. Contact your Canvas administrator.",
  invalid_state: "The launch expired or was already used. Go back to Canvas and open the Capstone Hub again.",
  invalid_token: "Canvas's launch message couldn't be verified. Go back to Canvas and try again.",
  unsupported_message: "This type of Canvas link isn't supported. Open the Capstone Hub from the course navigation.",
  missing_context: "Open the Capstone Hub from inside a course.",
  role_not_allowed: "The Capstone Hub is available to students and instructors of this course only.",
  platform_error: "Canvas reported a problem starting the launch. Go back to Canvas and try again.",
};

export class LaunchError extends Error {
  constructor(
    readonly code: LaunchErrorCode,
    detail: string,
  ) {
    super(detail);
    this.name = "LaunchError";
  }
}
