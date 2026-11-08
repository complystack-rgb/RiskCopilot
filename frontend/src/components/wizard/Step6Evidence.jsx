import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, WhyThisMatters, FieldLabel, UploadField, RewardCard } from "./shared";
import { Input } from "@/components/ui/input";
import * as Icons from "lucide-react";
import { getMarket } from "@/data/markets";

export default function Step6Evidence() {
  const { data, update } = useJourney();
  const md = data.machineryDetails;
  const setMd = (patch) => update({ machineryDetails: { ...md, ...patch } });
  const setList = (key) => (v) => update((prev) => ({ [key]: typeof v === "function" ? v(prev[key]) : v }));
  const totalFiles = data.premisesMedia.length + data.machineryPhotos.length + data.evidencePolicyDocs.length;

  return (
    <div className="space-y-6">
      <SectionHeader title="Photos and Documents" lead="Optional. A walkthrough video and machine photos help your partner prepare for the visit." />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><Icons.Video className="h-4 w-4 text-blue-600" /> Premises Walkthrough</p>
        <p className="mb-3 text-xs text-slate-500">A short video or photos of your premises.</p>
        <UploadField accept=".mp4,.mov,.jpg,.png" multiple kind="media" testid="premises-media-upload"
          files={data.premisesMedia} onChange={setList("premisesMedia")} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><Icons.Cog className="h-4 w-4 text-blue-600" /> Machinery and Assets</p>
        <p className="mb-3 text-xs text-slate-500">Photos and details of your key equipment.</p>
        <UploadField accept=".jpg,.png" multiple kind="machinery" testid="machinery-photos-upload"
          files={data.machineryPhotos} onChange={setList("machineryPhotos")} />
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Input data-testid="asset-name" placeholder="Asset Name" value={md.name} onChange={(e) => setMd({ name: e.target.value })} />
          <Input data-testid="asset-manufacturer" placeholder="Manufacturer" value={md.manufacturer} onChange={(e) => setMd({ manufacturer: e.target.value })} />
          <Input data-testid="asset-model" placeholder="Model" value={md.model} onChange={(e) => setMd({ model: e.target.value })} />
          <Input data-testid="asset-serial" placeholder="Serial Number" value={md.serial} onChange={(e) => setMd({ serial: e.target.value })} />
          <Input data-testid="asset-quantity" placeholder="Quantity" value={md.quantity} onChange={(e) => setMd({ quantity: e.target.value })} />
          <Input data-testid="asset-location" placeholder="Location" value={md.location} onChange={(e) => setMd({ location: e.target.value })} />
          <Input data-testid="asset-year" placeholder="Year" value={md.year} onChange={(e) => setMd({ year: e.target.value })} />
          <Input data-testid="asset-replacement" placeholder={`Replacement Value (${getMarket(data.market).currency})`} value={md.replacementValue} onChange={(e) => setMd({ replacementValue: e.target.value })} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><Icons.FileText className="h-4 w-4 text-blue-600" /> Existing Policy</p>
        <p className="mb-3 text-xs text-slate-500">Your current policy schedule, if available.</p>
        <UploadField accept=".pdf" multiple kind="policy" testid="evidence-policy-upload"
          files={data.evidencePolicyDocs} onChange={setList("evidencePolicyDocs")} />
      </div>

      <WhyThisMatters testid="step6-why">
        You can skip this step and share files later with your partner.
      </WhyThisMatters>

      {totalFiles > 0 && (
        <RewardCard title="Files Received" testid="reward-evidence">
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-center gap-2"><Icons.Video className="h-4 w-4 text-slate-400" /> Premises media: {data.premisesMedia.length}</li>
            <li className="flex items-center gap-2"><Icons.Cog className="h-4 w-4 text-slate-400" /> Machinery photos: {data.machineryPhotos.length}</li>
            <li className="flex items-center gap-2"><Icons.FileText className="h-4 w-4 text-slate-400" /> Policy documents: {data.evidencePolicyDocs.length}</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">Files are shared only with your assigned partner.</p>
        </RewardCard>
      )}
    </div>
  );
}
