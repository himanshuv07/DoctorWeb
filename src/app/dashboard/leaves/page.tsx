"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRef = { id: number; fname: string; lname: string };

type LeaveType = {
  id: number;
  leave_startDate: string;
  leave_endDate: string;
  status: "enabled" | "disabled";
  remark?: string | null;
  user_id: number;
  created_by: number;
  updated_by?: number | null;
  doctor?: UserRef | null;
  creator?: UserRef | null;
  updater?: UserRef | null;
  createdAt?: string;
  updatedAt?: string;
};

type FormDataType = {
  leave_startDate: string;
  leave_endDate: string;
  user_id: string;
  remark: string;
  status: "enabled" | "disabled";
};

type FieldErrors = Partial<Record<keyof FormDataType, string>>;

const initialForm: FormDataType = {
  leave_startDate: "",
  leave_endDate: "",
  user_id: "",
  remark: "",
  status: "enabled",
};

const ENTRIES_OPTIONS = [10, 25, 50, 100];

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: number; type: ToastType; title: string; message: string; }
let _toastId = 0;

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; title: string }> = {
  success: { bg: "bg-[#0d2818]", border: "border-green-600",  icon: "text-green-400",  title: "text-green-300"  },
  error:   { bg: "bg-[#2a0d0d]", border: "border-red-600",    icon: "text-red-400",    title: "text-red-300"    },
  warning: { bg: "bg-[#2a1e0d]", border: "border-yellow-500", icon: "text-yellow-400", title: "text-yellow-300" },
  info:    { bg: "bg-[#0d1a2a]", border: "border-blue-500",   icon: "text-blue-400",   title: "text-blue-300"   },
};

