import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatNgn } from "@/components/ProductCard";
import { AdminCommerceControls } from "@/components/AdminCommerceControls";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ClipboardCheck,
  Eye,
  LandPlot,
  LoaderCircle,
  MapPinned,
  PackageCheck,
  Plus,
  Settings2,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const enabled = isAuthenticated && user?.role === "admin";
  const overview = trpc.admin.overview.useQuery(undefined, { enabled });
  const apps = trpc.admin.applications.useQuery(undefined, { enabled });
  const products = trpc.admin.products.useQuery(undefined, { enabled });
  const zones = trpc.admin.zones.useQuery(undefined, { enabled });
  const flags = trpc.admin.flags.useQuery(undefined, { enabled });
  const commerce = trpc.admin.commerce.useQuery(undefined, { enabled });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    state: "Lagos",
    city: "Lagos",
    lga: "Eti-Osa",
    deliveryChargeKobo: 130000,
    dailyOrderCapacity: 25,
    windows: "09:00–12:00, 14:00–18:00",
  });
  const documentLink = trpc.admin.verificationDocumentUrl.useQuery(
    { id: documentId ?? 1 },
    { enabled: enabled && documentId !== null }
  );
  const reviewApplication = trpc.admin.reviewApplication.useMutation({
    onSuccess: () => apps.refetch(),
  });
  const reviewProduct = trpc.admin.reviewProduct.useMutation({
    onSuccess: () => products.refetch(),
  });
  const setFlag = trpc.admin.setFlag.useMutation({
    onSuccess: () => flags.refetch(),
  });
  const saveCommerce = trpc.admin.saveCommerce.useMutation({
    onSuccess: () => commerce.refetch(),
  });
  const addZone = trpc.admin.addZone.useMutation({
    onSuccess: () => {
      zones.refetch();
      setZoneForm({ ...zoneForm, name: "" });
    },
  });
  if (!enabled)
    return (
      <main className="container py-16">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#092b2a]/10 bg-white p-8 text-center">
          <ShieldAlert className="mx-auto h-9 w-9 text-[#c85535]" />
          <h1 className="font-display mt-5 text-4xl font-bold tracking-[-.06em]">
            Administrator access only.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#52716c]">
            PondBasket operations can only be opened by an authorized
            administrator account.
          </p>
        </div>
      </main>
    );
  const metrics = [
    [UsersRound, "Farmer applications", overview.data?.applications ?? "—"],
    [LandPlot, "Active service zones", overview.data?.zones ?? "—"],
    [ShieldAlert, "Open disputes", overview.data?.openDisputes ?? "—"],
    [ClipboardCheck, "Payment mode", overview.data?.payments ?? "—"],
  ];
  const error =
    reviewApplication.error ??
    reviewProduct.error ??
    setFlag.error ??
    saveCommerce.error ??
    addZone.error ??
    documentLink.error;
  return (
    <main className="container py-10 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#177e73]">
            Operations console
          </p>
          <h1 className="font-display mt-3 text-5xl font-bold tracking-[-.07em]">
            Pilot controls.
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#f9d8ce] px-4 py-2 text-xs font-bold text-[#9c3b24]">
          <AlertTriangle className="h-4 w-4" />
          DEMO MODE · Financial providers disabled
        </div>
      </div>
      {error && (
        <div className="mt-6 flex gap-3 rounded-2xl bg-[#f9d8ce] p-4 text-sm text-[#9c3b24]">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error.message}
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([Icon, label, value]: any) => (
          <article
            key={label}
            className="rounded-[20px] border border-[#092b2a]/10 bg-white p-5"
          >
            <Icon className="h-5 w-5 text-[#177e73]" />
            <p className="font-display mt-6 text-3xl font-bold tracking-[-.05em]">
              {value}
            </p>
            <p className="mt-1 text-sm text-[#52716c]">{label}</p>
          </article>
        ))}
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-[24px] border border-[#092b2a]/10 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Farmer verification queue</p>
              <p className="mt-1 text-sm text-[#52716c]">
                Review eligibility, masked payment details, and private
                verification records.
              </p>
            </div>
            <span className="rounded-full bg-[#eff3db] px-3 py-1 text-xs font-bold text-[#52716c]">
              {apps.data?.length ?? 0} records
            </span>
          </div>
          <div className="mt-5 grid gap-4">
            {apps.data?.length ? (
              apps.data.map(app => (
                <article key={app.id} className="rounded-2xl bg-[#f6f4ec] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-display text-xl font-bold">
                        {app.farmName}
                      </p>
                      <p className="mt-1 text-xs text-[#52716c]">
                        {app.generalFarmArea} · {app.maskedAccountNumber}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#52716c]">
                      {app.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {app.documents.length ? (
                      app.documents.map(document => (
                        <button
                          key={document.id}
                          onClick={() => setDocumentId(document.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#dcefe9] px-3 py-1.5 text-xs font-bold text-[#335e59]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View {document.originalName}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-[#76938e]">
                        No document uploaded.
                      </span>
                    )}
                  </div>
                  <textarea
                    value={notes[app.id] ?? app.reviewerNote ?? ""}
                    onChange={event =>
                      setNotes({ ...notes, [app.id]: event.target.value })
                    }
                    placeholder="Administrator review note"
                    className="mt-4 min-h-20 w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={reviewApplication.isPending}
                      onClick={() =>
                        reviewApplication.mutate({
                          id: app.id,
                          status: "UNDER_REVIEW",
                          note:
                            notes[app.id] ??
                            app.reviewerNote ??
                            "Under review by PondBasket operations.",
                        })
                      }
                      className="rounded-full bg-[#335e59]"
                    >
                      Mark under review
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={reviewApplication.isPending}
                      onClick={() =>
                        reviewApplication.mutate({
                          id: app.id,
                          status: "APPROVED",
                          note:
                            notes[app.id] ??
                            "Approved for PondBasket Demo Mode selling.",
                        })
                      }
                      className="rounded-full bg-[#0b4f4a]"
                    >
                      Approve farmer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={reviewApplication.isPending}
                      onClick={() =>
                        reviewApplication.mutate({
                          id: app.id,
                          status: "REJECTED",
                          note:
                            notes[app.id] ??
                            "Please update the application and supporting documentation.",
                        })
                      }
                      className="rounded-full text-[#9c3b24]"
                    >
                      Request changes
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-[#f6f4ec] p-5 text-sm text-[#52716c]">
                No farmer applications are ready for review.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-[24px] bg-[#092b2a] p-6 text-white">
          <Settings2 className="h-5 w-5 text-[#d6e46b]" />
          <h2 className="font-display mt-6 text-2xl font-bold tracking-[-.04em]">
            Controlled features
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#c9ddd6]">
            Demo Mode remains intentionally visible. Financial operations never
            fall back to real payment or transfer providers.
          </p>
          <div className="mt-5 grid gap-2">
            {flags.data?.slice(0, 6).map(flag => (
              <button
                onClick={() =>
                  setFlag.mutate({ key: flag.key, enabled: !flag.enabled })
                }
                key={flag.id}
                className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-left text-sm"
              >
                <span>{flag.key.replaceAll("_", " ")}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${flag.enabled ? "bg-[#d6e46b] text-[#092b2a]" : "bg-white/15 text-white"}`}
                >
                  {flag.enabled ? "ON" : "OFF"}
                </span>
              </button>
            ))}
          </div>
          {documentId && (
            <div className="mt-5 rounded-xl bg-white/10 p-4 text-sm">
              {documentLink.isLoading ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Preparing time-limited document link…
                </span>
              ) : documentLink.data ? (
                <a
                  href={documentLink.data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#d6e46b] underline"
                >
                  Open secure document
                </a>
              ) : (
                <span>Document is unavailable.</span>
              )}
            </div>
          )}
        </section>
      </div>
      <section className="mt-5 rounded-[24px] border border-[#092b2a]/10 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Product approval queue</p>
            <p className="mt-1 text-sm text-[#52716c]">
              Only approved catfish and tilapia listings can enter the customer
              catalog.
            </p>
          </div>
          <PackageCheck className="h-5 w-5 text-[#177e73]" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {products.data?.length ? (
            products.data.map(product => (
              <article
                key={product.id}
                className="rounded-2xl bg-[#f6f4ec] p-4"
              >
                <div className="flex gap-3">
                  {product.imageUrls[0] ? (
                    <img
                      src={product.imageUrls[0]}
                      alt={`${product.species} submission`}
                      className="h-16 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-20 place-items-center rounded-xl bg-[#dcefe9] text-xs font-bold text-[#335e59]">
                      No photo
                    </div>
                  )}
                  <div>
                    <p className="font-display text-xl font-bold capitalize">
                      {product.species} · {product.processing}
                    </p>
                    <p className="mt-1 text-xs text-[#52716c]">
                      {formatNgn(product.unitPriceKobo)} / {product.unit} ·{" "}
                      {product.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-xs text-[#52716c]">
                      {product.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={reviewProduct.isPending}
                    onClick={() =>
                      reviewProduct.mutate({
                        id: product.id,
                        status: "ACTIVE",
                        note: "Catalog listing approved.",
                      })
                    }
                    className="rounded-full bg-[#0b4f4a]"
                  >
                    Approve & activate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={reviewProduct.isPending}
                    onClick={() =>
                      reviewProduct.mutate({
                        id: product.id,
                        status: "REJECTED",
                        note: "Listing requires changes before approval.",
                      })
                    }
                    className="rounded-full text-[#9c3b24]"
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-2xl bg-[#f6f4ec] p-5 text-sm text-[#52716c]">
              No product listings require review.
            </p>
          )}
        </div>
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-[24px] border border-[#092b2a]/10 bg-white p-6">
          <div className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-[#177e73]" />
            <p className="text-sm font-bold">Configured service areas</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {zones.data?.map(zone => (
              <div key={zone.id} className="rounded-xl bg-[#f6f4ec] p-4">
                <p className="font-bold">{zone.name}</p>
                <p className="mt-1 text-xs text-[#52716c]">
                  {zone.lga}, {zone.state}
                </p>
                <p className="mt-4 text-sm font-bold">
                  {formatNgn(zone.deliveryChargeKobo)} delivery
                </p>
                <p className="mt-1 text-xs text-[#52716c]">
                  Capacity: {zone.dailyOrderCapacity}/day
                </p>
              </div>
            ))}
          </div>
          <form
            className="mt-5 grid gap-3 sm:grid-cols-2"
            onSubmit={event => {
              event.preventDefault();
              addZone.mutate({
                ...zoneForm,
                windows: zoneForm.windows
                  .split(",")
                  .map(value => value.trim())
                  .filter(Boolean),
              });
            }}
          >
            <input
              required
              value={zoneForm.name}
              onChange={event =>
                setZoneForm({ ...zoneForm, name: event.target.value })
              }
              placeholder="New service zone"
              className="rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
            />
            <input
              required
              type="number"
              min="0"
              value={zoneForm.deliveryChargeKobo}
              onChange={event =>
                setZoneForm({
                  ...zoneForm,
                  deliveryChargeKobo: Number(event.target.value),
                })
              }
              placeholder="Delivery charge in kobo"
              className="rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm"
            />
            <Button
              disabled={addZone.isPending}
              className="w-fit rounded-full bg-[#0b4f4a]"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add service zone
            </Button>
          </form>
        </section>
        <section className="rounded-[24px] border border-[#092b2a]/10 bg-white p-6">
          <p className="text-sm font-bold">Commission & buyer fee</p>
          <p className="mt-1 text-sm leading-6 text-[#52716c]">
            All values are integer kobo. Changes affect future quotes only,
            never immutable order snapshots.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["Founding", commerce.data?.foundingCommissionBps],
              ["Standard", commerce.data?.standardCommissionBps],
              ["Managed", commerce.data?.managedFulfillmentCommissionBps],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-[#f6f4ec] p-3">
                <p className="text-[10px] font-bold uppercase text-[#76938e]">
                  {label}
                </p>
                <p className="mt-1 font-display text-xl font-bold">
                  {Number(value ?? 0) / 100}%
                </p>
              </div>
            ))}
          </div>
          <button
            disabled={!commerce.data || saveCommerce.isPending}
            onClick={() =>
              commerce.data &&
              saveCommerce.mutate({
                ...commerce.data,
                buyerServiceFeeEnabled: !commerce.data.buyerServiceFeeEnabled,
              })
            }
            className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#eff3db] px-4 py-3 text-sm font-bold text-[#335e59]"
          >
            <span>Buyer service fee</span>
            <span className="rounded-full bg-white px-2 py-1 text-[10px]">
              {commerce.data?.buyerServiceFeeEnabled ? "ON" : "OFF"}
            </span>
          </button>
          {commerce.data && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f6f4ec] px-4 py-3 text-sm">
              <span>Configured buyer fee</span>
              <span className="font-bold">
                {formatNgn(commerce.data.buyerServiceFeeKobo)}
              </span>
            </div>
          )}
        </section>
      </div>
      <AdminCommerceControls />
    </main>
  );
}
