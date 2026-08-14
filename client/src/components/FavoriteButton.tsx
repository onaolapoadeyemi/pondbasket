import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export function FavoriteButton({
  productId,
  compact = false,
  className = "",
}: {
  productId: number;
  compact?: boolean;
  className?: string;
}) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const favoriteIds = trpc.customer.favoriteIds.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const isSaved = favoriteIds.data?.includes(productId) ?? false;
  const toggle = trpc.customer.toggleFavorite.useMutation({
    onSuccess: data => {
      utils.customer.favoriteIds.invalidate();
      utils.customer.favorites.invalidate();
      toast.success(data.saved ? "Saved for later" : "Removed from saved fish");
    },
    onError: error =>
      toast.error(
        error.message ||
          "Your saved fish could not be updated. Please try again."
      ),
  });
  const label = !isAuthenticated
    ? "Sign in to save this listing"
    : isSaved
      ? "Remove from saved fish"
      : "Save for later";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        if (!isAuthenticated) startLogin();
        else toggle.mutate({ productId });
      }}
      disabled={toggle.isPending}
      className={`inline-flex items-center justify-center rounded-full border transition-all active:scale-95 disabled:opacity-60 ${compact ? "h-9 w-9" : "h-10 gap-2 px-4 text-sm font-bold"} ${isSaved ? "border-[#c85665] bg-[#fff0f2] text-[#b84458]" : "border-[#092b2a]/15 bg-white text-[#0b4f4a] hover:bg-[#eff3db]"} ${className}`}
    >
      <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
      {!compact && <span>{isSaved ? "Saved" : "Save for later"}</span>}
    </button>
  );
}