function ToastIcon({ type }: { type: ToastType }) {
  const cls = "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0";
  if (type === "success") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (type === "error")   return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (type === "warning") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>;
  return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-3 sm:top-5 right-3 sm:right-5 z-[999] flex flex-col gap-2 sm:gap-3 w-[calc(100%-1.5rem)] sm:w-80 pointer-events-none">
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.type];
        return (
          <div key={t.id} className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border ${s.bg} ${s.border} shadow-lg pointer-events-auto`}>
            <span className={s.icon}><ToastIcon type={t.type} /></span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm font-semibold ${s.title}`}>{t.title}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{t.message}</p>
            </div>
            <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1a1d2e] border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl z-10">
        <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Delete Leave</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">This action cannot be undone.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full">
            <button onClick={onCancel} className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors order-2 sm:order-1">
              Cancel
            </button>
            <button onClick={onConfirm} className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors order-1 sm:order-2">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Field Error ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs text-red-400">
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {message}
    </p>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "enabled" | "disabled" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[11px] font-semibold border ${
      status === "enabled"
        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
        : "bg-slate-500/15 text-slate-400 border-slate-500/30"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "enabled" ? "bg-emerald-400" : "bg-slate-400"}`} />
      {status === "enabled" ? "Enabled" : "Disabled"}
    </span>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(form: FormDataType): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.user_id.trim()) {
    errors.user_id = "Doctor ID is required.";
  } else if (isNaN(Number(form.user_id)) || Number(form.user_id) < 1) {
    errors.user_id = "Doctor ID must be a valid positive number.";
  }

  if (!form.leave_startDate) {
    errors.leave_startDate = "Start date is required.";
  }

  if (!form.leave_endDate) {
    errors.leave_endDate = "End date is required.";
  }

  if (form.leave_startDate && form.leave_endDate) {
    if (new Date(form.leave_endDate) < new Date(form.leave_startDate)) {
      errors.leave_endDate = "End date cannot be before start date.";
    }
  }

  if (form.remark && form.remark.length > 500) {
    errors.remark = "Remark must be under 500 characters.";
  }

  return errors;
}

// ─── Format date ──────────────────────────────────────────────────────────────

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

// ─── Day count calculator ─────────────────────────────────────────────────────

function calcDays(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null;
  // +1 because both start and end day are inclusive
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeavesPage() {
  const [leaves, setLeaves]             = useState<LeaveType[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(10);
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");

  const [showModal, setShowModal]       = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveType | null>(null);
  const [deleteId, setDeleteId]         = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData]         = useState<FormDataType>(initialForm);
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});
  const [toasts, setToasts]             = useState<Toast[]>([]);

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, type, title, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/leaves");
      setLeaves(res.data?.data || []);
    } catch {
      setError("Failed to fetch leaves. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  // ── Filter + paginate ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return leaves.filter((l) => {
      const matchSearch =
        !q ||
        l.doctor?.name?.toLowerCase().includes(q) ||
        l.leave_startDate?.includes(q) ||
        l.leave_endDate?.includes(q) ||
        l.remark?.toLowerCase().includes(q) ||
        String(l.user_id).includes(q);
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leaves, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onSearch     = (v: string) => { setSearch(v); setPage(1); };
  const onPageSize   = (n: number) => { setPageSize(n); setPage(1); };
  const onStatusFilter = (v: "all" | "enabled" | "disabled") => { setStatusFilter(v); setPage(1); };

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

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingLeave(null);
    setFormData(initialForm);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEditModal = (l: LeaveType) => {
    setEditingLeave(l);
    setFormData({
      leave_startDate: l.leave_startDate ?? "",
      leave_endDate:   l.leave_endDate   ?? "",
      user_id:         String(l.user_id) ?? "",
      remark:          l.remark          ?? "",
      status:          l.status          ?? "enabled",
    });
    setFieldErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLeave(null);
    setFormData(initialForm);
    setFieldErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((p) => { const n = { ...p }; delete n[name as keyof FieldErrors]; return n; });
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errors = validateForm(formData);
    setFieldErrors(errors);

    const count = Object.keys(errors).length;
    if (count > 0) {
      addToast("error", "Please fix the errors", `${count} field${count > 1 ? "s need" : " needs"} your attention.`);
      return;
    }

    const payload = {
      leave_startDate: formData.leave_startDate,
      leave_endDate:   formData.leave_endDate,
      user_id:         Number(formData.user_id),
      remark:          formData.remark.trim() || null,
      status:          formData.status,
    };

    try {
      setSubmitLoading(true);

      if (editingLeave) {
        await axios.put(`/leaves/${editingLeave.id}`, payload);
        addToast("success", "Updated", "Leave record updated successfully.");
      } else {
        await axios.post("/leaves", payload);
        addToast("success", "Created", "Leave record created successfully.");
      }

      await fetchLeaves();
      closeModal();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Something went wrong. Please try again.";
      addToast("error", "Error", msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    try {
      await axios.delete(`/leaves/${deleteId}`);
      await fetchLeaves();
      addToast("success", "Deleted", "Leave record removed successfully.");
    } catch (err: any) {
      addToast("error", "Delete failed", err?.response?.data?.message || "Could not delete. Please try again.");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-[3px] sm:border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-400 font-medium">Loading leaves...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm sm:text-base text-slate-200 font-semibold">{error}</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Check your connection and try again</p>
          </div>
          <button onClick={fetchLeaves} className="px-4 sm:px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">

        {/* Heading */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Leaves Table</h1>
          <nav className="flex items-center gap-1 sm:gap-1.5 mt-1 text-[10px] sm:text-xs text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-300">Leaves</span>
          </nav>
        </div>

        {/* Card */}
        <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">

          {/* Card header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] flex items-center gap-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">Leaves Datatable</h2>
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
                Add Leave
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilter(e.target.value as any)}
                  className="bg-white/[0.05] border border-white/[0.08] rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-300 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all [&>option]:bg-[#13152a] cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>

                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text" placeholder="Search leaves..." value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    className="pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 sm:py-2.5 w-full bg-white/[0.05] border border-white/[0.08] rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                  />
                  {search && (
                    <button onClick={() => onSearch("")} className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Result count + entries */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500">
                Show
                <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}
                  className="bg-white/[0.05] border border-white/[0.08] rounded-md sm:rounded-lg px-1.5 sm:px-2 py-1 text-slate-300 outline-none focus:ring-1 focus:ring-violet-500/40 cursor-pointer [&>option]:bg-[#13152a] text-xs sm:text-sm">
                  {ENTRIES_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                entries
              </div>
              <span className="ml-auto text-[10px] sm:text-xs text-slate-600 font-medium">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-white/[0.06] -mx-3 sm:mx-0">
              <div className="min-w-[700px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                      {["Doctor", "Start Date", "End Date", "Status", "Remark", "Created At", "Action"].map((h) => (
                        <th key={h} className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 sm:px-4 py-16 sm:py-20 text-center">
                          <div className="flex flex-col items-center gap-2 sm:gap-3 text-slate-600">
                            <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs sm:text-sm font-semibold">No leaves found</p>
                            {search && <p className="text-[10px] sm:text-xs">Try adjusting your search or filter</p>}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((l, i) => (
                        <tr key={l.id ?? i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">

                          {/* Doctor */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/20 border border-violet-500/25 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-slate-200 text-xs font-medium">{l.doctor ? `${l.doctor.fname} ${l.doctor.lname}` : "—"}</p>
                                <p className="text-slate-600 text-[10px]">ID: {l.user_id}</p>
                              </div>
                            </div>
                          </td>

                          {/* Start Date */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-slate-300 text-[10px] sm:text-xs whitespace-nowrap">
                            {formatDate(l.leave_startDate)}
                          </td>

                          {/* End Date */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-slate-300 text-[10px] sm:text-xs whitespace-nowrap">
                            {formatDate(l.leave_endDate)}
                          </td>

                          {/* Status */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                            <StatusBadge status={l.status} />
                          </td>

                          {/* Remark */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-slate-400 text-[10px] sm:text-xs max-w-[140px]">
                            <span className="line-clamp-2">{l.remark || "—"}</span>
                          </td>

                          {/* Created At */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-slate-400 text-[10px] sm:text-xs whitespace-nowrap">
                            {formatDateTime(l.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <button
                                onClick={() => openEditModal(l)} title="Edit"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/10 hover:bg-violet-500/25 border border-violet-500/20 flex items-center justify-center text-violet-400 transition-all hover:scale-110"
                              >
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteId(l.id)} title="Delete"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 flex items-center justify-center text-red-400 transition-all hover:scale-110"
                              >
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/[0.06]">
              <p className="text-[10px] sm:text-xs text-slate-500 text-center sm:text-left">
                Showing{" "}
                <span className="text-slate-300 font-medium">{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}</span>
                {" "}to{" "}
                <span className="text-slate-300 font-medium">{Math.min(page * pageSize, filtered.length)}</span>
                {" "}of{" "}
                <span className="text-slate-300 font-medium">{filtered.length}</span> entries
                {leaves.length !== filtered.length && <span className="text-slate-600"> (filtered from {leaves.length})</span>}
              </p>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Previous
                </button>

                {pageButtons.map((p, i) =>
                  p === "..." ? (
                    <span key={`d${i}`} className="px-1 sm:px-1.5 text-slate-600 text-[10px] sm:text-xs select-none">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-all ${page === p ? "bg-violet-600 text-white shadow-md shadow-violet-900/40" : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-white/[0.08]"}`}>
                      {p}
                    </button>
                  )
                )}

                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#1a1d2e] border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-lg shadow-2xl z-10 max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-5 py-3 sm:py-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {editingLeave ? "Edit Leave" : "Add Leave"}
                </h3>
              </div>
              <button onClick={closeModal} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors flex items-center justify-center">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-4 sm:py-5 space-y-4">

              {/* Doctor ID */}
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">
                  Doctor ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" name="user_id" value={formData.user_id}
                  onChange={handleChange} placeholder="e.g. 1"
                  disabled={!!editingLeave}
                  className={`w-full rounded-lg sm:rounded-xl border bg-[#141a2f] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none placeholder:text-slate-600 transition-all ${
                    fieldErrors.user_id
                      ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                      : "border-white/10 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15"
                  } ${editingLeave ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <FieldError message={fieldErrors.user_id} />
                {editingLeave && <p className="mt-1 text-[10px] text-slate-600">Doctor cannot be changed after creation.</p>}
              </div>

              {/* Date row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date" name="leave_startDate" value={formData.leave_startDate}
                    onChange={handleChange}
                    className={`w-full rounded-lg sm:rounded-xl border bg-[#141a2f] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none transition-all [color-scheme:dark] ${
                      fieldErrors.leave_startDate
                        ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                        : "border-white/10 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15"
                    }`}
                  />
                  <FieldError message={fieldErrors.leave_startDate} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date" name="leave_endDate" value={formData.leave_endDate}
                    onChange={handleChange}
                    min={formData.leave_startDate || undefined}
                    className={`w-full rounded-lg sm:rounded-xl border bg-[#141a2f] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none transition-all [color-scheme:dark] ${
                      fieldErrors.leave_endDate
                        ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                        : "border-white/10 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15"
                    }`}
                  />
                  <FieldError message={fieldErrors.leave_endDate} />
                </div>
              </div>

              {/* ── Day count — auto-calculated, read-only ── */}
              {(() => {
                const days = calcDays(formData.leave_startDate, formData.leave_endDate);
                return (
                  <div>
                    <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">
                      Total Leave Days
                    </label>
                    <div className={`flex items-center gap-3 w-full rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 transition-all ${
                      days !== null
                        ? "bg-violet-500/8 border-violet-500/30"
                        : "bg-white/[0.02] border-white/[0.06]"
                    }`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        days !== null ? "bg-violet-500/20 border border-violet-500/30" : "bg-white/5 border border-white/10"
                      }`}>
                        <svg className={`w-3.5 h-3.5 ${days !== null ? "text-violet-400" : "text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {days !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg sm:text-xl font-bold text-violet-300">{days}</span>
                          <span className="text-xs sm:text-sm text-slate-400">{days === 1 ? "day" : "days"}</span>
                          <span className="text-[10px] text-slate-600 ml-1">(inclusive of start & end)</span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-slate-600">
                          {!formData.leave_startDate && !formData.leave_endDate
                            ? "Select both dates to calculate"
                            : !formData.leave_startDate
                            ? "Select a start date"
                            : !formData.leave_endDate
                            ? "Select an end date"
                            : "End date must be after start date"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Status (edit only) */}
              {editingLeave && (
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}
                    className="w-full rounded-lg sm:rounded-xl border border-white/10 bg-[#141a2f] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all [&>option]:bg-[#13152a] cursor-pointer">
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              )}

              {/* Remark */}
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">
                  Remark <span className="text-slate-600 text-[10px] font-normal">(optional)</span>
                </label>
                <textarea
                  name="remark" value={formData.remark} onChange={handleChange}
                  placeholder="e.g. Annual leave, Medical leave..."
                  rows={3}
                  className={`w-full rounded-lg sm:rounded-xl border bg-[#141a2f] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none placeholder:text-slate-600 transition-all resize-none ${
                    fieldErrors.remark
                      ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                      : "border-white/10 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15"
                  }`}
                />
                <div className="flex items-start justify-between mt-1">
                  <FieldError message={fieldErrors.remark} />
                  <span className={`text-[10px] ml-auto ${formData.remark.length > 450 ? "text-amber-400" : "text-slate-600"}`}>
                    {formData.remark.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full border-t border-white/10 px-4 sm:px-5 py-3 sm:py-4 shrink-0">
              <button onClick={closeModal} className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors order-2 sm:order-1">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitLoading}
                className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 order-1 sm:order-2">
                {submitLoading ? (
                  <><div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{editingLeave ? "Updating..." : "Creating..."}</>
                ) : (
                  editingLeave ? "Update Leave" : "Create Leave"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      {deleteId !== null && (
        <DeleteDialog onCancel={() => setDeleteId(null)} onConfirm={handleDeleteConfirm} />
      )}
    </>
  );
}