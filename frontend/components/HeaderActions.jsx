"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import HowToCookModal from "@/components/HowToCookModal";
import PlanBadge from "@/components/PlanBadge";
import UserDropdown from "@/components/UserDropdown";

export default function HeaderActions({ subscriptionTier }) {
  return (
    <div className="flex items-center space-x-4">
      <HowToCookModal />

      <SignedIn>
        {subscriptionTier && <PlanBadge subscriptionTier={subscriptionTier} />}
        <UserDropdown />
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <Button
            variant="ghost"
            className="text-stone-600 hover:text-orange-600 hover:bg-orange-50 font-medium"
          >
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="primary" className="rounded-full px-6">
            Get Started
          </Button>
        </SignUpButton>
      </SignedOut>
    </div>
  );
}
