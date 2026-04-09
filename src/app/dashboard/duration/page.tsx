"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "@/lib/axios";
import { Pencil, X, Plus, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { RiDeleteBin6Line } from "react-icons/ri";

// ─── Toast System ─────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

let toastId = 0;

function ToastIcon({ type }: { type: ToastType }) {
  const cls = "w-5 h-5 flex-shrink-0";
  if (type === "success") return <CheckCircle className={cls} />;
  if (type === "error")   return <AlertCircle className={cls} />;
  if (type === "warning") return <AlertTriangle className={cls} />;
  return <Info className={cls} />;
}

const toastStyles: Record<ToastType, { border: string; icon: string; bg: string; title: string }> = {
  success: { bg: "bg-[#0d2818]", border: "border-green-600",  icon: "text-green-400",  title: "text-green-300"  },
  error:   { bg: "bg-[#2a0d0d]", border: "border-red-600",    icon: "text-red-400",    title: "text-red-300"    },
  warning: { bg: "bg-[#2a1e0d]", border: "border-yellow-500", icon: "text-yellow-400", title: "text-yellow-300" },
  info:    { bg: "bg-[#0d1a2a]", border: "border-blue-500",   icon: "text-blue-400",   title: "text-blue-300"   },
};

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-3 w-80 pointer-events-none">
      {toasts.map((t) => {
        const s = toastStyles[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.bg} ${s.border} shadow-lg animate-slide-in pointer-events-auto`}
          >
            <span className={s.icon}><ToastIcon type={t.type} /></span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${s.title}`}>{t.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] backdrop-blur-sm">
      <div className="bg-[#161b27] p-6 rounded-xl w-[360px] border border-gray-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-red-400"><AlertTriangle className="w-6 h-6" /></span>
          <h3 className="text-base font-semibold text-white">Confirm Delete</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-[#1f2937] transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DurationPage() {
  const [durations, setDurations] = useState<any[]>([]);
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [showEntries, setShowEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // ── Fetch ──
  const fetchDurations = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/duration");
      setDurations(res.data.durations);
    } catch (err: any) {
      addToast("error", "Failed to load", err?.response?.data?.message || "Could not fetch durations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDurations(); }, []);

  // ── Add ──
  const addDuration = async () => {
    if (!value || isNaN(Number(value))) {
      addToast("warning", "Invalid input", "Please enter a valid numeric duration value.");
      return;
    }
    if (Number(value) <= 0) {
      addToast("warning", "Invalid value", "Duration must be greater than 0 minutes.");
      return;
    }
    try {
      await axios.post("/duration", { value: Number(value) });
      setValue("");
      setIsAddOpen(false);
      await fetchDurations();
      addToast("success", "Duration added", `${value} minutes has been added successfully.`);
    } catch (err: any) {
      addToast("error", "Add failed", err?.response?.data?.message || "Something went wrong while adding the duration.");
    }
  };

  // ── Delete ──
  const askDelete = (id: number) => {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setConfirmOpen(false);
    try {
      await axios.delete(`/duration/${deleteTargetId}`);
      await fetchDurations();
      addToast("success", "Deleted", "The duration has been removed successfully.");
    } catch (err: any) {
      addToast("error", "Delete failed", err?.response?.data?.message || "Could not delete. Please try again.");
    } finally {
      setDeleteTargetId(null);
    }
  };

  // ── Edit ──
  const openEditModal = (d: any) => {
    setEditId(d.id);
    setEditValue(d.value.toString());
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setEditId(null); setEditValue(""); };

  const saveEdit = async () => {
    if (!editValue || isNaN(Number(editValue))) {
      addToast("warning", "Invalid input", "Please enter a valid numeric value.");
      return;
    }
    if (Number(editValue) <= 0) {
      addToast("warning", "Invalid value", "Duration must be greater than 0 minutes.");
      return;
    }
    try {
      await axios.put(`/duration/${editId}`, { value: Number(editValue) });
      closeModal();
      await fetchDurations();
      addToast("success", "Updated", `Duration updated to ${editValue} minutes successfully.`);
    } catch (err: any) {
      addToast("error", "Update failed", err?.response?.data?.message || "Could not update duration. Please try again.");
    }
  };

  // ── Filter + Paginate ──
  const filtered = durations.filter((d) => d.value.toString().includes(search));
  const totalPages = Math.max(1, Math.ceil(filtered.length / showEntries));
  const paginated = filtered.slice((currentPage - 1) * showEntries, currentPage * showEntries);

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <ConfirmDialog
        isOpen={confirmOpen}
        message="Are you sure you want to delete this duration? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTargetId(null); }}
      />

      <div className="p-6 text-white min-h-screen bg-[#0d1117]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Duration</h2>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-gray-500">Dashboard</span>
            <span className="mx-2 text-gray-600">&gt;</span>
            <span className="text-white">Duration</span>
          </p>
        </div>

        <div className="bg-[#161b27] border border-gray-800 rounded-xl overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800">
            <span className="text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-200">Duration Datatable</h3>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center px-5 py-4">
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Duration
            </button>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                placeholder="Search durations..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="bg-[#1f2937] border border-gray-700 text-sm px-3 py-2 pl-9 rounded-lg w-56 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-500"
              />
            </div>
          </div>

          {/* Show entries */}
          <div className="flex items-center gap-2 px-5 pb-3 text-sm text-gray-400">
            <span>Show</span>
            <select
              value={showEntries}
              onChange={(e) => { setShowEntries(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-[#1f2937] border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none"
            >
              {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>entries</span>
            <span className="ml-auto text-gray-500 text-xs">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1a2130] text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Value (Minutes) <span className="text-gray-600">⇅</span></th>
                  <th className="px-5 py-3 text-left font-semibold">Created At <span className="text-gray-600">⇅</span></th>
                  <th className="px-5 py-3 text-left font-semibold">Updated At <span className="text-gray-600">⇅</span></th>
                  <th className="px-5 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-500">Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-500">No data found</td></tr>
                ) : (
                  paginated.map((d) => (
                    <tr key={d.id} className="border-t border-gray-800/60 hover:bg-[#1a2130] transition-colors">
                      <td className="px-5 py-3.5 text-white font-medium">{d.value} min</td>
                      <td className="px-5 py-3.5 text-gray-400">{new Date(d.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-gray-400">{new Date(d.updatedAt).toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-1.5 rounded border border-gray-700 text-blue-400 hover:text-blue-300 hover:bg-[#2a3444] transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => askDelete(d.id)}
                            className="p-1.5 rounded border border-gray-700 text-red-400 hover:text-red-300 hover:bg-[#2a3444] transition-colors"
                            title="Delete"
                          >
                            <RiDeleteBin6Line className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex justify-between items-center px-5 py-4 border-t border-gray-800 text-sm text-gray-400">
            <span>
              Showing{" "}
              <span className="text-white font-medium">{filtered.length === 0 ? 0 : (currentPage - 1) * showEntries + 1}</span>
              {" "}to{" "}
              <span className="text-white font-medium">{Math.min(currentPage * showEntries, filtered.length)}</span>
              {" "}of{" "}
              <span className="text-white font-medium">{filtered.length}</span> entries
            </span>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-gray-700 hover:bg-[#1f2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "bg-purple-600 text-white border border-purple-500"
                      : "border border-gray-700 hover:bg-[#1f2937] text-gray-400"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-gray-700 hover:bg-[#1f2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ADD MODAL */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-[#161b27] p-6 rounded-xl w-[380px] border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-white">Add Duration</h3>
                <button onClick={() => { setIsAddOpen(false); setValue(""); }} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <label className="block text-sm text-gray-400 mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDuration()}
                className="w-full bg-[#1f2937] border border-gray-600 focus:border-purple-500 px-3 py-2 rounded-lg mb-5 text-white placeholder-gray-500 focus:outline-none transition-colors"
                placeholder="e.g. 30"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setIsAddOpen(false); setValue(""); }}
                  className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-[#1f2937] transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addDuration}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors text-sm font-medium"
                >
                  Add Duration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-[#161b27] p-6 rounded-xl w-[380px] border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-white">Edit Duration</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <label className="block text-sm text-gray-400 mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                className="w-full bg-[#1f2937] border border-gray-600 focus:border-purple-500 px-3 py-2 rounded-lg mb-5 text-white placeholder-gray-500 focus:outline-none transition-colors"
                placeholder="Enter duration"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-[#1f2937] transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors text-sm font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease; }
      `}</style>
    </>
  );
}