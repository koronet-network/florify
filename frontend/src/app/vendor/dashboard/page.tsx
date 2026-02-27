"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import Navbar from "@/components/Navbar";

interface Product {
  productId: string;
  canonicalName: string;
  price: number;
  category: string;
  color: string;
  stemPerBunch: number;
  unitPerBox: number;
  boxType: string;
}

interface FormData {
  canonicalName: string;
  price: string;
  category: string;
  color: string;
  stemPerBunch: string;
  unitPerBox: string;
  boxType: string;
}

const EMPTY_FORM: FormData = {
  canonicalName: "",
  price: "",
  category: "",
  color: "",
  stemPerBunch: "1",
  unitPerBox: "1",
  boxType: "EB",
};

export default function VendorDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "vendor") {
      router.replace("/");
      return;
    }
    loadProducts();
  }, [router]);

  async function loadProducts() {
    try {
      const data = await api.getVendorProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.productId);
    setForm({
      canonicalName: p.canonicalName,
      price: String(p.price),
      category: p.category,
      color: p.color,
      stemPerBunch: String(p.stemPerBunch),
      unitPerBox: String(p.unitPerBox),
      boxType: p.boxType,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        canonicalName: form.canonicalName,
        price: Number(form.price),
        category: form.category,
        color: form.color,
        stemPerBunch: Number(form.stemPerBunch),
        unitPerBox: Number(form.unitPerBox),
        boxType: form.boxType,
      };
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      setShowForm(false);
      setLoading(true);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.productId !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your floral inventory</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700"
          >
            + Add Product
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              {editingId ? "Edit Product" : "New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
                <input value={form.canonicalName} onChange={(e) => updateField("canonicalName", e.target.value)} required className={inputClass} placeholder="Red Roses - 1 Dozen" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Price ($)</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => updateField("price", e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <input value={form.category} onChange={(e) => updateField("category", e.target.value)} className={inputClass} placeholder="Roses" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
                <input value={form.color} onChange={(e) => updateField("color", e.target.value)} className={inputClass} placeholder="Red" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Stem/Bunch</label>
                <input type="number" value={form.stemPerBunch} onChange={(e) => updateField("stemPerBunch", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Unit/Box</label>
                <input type="number" value={form.unitPerBox} onChange={(e) => updateField("unitPerBox", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Box Type</label>
                <select value={form.boxType} onChange={(e) => updateField("boxType", e.target.value)} className={inputClass}>
                  <option value="EB">EB</option>
                  <option value="FB">FB</option>
                  <option value="QB">QB</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
                <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center text-gray-400">
            No products yet. Add your first listing!
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Color</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Stem/Bun</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Unit/Box</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.canonicalName}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-accent-600">${p.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.color}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{p.stemPerBunch}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{p.unitPerBox}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openEdit(p)} className="mr-2 rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.productId)} className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
