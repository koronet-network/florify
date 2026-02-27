"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import FlorifyIcon from "@/components/FlorifyIcon";

type LoginMode = "buyer" | "vendor";

interface Vendor {
  userId: string;
  name: string;
  email: string;
  slug?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("buyer");

  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPassword, setBuyerPassword] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user?.role === "buyer") {
      router.replace("/marketplace");
      return;
    }
    if (user?.role === "vendor") {
      router.replace("/vendor/dashboard");
      return;
    }
  }, [router]);

  useEffect(() => {
    const modeParam = new URLSearchParams(window.location.search).get("mode");
    setMode(modeParam === "vendor" ? "vendor" : "buyer");
  }, []);

  useEffect(() => {
    if (mode !== "vendor" || vendors.length > 0 || loadingVendors) return;

    setLoadingVendors(true);
    api
      .getVendors()
      .then((data) => {
        setVendors(data);
        if (data.length > 0) {
          setVendorId(data[0].userId);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load vendors");
      })
      .finally(() => setLoadingVendors(false));
  }, [mode, vendors.length, loadingVendors]);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.userId === vendorId) || null,
    [vendors, vendorId]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "buyer") {
        const { token, user } = await api.login(buyerEmail, buyerPassword);
        if (user.role !== "buyer") {
          setError("Selected mode is buyer, but this account is not a buyer.");
          return;
        }
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        router.push("/marketplace");
        return;
      }

      if (!selectedVendor) {
        setError("Please select a vendor");
        return;
      }

      const { token, user } = await api.login(selectedVendor.email, vendorPassword);
      if (user.role !== "vendor") {
        setError("Selected mode is vendor, but this account is not a vendor.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, slug: user.slug || selectedVendor.slug })
      );
      router.push("/vendor/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function setBuyerQuickLogin() {
    setMode("buyer");
    setBuyerEmail("jane@buyer.com");
    setBuyerPassword("password123");
    setError("");
  }

  function setVendorQuickLogin() {
    setMode("vendor");
    setVendorPassword("password123");
    setError("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <FlorifyIcon className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-3xl font-bold text-white">Florify</h1>
          <p className="mt-1 text-primary-300">The freshest flowers, delivered to you.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-800">Sign In</h2>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("buyer");
                setError("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "buyer"
                  ? "bg-white text-primary-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("vendor");
                setError("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "vendor"
                  ? "bg-white text-primary-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Vendor
            </button>
          </div>

          <div className="mb-6">
            {mode === "buyer" ? (
              <button
                type="button"
                onClick={setBuyerQuickLogin}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-accent-400 hover:bg-accent-300/10"
              >
                Quick Login as Jane Buyer
              </button>
            ) : (
              <button
                type="button"
                onClick={setVendorQuickLogin}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-accent-400 hover:bg-accent-300/10"
              >
                Quick fill vendor password
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "buyer" ? (
              <>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="buyer-password" className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="buyer-password"
                    type="password"
                    value={buyerPassword}
                    onChange={(e) => setBuyerPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="vendor" className="mb-1 block text-sm font-medium text-gray-700">
                    Vendor
                  </label>
                  <select
                    id="vendor"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    required
                    disabled={loadingVendors}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                  >
                    {vendors.length === 0 ? (
                      <option value="">
                        {loadingVendors ? "Loading vendors..." : "No vendors available"}
                      </option>
                    ) : (
                      vendors.map((vendor) => (
                        <option key={vendor.userId} value={vendor.userId}>
                          {vendor.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="vendor-password" className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="vendor-password"
                    type="password"
                    value={vendorPassword}
                    onChange={(e) => setVendorPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent-600 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
