export const BrandBar = ({ compact }) => (
  <div className="flex min-w-0 items-center gap-2.5 sm:gap-4" data-testid="brand-bar">
    <img src="/brand/abc-logo.png" alt="ABC Insure" className="h-7 sm:h-9 w-auto" data-testid="insurer-logo" />
    {!compact && <div className="hidden sm:block h-8 w-px bg-slate-200" />}
    <div className="flex items-center gap-1.5 sm:gap-2" data-testid="powered-by-complystack">
      <span className="hidden sm:inline whitespace-nowrap text-[10px] font-medium uppercase tracking-widest text-slate-400">Powered by</span>
      <img src="/brand/complystack-logo-dark.png" alt="ComplyStack" className="h-3.5 sm:h-5 w-auto" data-testid="complystack-logo" />
    </div>
  </div>
);
