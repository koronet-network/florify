"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VendorsLoginEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?mode=vendor");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-primary-900">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
    </div>
  );
}
