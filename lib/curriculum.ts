// Static program content. Per-student and per-course data lives in the database.

export type Track = "flagship" | "project";
export type Stage = 1 | 2 | 3 | 4;

export const STAGES: readonly Stage[] = [1, 2, 3, 4];

export const STAGE_TITLES: Record<Stage, string> = {
  1: "Topic Selection",
  2: "Research Proposal",
  3: "Completed Project",
  4: "Presentation Deck",
};

export const TRACKS: Record<Track, { name: string; description: string }> = {
  flagship: {
    name: "Flagship Capstone Track",
    description: "Faculty-led bioremediation research on toxic metals, AI, sensing, and digital twins.",
  },
  project: {
    name: "Project Capstone Track",
    description: "Independent project aligned with a DOE Environmental Management theme.",
  },
};

export const THEMES: Record<Track, readonly string[]> = {
  flagship: [
    "Project 1: Microbes & Toxic Metal Survival",
    "Project 2: AI Prediction of Metal Removal Efficiency",
    "Project 3: Smart Water Quality Monitoring System",
    "Project 4: Drone Remote Sensing & Metal Detection",
    "Project 5: Environmental Digital Twin Development",
    "Project 6: Citizen Science Toxic Metal Mapping",
  ],
  project: [
    "A. Nuclear Waste Treatment & Disposal",
    "B. Groundwater & Soil Remediation",
    "C. Deactivation & Decommissioning (D&D)",
    "D. Long-Term Stewardship & Monitoring",
    "E. Environmental Data Science & Decision Support",
    "F. Radiological Science & Health Physics",
  ],
};

export const FLAGSHIP_DELIVERABLE_TYPES = [
  "AI Model & Prediction System",
  "Smart Environmental Dashboard",
  "Research Poster & Laboratory Report",
  "Mobile Monitoring App Prototype",
] as const;

export const CURRICULUM_LINKS = {
  doeGuidelines:
    "https://docs.google.com/document/d/1oQWtigu2P0On8FMq8sUaVljGpr5_RyK9aPVHN1B8GUg/edit?usp=drive_web",
  bioremediationGuide:
    "https://docs.google.com/document/d/1Glk5x4CVzu_qN26XY0mHiz45NcVsy1994P23M-UscOI/edit?usp=drive_web",
};

/** Lab-hour entry limits, shared by client hints and server validation. */
export const LAB_HOURS_MIN = 0.5;
export const LAB_HOURS_MAX = 10;
export const LAB_HOURS_STEP = 0.5;
