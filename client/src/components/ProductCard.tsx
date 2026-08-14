import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { Link } from "wouter";
import { FavoriteButton } from "./FavoriteButton";

export type CatalogItem = {
  id: number;
  farmerId: number;
  farmer: string;
  farmerArea: string;
  verified: boolean;
  species: string;
  form: string;
  processing: string;
  sizeGrade: string;
  unit: string;
  unitPriceKobo: number;
  minOrder: number;
  availableQuantity: number;
  availabilityType: string;
  availabilityDate: string;
  zones: readonly string[];
  fulfillment: readonly string[];
  description: string;
  accent: string;
  imageUrls?: readonly string[];
};

export function formatNgn(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export function ProductCard({ item }: { item: CatalogItem }) {
  const isCatfish = item.species === "catfish";
  return (
    <article className="group overflow-hidden rounded-[22px] border border-[#092b2a]/10 bg-white shadow-[0_8px_30px_rgba(9,43,42,.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(9,43,42,.12)]">
      <div
        className={`relative h-48 overflow-hidden ${isCatfish ? "bg-[#0b4f4a]" : "bg-[#d6e46b]"}`}
      >
        {item.imageUrls?.[0] && (
          <img
            src={item.imageUrls[0]}
            alt={`${item.species} from ${item.farmer}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {item.imageUrls?.[0] && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#092b2a]/75 via-[#092b2a]/15 to-transparent" />
        )}
        <div className="absolute -right-7 top-6 h-36 w-36 rounded-full border-[18px] border-white/15" />
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[repeating-radial-gradient(ellipse_at_bottom,transparent_0_7px,rgba(255,255,255,.15)_8px_10px)]" />
        <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#0b4f4a]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verified farm
        </div>
        <FavoriteButton
          productId={item.id}
          compact
          className="absolute right-4 top-4 z-10 shadow-sm"
        />
        <div className="absolute bottom-5 left-5">
          <p
            className={`font-display text-3xl font-bold tracking-[-0.06em] ${isCatfish ? "text-white" : "text-[#092b2a]"}`}
          >
            {item.species}
          </p>
          <p
            className={`mt-1 text-xs font-semibold capitalize ${isCatfish ? "text-[#d6e46b]" : "text-[#335e59]"}`}
          >
            {item.form} · {item.processing}
          </p>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#092b2a]">{item.farmer}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#5f7e79]">
              <MapPin className="h-3 w-3" />
              {item.farmerArea}
            </p>
          </div>
          <span className="rounded-full bg-[#eff3db] px-2.5 py-1 text-[11px] font-bold capitalize text-[#37635c]">
            {item.sizeGrade}
          </span>
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-5 text-[#52716c]">
          {item.description}
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="font-display text-xl font-bold tracking-[-0.04em] text-[#092b2a]">
              {formatNgn(item.unitPriceKobo)}
              <span className="ml-1 font-sans text-xs font-medium text-[#5f7e79]">
                / {item.unit}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-[#5f7e79]">
              Min. {item.minOrder} {item.unit} · {item.availableQuantity}{" "}
              available
            </p>
          </div>
          <Link
            href={`/shop/${item.id}`}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#0b4f4a] text-white transition-transform active:scale-95"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-[#092b2a]/8 pt-3 text-[11px] font-semibold text-[#5f7e79]">
          <Clock3 className="h-3.5 w-3.5 text-[#0b4f4a]" />
          {item.availabilityDate}
          <span className="mx-1 text-[#b5c2bd]">•</span>
          <PackageCheck className="h-3.5 w-3.5 text-[#0b4f4a]" />
          {item.fulfillment[0].replace("_", " ")}
        </div>
      </div>
    </article>
  );
}
