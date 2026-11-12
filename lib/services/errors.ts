/** An expected, user-facing failure (bad state, not allowed). Message is safe to show. */
export class ServiceError extends Error {
  constructor(
    message: string,
    readonly code: "forbidden" | "not_found" | "conflict" | "invalid" = "invalid",
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export type Actor = {
  membershipId: string;
  userId: string;
  courseId: string;
  role: "student" | "advisor";
};

export function requireRole(actor: Actor, role: Actor["role"]) {
  if (actor.role !== role) throw new ServiceError(`Only ${role}s can do that.`, "forbidden");
}
