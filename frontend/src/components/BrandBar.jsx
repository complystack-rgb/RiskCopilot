export const BrandBar = () => (
  <div className="flex min-w-0 items-center gap-2 sm:gap-4" data-testid="brand-bar">
    <img src="/brand/zurich-logo.png" alt="Zurich" className="h-6 sm:h-9 w-auto" data-testid="zurich-logo" />
    <div className="hidden sm:block h-8 w-px bg-slate-200" />
    <div className="flex items-center gap-1.5 sm:gap-2" data-testid="powered-by-complystack">
      <span className="whitespace-nowrap text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-slate-400">Powered by</span>
      <img src="/brand/complystack-logo.png" alt="ComplyStack" className="h-5 sm:h-7 w-auto rounded" />
    </div>
  </div>
);
