import { Button } from "@/components/ui/button";
import { formatNgn } from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  MapPinned,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";

export function AdminCommerceControls() {
  const zones = trpc.admin.zones.useQuery();
  const commerce = trpc.admin.commerce.useQuery();
  const [zone, setZone] = useState({
    name: "",
    state: "Lagos",
    city: "Lagos",
    lga: "Eti-Osa",
    deliveryChargeKobo: 130000,
    dailyOrderCapacity: 25,
    windows: "09:00–12:00, 14:00–18:00",
  });
  const [fees, setFees] = useState({
    foundingCommissionBps: 1000,
    standardCommissionBps: 1200,
    managedFulfillmentCommissionBps: 1500,
    buyerServiceFeeKobo: 0,
    buyerServiceFeeEnabled: false,
  });
  const addZone = trpc.admin.addZone.useMutation({
    onSuccess: () => {
      zones.refetch();
      setZone(current => ({ ...current, name: "" }));
    },
  });
  const setZoneActive = trpc.admin.setZoneActive.useMutation({
    onSuccess: () => zones.refetch(),
  });
  const saveFees = trpc.admin.saveCommerce.useMutation({
    onSuccess: () => commerce.refetch(),
  });
  useEffect(() => {
    if (commerce.data) setFees(commerce.data);
  }, [commerce.data]);
  const error = addZone.error ?? setZoneActive.error ?? saveFees.error;
  const success =
    addZone.isSuccess || setZoneActive.isSuccess || saveFees.isSuccess;
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <section className="rounded-[24px] border border-[#092b2a]/10 bg-white p-6">
        <div className="flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-[#177e73]" />
          <div>
            <p className="text-sm font-bold">Full service-zone management</p>
            <p className="mt-1 text-sm text-[#52716c]">
              Create zones with every delivery setting and pause a zone without
              deleting its history.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            value={zone.name}
            onChange={event => setZone({ ...zone, name: event.target.value })}
            placeholder="Zone name"
            className="rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
          />
          <input
            value={zone.state}
            onChange={event => setZone({ ...zone, state: event.target.value })}
            placeholder="State"
            className="rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
          />
          <input
            value={zone.city}
            onChange={event => setZone({ ...zone, city: event.target.value })}
            placeholder="City"
            className="rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
          />
          <input
            value={zone.lga}
            onChange={event => setZone({ ...zone, lga: event.target.value })}
            placeholder="LGA"
            className="rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
          />
          <input
            type="number"
            min="0"
            value={zone.deliveryChargeKobo}
            onChange={event =>
              setZone({
                ...zone,
                deliveryChargeKobo: Number(event.target.value),
              })
            }
            placeholder="Delivery charge (kobo)"
            className="rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
          />
          <input
            type="number"
            min="1"
            value={zone.dailyOrderCapacity}
            onChange={event =>
              setZone({
                ...zone,
                dailyOrderCapacity: Number(event.target.value),
              })
            }
            placeholder="Daily capacity"
            className="rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
          />
        </div>
        <input
          value={zone.windows}
          onChange={event => setZone({ ...zone, windows: event.target.value })}
          placeholder="Windows, comma separated"
          className="mt-3 w-full rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
        />
        <Button
          disabled={addZone.isPending || !zone.name.trim()}
          onClick={() =>
            addZone.mutate({
              ...zone,
              windows: zone.windows
                .split(",")
                .map(value => value.trim())
                .filter(Boolean),
            })
          }
          className="mt-4 rounded-full bg-[#0b4f4a]"
        >
          <Save className="mr-2 h-4 w-4" />
          Add configured zone
        </Button>
        <div className="mt-5 grid gap-2">
          {zones.data?.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-[#f6f4ec] px-4 py-3 text-sm"
            >
              <div>
                <b>{item.name}</b>
                <span className="ml-2 text-xs text-[#52716c]">
                  {item.city}, {item.lga} · {formatNgn(item.deliveryChargeKobo)}
                </span>
              </div>
              <button
                onClick={() =>
                  setZoneActive.mutate({ id: item.id, active: !item.active })
                }
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${item.active ? "bg-[#dcefe9] text-[#335e59]" : "bg-[#e8e7dc] text-[#52716c]"}`}
              >
                {item.active ? "ACTIVE" : "PAUSED"}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-[24px] border border-[#092b2a]/10 bg-white p-6">
        <p className="text-sm font-bold">Full marketplace fee controls</p>
        <p className="mt-1 text-sm leading-6 text-[#52716c]">
          Use basis points for commission rates. All amounts are integer kobo
          and only affect future pricing snapshots.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wide text-[#52716c]">
            Founding commission (bps)
            <input
              type="number"
              min="0"
              max="3000"
              value={fees.foundingCommissionBps}
              onChange={event =>
                setFees({
                  ...fees,
                  foundingCommissionBps: Number(event.target.value),
                })
              }
              className="mt-2 w-full rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm font-normal normal-case"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[#52716c]">
            Standard commission (bps)
            <input
              type="number"
              min="0"
              max="3000"
              value={fees.standardCommissionBps}
              onChange={event =>
                setFees({
                  ...fees,
                  standardCommissionBps: Number(event.target.value),
                })
              }
              className="mt-2 w-full rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm font-normal normal-case"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[#52716c]">
            Managed fulfillment (bps)
            <input
              type="number"
              min="0"
              max="3000"
              value={fees.managedFulfillmentCommissionBps}
              onChange={event =>
                setFees({
                  ...fees,
                  managedFulfillmentCommissionBps: Number(event.target.value),
                })
              }
              className="mt-2 w-full rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm font-normal normal-case"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[#52716c]">
            Buyer fee (kobo)
            <input
              type="number"
              min="0"
              max="500000"
              value={fees.buyerServiceFeeKobo}
              onChange={event =>
                setFees({
                  ...fees,
                  buyerServiceFeeKobo: Number(event.target.value),
                })
              }
              className="mt-2 w-full rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm font-normal normal-case"
            />
          </label>
        </div>
        <label className="mt-4 flex items-center justify-between rounded-xl bg-[#eff3db] px-4 py-3 text-sm font-bold text-[#335e59]">
          <span>Enable buyer service fee</span>
          <input
            type="checkbox"
            checked={fees.buyerServiceFeeEnabled}
            onChange={event =>
              setFees({ ...fees, buyerServiceFeeEnabled: event.target.checked })
            }
          />
        </label>
        <Button
          disabled={saveFees.isPending}
          onClick={() => saveFees.mutate(fees)}
          className="mt-4 rounded-full bg-[#0b4f4a]"
        >
          {saveFees.isPending ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save fee configuration
        </Button>
        {(success || error) && (
          <p
            className={`mt-4 flex gap-2 text-sm ${error ? "text-[#9c3b24]" : "text-[#335e59]"}`}
          >
            {error ? (
              <CircleAlert className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {error?.message ?? "Configuration saved."}
          </p>
        )}
      </section>
    </div>
  );
}
