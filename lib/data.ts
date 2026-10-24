export const LAB_HOURS_REQUIRED = 50;
export const LAB_HOURS_LOGGED = 32.5;

export const CAPSTONE_DEADLINE = "April 30, 2026";

export const CURRICULUM_LINKS = {
  doeGuidelines:
    "https://docs.google.com/document/d/1oQWtigu2P0On8FMq8sUaVljGpr5_RyK9aPVHN1B8GUg/edit?usp=drive_web",
  bioremediationGuide:
    "https://docs.google.com/document/d/1Glk5x4CVzu_qN26XY0mHiz45NcVsy1994P23M-UscOI/edit?usp=drive_web",
};

export type MilestoneStatus = "completed" | "review" | "notStarted" | "locked";

export type Milestone = {
  title: string;
  status: MilestoneStatus;
  label: string;
};

export const FLAGSHIP_MILESTONES: Milestone[] = [
  { title: "Topic Selection", status: "completed", label: "Completed" },
  { title: "Research Proposal", status: "review", label: "Submitted (Under Review)" },
  { title: "Completed Project", status: "locked", label: "Locked (Awaiting Stage 2)" },
  { title: "Presentation Deck", status: "locked", label: "Locked" },
];

export const PROJECT_MILESTONES: Milestone[] = [
  { title: "Topic Selection", status: "notStarted", label: "Not Started" },
  { title: "Research Proposal", status: "locked", label: "Locked" },
  { title: "Completed Project", status: "locked", label: "Locked" },
  { title: "Presentation Deck", status: "locked", label: "Locked" },
];

export const FLAGSHIP_THEMES = [
  "Project 1: Microbes & Toxic Metal Survival",
  "Project 2: AI Prediction of Metal Removal Efficiency",
  "Project 3: Smart Water Quality Monitoring System",
  "Project 4: Drone Remote Sensing & Metal Detection",
  "Project 5: Environmental Digital Twin Development",
  "Project 6: Citizen Science Toxic Metal Mapping",
];

export const FLAGSHIP_DELIVERABLE_TYPES = [
  "AI Model & Prediction System",
  "Smart Environmental Dashboard",
  "Research Poster & Laboratory Report",
  "Mobile Monitoring App Prototype",
];

export const DOE_THEMES = [
  "A. Nuclear Waste Treatment & Disposal",
  "B. Groundwater & Soil Remediation",
  "C. Deactivation & Decommissioning (D&D)",
  "D. Long-Term Stewardship & Monitoring",
  "E. Environmental Data Science & Decision Support",
  "F. Radiological Science & Health Physics",
];

export type LabLogEntry = {
  date: string;
  location: string;
  activity: string;
  hours: number;
  status: "Approved" | "Pending Review";
};

export const LAB_LOG: LabLogEntry[] = [
  {
    date: "Oct 14, 2026",
    location: "SOE Lab 102",
    activity: "Microbial toxicity exposure test",
    hours: 4.5,
    status: "Approved",
  },
  {
    date: "Oct 17, 2026",
    location: "Pond Field Site A",
    activity: "Water sampling & IoT sensor calibration",
    hours: 3.0,
    status: "Pending Review",
  },
];

export type Course = {
  title: string;
  subtitle: string;
  bannerClass: string;
};

export const OTHER_COURSES: Course[] = [
  {
    title: "ENV POL & RISK MGNT",
    subtitle: "EVR1643_001_2233 • Spring 2026",
    bannerClass: "bg-red-700",
  },
  {
    title: "Environmental Science Research",
    subtitle: "EVR-4900 • Spring 2026",
    bannerClass: "bg-emerald-700",
  },
];
