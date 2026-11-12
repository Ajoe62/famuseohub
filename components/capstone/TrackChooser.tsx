import { chooseTrackAction } from "@/app/actions";
import { TRACKS, type Track } from "@/lib/curriculum";
import { faAward, faDiagramProject } from "@/lib/icons";
import Icon from "../Icon";
import ActionForm, { SubmitButton } from "../ui/ActionForm";

const ICONS: Record<Track, typeof faAward> = { flagship: faAward, project: faDiagramProject };

export default function TrackChooser({ current }: { current: Track | null }) {
  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
      <div>
        <h3 className="font-bold text-slate-900 text-sm">{current ? "Change your capstone track" : "Choose your capstone track"}</h3>
        <p className="text-xs text-slate-500">
          {current
            ? "You can switch until you submit Stage 1. Switching resets your stages."
            : "Pick the track you're enrolled in. You can switch until you submit Stage 1."}
        </p>
      </div>
      <ActionForm id="track" action={chooseTrackAction} resetOnSuccess={false} className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(TRACKS) as Track[]).map((track) => (
          <SubmitButton
            key={track}
            name="track"
            value={track}
            pendingLabel="Saving…"
            className={`text-left rounded-xl border p-4 transition-colors ${
              current === track ? "border-canvas-sidebar bg-emerald-50" : "border-canvas-border hover:border-canvas-orange hover:bg-orange-50"
            }`}
          >
            <span className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Icon icon={ICONS[track]} className="text-canvas-orange" /> {TRACKS[track].name}
              {current === track && <span className="text-[10px] font-bold text-canvas-sidebar">(current)</span>}
            </span>
            <span className="block text-xs text-slate-600 mt-1">{TRACKS[track].description}</span>
          </SubmitButton>
        ))}
      </ActionForm>
    </section>
  );
}
