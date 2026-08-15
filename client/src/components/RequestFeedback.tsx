import { CircleAlert, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type RequestErrorProps = {
  title: string;
  detail?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
};

export function RequestError({
  title,
  detail = "Please check your connection and try again.",
  onRetry,
  isRetrying = false,
  className = "",
}: RequestErrorProps) {
  return (
    <section
      className={`rounded-[24px] border border-[#c85535]/25 bg-[#f9d8ce]/40 p-7 text-center ${className}`}
      role="alert"
    >
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f9d8ce]">
        <CircleAlert className="h-5 w-5 text-[#9c3b24]" />
      </div>
      <h2 className="font-display mt-4 text-2xl font-bold text-[#9c3b24]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#9c3b24]/85">
        {detail}
      </p>
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-5 rounded-full bg-[#0b4f4a]"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        {isRetrying ? "Trying again…" : "Try again"}
      </Button>
    </section>
  );
}

export function RequestRefreshNotice({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-[#eff3db] px-3 py-1.5 text-xs font-bold text-[#37635c]"
      aria-live="polite"
    >
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      {label}
    </span>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-[430px] animate-pulse rounded-[22px] bg-[#e8e7dc]"
        />
      ))}
    </div>
  );
}
