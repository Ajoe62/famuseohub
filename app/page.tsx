import CapstoneHub from "@/components/capstone/CapstoneHub";
import CurriculumLinks from "@/components/capstone/CurriculumLinks";
import LabHoursPanel from "@/components/capstone/LabHoursPanel";
import LabHoursSummary from "@/components/capstone/LabHoursSummary";
import MilestoneProgress from "@/components/capstone/MilestoneProgress";
import StageCard from "@/components/capstone/StageCard";
import TrackChooser from "@/components/capstone/TrackChooser";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import { db } from "@/db";
import { requireActor } from "@/lib/auth/session";
import { TRACKS } from "@/lib/curriculum";
import { getStudentOverview } from "@/lib/services/student";
import { faAward, faClock } from "@/lib/icons";

export default async function StudentHubPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const actor = await requireActor("student");
  const [overview, { tab }] = await Promise.all([getStudentOverview(db, actor.membershipId), searchParams]);
  const track = overview.membership.track;

  const capstonePanel = (
    <>
      {track && (
        <MilestoneProgress heading={`${TRACKS[track].name} · Milestone Progression`} stages={overview.stages} />
      )}
      {(!track || overview.canChangeTrack) && <TrackChooser current={track} />}
      {track && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {overview.stages.map((row) => (
            <StageCard key={row.id} row={row} track={track} editable />
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      <Header title="FAMU-SOE Capstone and Lab Hub" />
      <LabHoursSummary hours={overview.hours} />
      <CurriculumLinks />
      <CapstoneHub
        initial={tab}
        tabs={[
          {
            key: "capstone",
            label: (
              <>
                <Icon icon={faAward} className="mr-1.5" /> {track ? TRACKS[track].name : "Capstone Track"}
              </>
            ),
            panel: capstonePanel,
          },
          {
            key: "lab",
            label: (
              <>
                <Icon icon={faClock} className="mr-1.5" /> Log Lab Hours ({overview.hours.required} Hrs Required)
              </>
            ),
            panel: <LabHoursPanel overview={overview} />,
          },
        ]}
      />
    </>
  );
}
