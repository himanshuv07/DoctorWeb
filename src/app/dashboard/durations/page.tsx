"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type DurationType = {
  id: number;
  value: number;
  createdAt?: string;
  updatedAt?: string;
};

type FormDataType = {
  value: string;
};

const initialForm: FormDataType = { value: "" };

const ENTRIES_OPTIONS = [10, 25, 50, 100];

// ─── Toast System ─────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

let toastId = 0;

const toastStyles: Record<ToastType, { border: string; icon: string; bg: string; title: string }> = {
  success: { bg: "bg-[#0d2818]", border: "border-green-600", icon: "text-green-400", title: "text-green-300" },
  error: { bg: "bg-[#2a0d0d]", border: "border-red-600", icon: "text-red-400", title: "text-red-300" },
  warning: { bg: "bg-[#2a1e0d]", border: "border-yellow-500", icon: "text-yellow-400", title: "text-yellow-300" },
  info: { bg: "bg-[#0d1a2a]", border: "border-blue-500", icon: "text-blue-400", title: "text-blue-300" },
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success")
    return (
      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  if (type === "error")
    return (
      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  if (type === "warning")
    return (
      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );
  return (
    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-3 sm:top-5 right-3 sm:right-5 z-[999] flex flex-col gap-2 sm:gap-3 w-[calc(100%-1.5rem)] sm:w-80 pointer-events-none">
      {toasts.map((t) => {
        const s = toastStyles[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border ${s.bg} ${s.border} shadow-lg pointer-events-auto`}
          >
            <span className={s.icon}>
              <ToastIcon type={t.type} />
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm font-semibold ${s.title}`}>{t.title}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{t.message}</p>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Delete Dialog (responsive) ────────────────────────────────────────────────

function DeleteDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1a1d2e] border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl z-10">
        <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Delete Duration</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">This cannot be undone.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full">
            <button
              onClick={onCancel}
              className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors order-1 sm:order-2"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DurationPage() {
  const [durations, setDurations] = useState<DurationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [editingDuration, setEditingDuration] = useState<DurationType | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState<FormDataType>(initialForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Toast helpers ──
  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Fetch ──
  const fetchDurations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/duration");
      setDurations(res.data.durations || res.data.data || []);
    } catch (err: any) {
      setError("Failed to fetch durations. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDurations(); }, []);

  // ── Filter + paginate ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return durations.filter((d) =>
      !q || String(d.value).includes(q)
    );
  }, [durations, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onSearch = (v: string) => { setSearch(v); setPage(1); };
  const onPageSize = (n: number) => { setPageSize(n); setPage(1); };

  const pageButtons = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  // ── Modal helpers ──
  const openAddModal = () => {
    setEditingDuration(null);
    setFormData(initialForm);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEditModal = (d: DurationType) => {
    setEditingDuration(d);
    setFormData({ value: String(d.value) });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDuration(null);
    setFormData(initialForm);
    setFormErrors([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Submit (add / edit) ──
  const handleSubmit = async () => {
    const num = Number(formData.value);

    // Reset previous errors
    setFormErrors([]);

    // Required + number check
    if (!formData.value || isNaN(num)) {
      const msg = "Please enter a valid numeric duration.";
      setFormErrors([msg]);
      addToast("error", "Invalid Input", msg);
      return;
    }

    // Min check
    if (num < 5) {
      const msg = "Minimum duration is 5 minutes.";
      setFormErrors([msg]);
      addToast("warning", "Too Small", msg);
      return;
    }

    // Multiple of 5 check
    if (num % 5 !== 0) {
      const msg = "Duration must be in multiples of 5 minutes (5, 10, 15...).";
      setFormErrors([msg]);
      addToast("warning", "Invalid Step", msg);
      return;
    }

    try {
      setSubmitLoading(true);

      if (editingDuration) {
        await axios.put(`/duration/${editingDuration.id}`, { value: num });
        addToast("success", "Updated", `Duration updated to ${num} minutes.`);
      } else {
        await axios.post("/duration", { value: num });
        addToast("success", "Added", `${num} minutes added successfully.`);
      }

      await fetchDurations();
      closeModal();
    } catch (err: any) {
      const apiError = err?.response?.data;

      if (apiError?.errors && Array.isArray(apiError.errors)) {
        setFormErrors(apiError.errors);
      } else {
        const msg = apiError?.message || "Something went wrong Or Duration already exists.";
        setFormErrors([msg]);
        addToast("error", "Error", msg);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    try {
      await axios.delete(`/duration/${deleteId}`);
      await fetchDurations();
      addToast("success", "Deleted", "The duration has been removed successfully.");
    } catch (err: any) {
      addToast("error", "Delete failed", err?.response?.data?.message || "Could not delete. Please try again.");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 sm:border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-400 font-medium">Loading durations...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm sm:text-base text-slate-200 font-semibold">{error}</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Check your connection and try again</p>
          </div>
          <button
            onClick={fetchDurations}
            className="px-4 sm:px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
        {/* Page heading */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Duration Table</h1>
          <nav className="flex items-center gap-1 sm:gap-1.5 mt-1 text-[10px] sm:text-xs text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-300">Duration</span>
          </nav>
        </div>

        {/* Card */}
        <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
          {/* Card header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] flex items-center gap-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">Duration Datatable</h2>
          </div>

          <div className="p-3 sm:p-4 md:p-5">
            {/* Top controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
              <button
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg shadow-violet-900/40 w-full sm:w-auto"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Duration
              </button>

              <div className="relative w-full sm:w-60">
                <svg
                  className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search durations..."
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 sm:py-2.5 w-full bg-white/[0.05] border border-white/[0.08] rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                />
                {search && (
                  <button
                    onClick={() => onSearch("")}
                    className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Result count */}
            <div className="flex items-center gap-1.5 mb-4 sm:mb-5 flex-wrap">
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Durations List</span>
              <span className="ml-auto text-[10px] sm:text-xs text-slate-600 font-medium">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Show entries */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[10px] sm:text-xs text-slate-500">
              Show
              <select
                value={pageSize}
                onChange={(e) => onPageSize(Number(e.target.value))}
                className="bg-white/[0.05] border border-white/[0.08] rounded-md sm:rounded-lg px-1.5 sm:px-2 py-1 text-slate-300 outline-none focus:ring-1 focus:ring-violet-500/40 cursor-pointer [&>option]:bg-[#13152a] text-xs sm:text-sm"
              >
                {ENTRIES_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              entries
            </div>

            {/* Table - Mobile Scroll */}
            <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-white/[0.06] -mx-3 sm:mx-0">
              <div className="min-w-[600px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        Value (Minutes)
                      </th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        Created At
                      </th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        Updated At
                      </th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 sm:px-4 py-16 sm:py-20 text-center">
                          <div className="flex flex-col items-center gap-2 sm:gap-3 text-slate-600">
                            <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs sm:text-sm font-semibold">No durations found</p>
                            {search && <p className="text-[10px] sm:text-xs">Try adjusting your search</p>}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((d, i) => (
                        <tr
                          key={d.id ?? i}
                          className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                        >
                          {/* Value cell */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/20 border border-violet-500/25 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-semibold border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                {d.value} Minutes
                              </span>
                            </div>
                          </td>

                          <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-slate-400 text-[10px] sm:text-xs whitespace-nowrap">
                            {d.createdAt ? new Date(d.createdAt).toLocaleString() : "-"}
                          </td>

                          <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-slate-400 text-[10px] sm:text-xs whitespace-nowrap">
                            {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : "-"}
                          </td>

                          {/* Action buttons */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                              <button
                                onClick={() => openEditModal(d)}
                                title="Edit"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/10 hover:bg-violet-500/25 border border-violet-500/20 flex items-center justify-center text-violet-400 transition-all hover:scale-110"
                              >
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteId(d.id)}
                                title="Delete"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 flex items-center justify-center text-red-400 transition-all hover:scale-110"
                              >
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/[0.06]">
              <p className="text-[10px] sm:text-xs text-slate-500 text-center sm:text-left">
                Showing{" "}
                <span className="text-slate-300 font-medium">
                  {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}
                </span>{" "}to{" "}
                <span className="text-slate-300 font-medium">
                  {Math.min(page * pageSize, filtered.length)}
                </span>{" "}of{" "}
                <span className="text-slate-300 font-medium">{filtered.length}</span> entries
                {durations.length !== filtered.length && (
                  <span className="text-slate-600"> (filtered from {durations.length})</span>
                )}
              </p>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                {pageButtons.map((p, i) =>
                  p === "..." ? (
                    <span key={`d${i}`} className="px-1 sm:px-1.5 text-slate-600 text-[10px] sm:text-xs select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-all ${page === p
                        ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-white/[0.08]"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL - Responsive */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#1a1d2e] border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-lg shadow-2xl z-10 max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-5 py-3 sm:py-4 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {editingDuration ? "Edit Duration" : "Add Duration"}
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body - scrollable */}
            <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-4 sm:py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs sm:text-sm font-medium text-slate-300">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    name="value"
                    min={10}
                    step={5}
                    placeholder="e.g. 30"
                    value={formData.value}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    autoFocus
                    className="w-full rounded-lg sm:rounded-xl border border-white/10 bg-[#141a2f] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60"
                  />
                </div>

                {/* Inline validation errors */}
                {formErrors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/25 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                    {formErrors.map((err, i) => (
                      <p key={i} className="text-red-400 text-[10px] sm:text-xs flex items-center gap-1.5">
                        <span>•</span> {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full border-t border-white/10 px-4 sm:px-5 py-3 sm:py-4 shrink-0">
              <button
                onClick={closeModal}
                className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {submitLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {editingDuration ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  editingDuration ? "Update" : "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {deleteId !== null && (
        <DeleteDialog
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}