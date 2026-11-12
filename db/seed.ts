import type { DB } from "./index";
import { courses, labLogs, memberships, milestones, notifications, reviews, submissions, users } from "./schema";

/**
 * Fictional sample data for development and demos. Never put real student records here.
 * Scenario: one advisor with a student mid-way through the Flagship track, a second
 * advisor with a Project-track student, and an unassigned student who hasn't started.
 */
export async function seed(db: DB) {
  await db.transaction(async (tx) => {
    const [course] = await tx
      .insert(courses)
      .values({ title: "SOE Capstone & Lab Hub (Sandbox)", term: "Spring 2027", requiredHours: 50, deadline: "2027-04-30" })
      .returning();

    const [grant, hale, jordan, avery, taylor] = await tx
      .insert(users)
      .values([
        { name: "Dr. Casey Grant" },
        { name: "Dr. Robin Hale" },
        { name: "Jordan Rivers" },
        { name: "Avery Chen" },
        { name: "Taylor Brooks" },
      ])
      .returning();

    const [grantM, haleM] = await tx
      .insert(memberships)
      .values([
        { userId: grant.id, courseId: course.id, role: "advisor" },
        { userId: hale.id, courseId: course.id, role: "advisor" },
      ])
      .returning();

    const [jordanM, averyM] = await tx
      .insert(memberships)
      .values([
        { userId: jordan.id, courseId: course.id, role: "student", track: "flagship", advisorId: grantM.id },
        { userId: avery.id, courseId: course.id, role: "student", track: "project", advisorId: haleM.id },
        { userId: taylor.id, courseId: course.id, role: "student" },
      ])
      .returning();

    // Jordan: stage 1 approved, stage 2 awaiting review.
    const jordanStages = await tx
      .insert(milestones)
      .values([
        { membershipId: jordanM.id, stage: 1, status: "approved" },
        { membershipId: jordanM.id, stage: 2, status: "submitted" },
        { membershipId: jordanM.id, stage: 3, status: "locked" },
        { membershipId: jordanM.id, stage: 4, status: "locked" },
      ])
      .returning();
    const [topic] = await tx
      .insert(submissions)
      .values({ milestoneId: jordanStages[0].id, data: { theme: "Project 1: Microbes & Toxic Metal Survival" } })
      .returning();
    await tx.insert(submissions).values({
      milestoneId: jordanStages[1].id,
      data: {
        problemStatement:
          "Heavy-metal runoff into campus retention ponds threatens aquatic life. We will test which native microbes survive and sequester cadmium and lead.",
        deliverableType: "Research Poster & Laboratory Report",
        methodology:
          "Culture pond isolates under graded Cd/Pb exposure, measure survival and uptake by ICP-MS, and compare strains statistically in R.",
      },
    });
    await tx.insert(reviews).values({
      reviewerId: grantM.id,
      targetType: "submission",
      targetId: topic.id,
      decision: "approved",
      comment: "Great fit for the flagship lab. Approved.",
    });

    // Avery: Project track, stage 1 open.
    await tx.insert(milestones).values([
      { membershipId: averyM.id, stage: 1, status: "open" },
      { membershipId: averyM.id, stage: 2, status: "locked" },
      { membershipId: averyM.id, stage: 3, status: "locked" },
      { membershipId: averyM.id, stage: 4, status: "locked" },
    ]);

    const approvedLogs = await tx
      .insert(labLogs)
      .values([
        { membershipId: jordanM.id, date: "2026-09-08", hours: 4, location: "SOE Lab 102", activity: "Lab safety orientation and culture media prep", status: "approved" },
        { membershipId: jordanM.id, date: "2026-09-15", hours: 5, location: "SOE Lab 102", activity: "Isolated microbial strains from pond samples", status: "approved" },
        { membershipId: jordanM.id, date: "2026-09-29", hours: 4.5, location: "Pond Field Site A", activity: "Water and sediment sampling", status: "approved" },
        { membershipId: jordanM.id, date: "2026-10-06", hours: 5, location: "SOE Lab 102", activity: "Cadmium exposure trial, round 1", status: "approved" },
        { membershipId: jordanM.id, date: "2026-10-14", hours: 4.5, location: "SOE Lab 102", activity: "Microbial toxicity exposure test", status: "approved" },
        { membershipId: jordanM.id, date: "2026-10-27", hours: 5, location: "SOE Lab 204", activity: "ICP-MS sample preparation", status: "approved" },
      ])
      .returning();
    await tx.insert(reviews).values(
      approvedLogs.map((l) => ({ reviewerId: grantM.id, targetType: "lab_log" as const, targetId: l.id, decision: "approved" as const })),
    );

    const [returned] = await tx
      .insert(labLogs)
      .values({ membershipId: jordanM.id, date: "2026-11-02", hours: 2, location: "Library", activity: "Literature review", status: "returned" })
      .returning();
    await tx.insert(reviews).values({
      reviewerId: grantM.id,
      targetType: "lab_log",
      targetId: returned.id,
      decision: "returned",
      comment: "Literature review doesn't count toward lab hours. Please log hands-on lab or field work only.",
    });

    await tx.insert(labLogs).values([
      { membershipId: jordanM.id, date: "2026-11-09", hours: 3, location: "Pond Field Site A", activity: "Water sampling & IoT sensor calibration" },
      { membershipId: averyM.id, date: "2026-11-05", hours: 4, location: "SOE Lab 204", activity: "Soil column setup for groundwater remediation test" },
    ]);

    await tx.insert(notifications).values([
      { membershipId: grantM.id, message: "Jordan Rivers submitted Stage 2: Research Proposal.", href: "/advisor" },
      { membershipId: grantM.id, message: "Jordan Rivers logged 3 lab hours for verification.", href: "/advisor" },
      { membershipId: haleM.id, message: "Avery Chen logged 4 lab hours for verification.", href: "/advisor" },
      { membershipId: jordanM.id, message: "Stage 1: Topic Selection was approved. Stage 2 is now unlocked.", href: "/" },
    ]);
  });
}
