import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

type RecoveryFailure = { key: string; message: string; queryKey: readonly unknown[] } | null;

export function getRecoveryFailure(client: ReturnType<typeof useQueryClient>): RecoveryFailure {
  const failed = client.getQueryCache().getAll().find(query => query.state.status === "error");
  if (!failed) return null;
  return {
    key: JSON.stringify(failed.queryKey),
    message: failed.state.error instanceof Error ? failed.state.error.message : "A protected PondBasket data request could not be completed.",
    queryKey: failed.queryKey,
  };
}

export function QueryRecoveryBanner() {
  const client = useQueryClient();
  const [failure, setFailure] = useState<RecoveryFailure>(() => getRecoveryFailure(client));
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let scheduled = false;
    const syncFailure = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        if (!active) return;
        const next = getRecoveryFailure(client);
        setFailure(previous => previous?.key === next?.key && previous?.message === next?.message ? previous : next);
      });
    };
    syncFailure();
    const unsubscribe = client.getQueryCache().subscribe(syncFailure);
    return () => { active = false; unsubscribe(); };
  }, [client]);

  if (!failure || dismissed === failure.key) return null;
  return <div className="fixed inset-x-3 bottom-5 z-50 mx-auto max-w-xl rounded-2xl border border-[#c85535]/25 bg-white p-4 shadow-[0_16px_42px_rgba(9,43,42,.18)]"><div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f9d8ce]"><CircleAlert className="h-4 w-4 text-[#9c3b24]" /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#092b2a]">This view needs a retry.</p><p className="mt-1 text-xs leading-5 text-[#52716c]">{failure.message}</p><button onClick={() => { setDismissed(null); client.refetchQueries({ queryKey: failure.queryKey }); }} className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#0b4f4a] px-3 py-1.5 text-xs font-bold text-white"><RotateCcw className="h-3.5 w-3.5" />Retry securely</button></div><button onClick={() => setDismissed(failure.key)} className="h-fit rounded-full p-1 text-[#52716c]" aria-label="Dismiss recovery message"><X className="h-4 w-4" /></button></div></div>;
}
