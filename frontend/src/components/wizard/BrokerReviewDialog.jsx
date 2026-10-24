import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const KEY = "complystack_last_lead";

export const BrokerReviewDialog = ({ open, onOpenChange, data, engine }) => {
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(() => JSON.parse(localStorage.getItem(KEY) || "null"));
  const result = done?.business === data.businessName ? done : null;

  useEffect(() => {
    if (open && result) api.get(`/cases/${result.case_id}`).catch(() => { localStorage.removeItem(KEY); setDone(null); });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setBusy(true);
    try {
      const assessment = { overall: engine.exposure.overall, areas: engine.exposure.areas.map(({ id, label, score, level }) => ({ id, label, score, level })), narrative: engine.narrative.narrative };
      const { data: r } = await api.post("/cases", { journey: data, assessment, contact_name: contact.name, contact_phone: contact.phone });
      const saved = { ...r, business: data.businessName };
      localStorage.setItem(KEY, JSON.stringify(saved)); setDone(saved); toast.success("Broker review requested");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="broker-review-dialog">
        {result ? (
          <div className="text-center" data-testid="broker-review-success">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Icons.CheckCircle2 className="h-6 w-6" /></span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Your broker review is booked</h3>
            <p className="mt-1 text-sm text-slate-500">A Zurich partner will call you within 72 hours. Your answers and evidence have already been shared with them, so you won't need to repeat anything.</p>
            <dl className="mt-5 grid grid-cols-2 gap-2 text-left text-xs">
              {[["Reference", result.lead_id], ["Assigned partner", result.distributor], ["Your advisor", result.agent || "Being assigned"], ["Call back by", new Date(result.sla_due).toLocaleDateString("en-IN", { day: "numeric", month: "short" })]].map(([k, v]) => (
                <div key={k} className="rounded-md border border-slate-200 p-2.5"><dt className="text-[10px] uppercase tracking-wider text-slate-400">{k}</dt><dd className="mt-0.5 font-semibold text-slate-900" data-testid={`review-${k.toLowerCase().replace(/\s+/g, "-")}`}>{v}</dd></div>
              ))}
            </dl>
            <Link to={`/console/cases/${result.case_id}`} data-testid="open-in-console" className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline">Demo: see what the broker sees <Icons.ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        ) : (
          <>
            <DialogHeader><DialogTitle>Request a broker review</DialogTitle><DialogDescription>We'll send your summary and evidence to an authorised Zurich distribution partner near you.</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <Input data-testid="contact-name-input" placeholder="Your name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              <Input data-testid="contact-phone-input" placeholder="Mobile number" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              <Button data-testid="broker-review-submit" disabled={busy || !contact.name || contact.phone.replace(/\D/g, "").length < 10} onClick={submit} className="w-full">{busy ? <Icons.Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Icons.Send className="mr-1.5 h-4 w-4" />}Send to a broker</Button>
              <p className="text-[11px] text-slate-400">Only the assigned partner and Zurich can see your details.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
