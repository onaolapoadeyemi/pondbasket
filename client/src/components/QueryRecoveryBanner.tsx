import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

export function QueryRecoveryBanner() {
  const client = useQueryClient(); const [, redraw] = useState(0); const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => client.getQueryCache().subscribe(() => redraw(value => value + 1)), [client]);
  const failed = client.getQueryCache().getAll().find(query => query.state.status === "error"); const key = failed ? JSON.stringify(failed.queryKey) : null;
  if (!failed || dismissed === key) return null;
  const message = failed.state.error instanceof Error ? failed.state.error.message : "A protected PondBasket data request could not be completed.";
  return <div className="fixed inset-x-3 bottom-5 z-50 mx-auto max-w-xl rounded-2xl border border-[#c85535]/25 bg-white p-4 shadow-[0_16px_42px_rgba(9,43,42,.18)]"><div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f9d8ce]"><CircleAlert className="h-4 w-4 text-[#9c3b24]" /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#092b2a]">This view needs a retry.</p><p className="mt-1 text-xs leading-5 text-[#52716c]">{message}</p><button onClick={() => { setDismissed(null); client.refetchQueries({ queryKey: failed.queryKey }); }} className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#0b4f4a] px-3 py-1.5 text-xs font-bold text-white"><RotateCcw className="h-3.5 w-3.5" />Retry securely</button></div><button onClick={() => setDismissed(key)} className="h-fit rounded-full p-1 text-[#52716c]" aria-label="Dismiss recovery message"><X className="h-4 w-4" /></button></div></div>;
}
