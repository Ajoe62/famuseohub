import Link from "next/link";
import AdvisorQueue from "@/components/capstone/AdvisorQueue";
import CapstoneHub from "@/components/capstone/CapstoneHub";
import CurriculumLinks from "@/components/capstone/CurriculumLinks";
import FlagshipPanel from "@/components/capstone/FlagshipPanel";
import LabHoursPanel from "@/components/capstone/LabHoursPanel";
import LabHoursSummary from "@/components/capstone/LabHoursSummary";
import ProjectPanel from "@/components/capstone/ProjectPanel";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import { faAward, faClock, faDiagramProject } from "@/lib/icons";

export default function CapstonePage() {
  return (
    <>
      <Header title="FAMU-SOE Capstone and Lab Hub" />

      <div className="space-y-6">
        <nav className="text-xs text-slate-500 flex items-center space-x-2">
          <Link href="/" className="hover:underline text-canvas-sidebar font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-800">FAMU-SOE Capstone and Lab Hub</span>
        </nav>

        <LabHoursSummary />
        <CurriculumLinks />
        <CapstoneHub
          tabs={[
            {
              label: <><Icon icon={faAward} className="mr-1.5" /> Flagship Capstone Track</>,
              panel: <FlagshipPanel />,
            },
            {
              label: <><Icon icon={faDiagramProject} className="mr-1.5" /> Project Capstone Track</>,
              panel: <ProjectPanel />,
            },
            {
              label: <><Icon icon={faClock} className="mr-1.5" /> Log Lab Hours (50 Hrs Required)</>,
              panel: <LabHoursPanel />,
            },
          ]}
          advisor={<AdvisorQueue />}
        />
      </div>
    </>
  );
}
