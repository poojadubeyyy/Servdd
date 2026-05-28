import React from "react";
import { Cookie, Refrigerator } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { checkUser } from "@/lib/checkUser";
import HeaderActions from "./HeaderActions";

export default async function Header() {
  const user = await checkUser();

  return (
    <header className="fixed top-0 w-full border-b border-stone-200 bg-stone-50/80 backdrop-blur-md z-50 supports-backdrop-filter:bg-stone-50/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 group"
        >
          <Image
            src="/orange-logo.png"
            alt="Servd Logo"
            width={60}
            height={60}
            className="w-16"
          />
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-600">
          <Link
            href="/recipes"
            className="hover:text-orange-600 transition-colors flex gap-1.5 items-center"
          >
            <Cookie className="w-4 h-4" />
            My Recipes
          </Link>
          <Link
            href="/pantry"
            className="hover:text-orange-600 transition-colors flex gap-1.5 items-center"
          >
            <Refrigerator className="w-4 h-4" />
            My Pantry
          </Link>
        </div>

        <HeaderActions subscriptionTier={user?.subscriptionTier} />
      </nav>
    </header>
  );
}
