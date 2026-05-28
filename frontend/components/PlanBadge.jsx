"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PricingModal from "@/components/PricingModal";

export default function PlanBadge({ subscriptionTier = "free" }) {
  const isPro = subscriptionTier === "pro";

  return (
    <PricingModal subscriptionTier={subscriptionTier}>
      <Badge
        variant="outline"
        className={`flex h-8 px-3 gap-1.5 rounded-full text-xs font-semibold transition-all ${
          isPro
            ? "bg-linear-to-r from-orange-600 to-amber-500 text-white border-none shadow-sm"
            : "bg-stone-200/50 text-stone-600 border-stone-200 cursor-pointer hover:bg-stone-300/50 hover:border-stone-300"
        }`}
      >
        <Sparkles
          className={`h-3 w-3 ${
            isPro ? "text-white fill-white/20" : "text-stone-500"
          }`}
        />
        <span>{isPro ? "Pro Chef" : "Free Plan"}</span>
      </Badge>
    </PricingModal>
  );
}
