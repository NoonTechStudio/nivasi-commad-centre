export const PageLoader = () => (
  <div className="min-h-96 flex flex-col items-center justify-center gap-3">
    <div className="h-10 w-10 animate-spin rounded-full border-[2.5px] border-blue-100 border-t-blue-600" />
    <p className="text-sm font-medium text-gray-400">Loading…</p>
  </div>
);
