"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import API from "@/lib/axios"

type DurationType = {
  id: number
  value: number
}

type ServiceType = {
  id: number
  name: string
  price: number
  durationId: number
  createdAt?: string
  updatedAt?: string
  duration?: {
    id: number
    value: number
  }
}

type FormDataType = {
  name: string
  price: string
  durationId: string
}

const initialForm: FormDataType = {
  name: "",
  price: "",
  durationId: "",
}

const ENTRIES_OPTIONS = [10, 25, 50, 100]

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceType[]>([])
  const [durations, setDurations] = useState<DurationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<ServiceType | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [formData, setFormData] = useState<FormDataType>(initialForm)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get("/api/services")
      setServices(res.data.data || [])
    } catch (err) {
      setError("Failed to fetch services. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDurations = async () => {
    try {
      const res = await axios.get("/api/duration")
      setDurations(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchDurations()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return services.filter((service) => {
      return (
        !q ||
        service.name.toLowerCase().includes(q) ||
        String(service.price).includes(q) ||
        String(service.duration?.value || "").includes(q)
      )
    })
  }, [services, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const onSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const onPageSize = (n: number) => {
    setPageSize(n)
    setPage(1)
  }

  const pageButtons = useMemo(() => {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push("...")
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
      if (page < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }, [page, totalPages])

  const openAddModal = () => {
    setEditingService(null)
    setFormData(initialForm)
    setShowModal(true)
  }

  const openEditModal = (service: ServiceType) => {
    setEditingService(service)
    setFormData({
      name: service.name || "",
      price: String(service.price || ""),
      durationId: String(service.durationId || service.duration?.id || ""),
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingService(null)
    setFormData(initialForm)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.durationId) {
      alert("Please fill all fields")
      return
    }

    try {
      setSubmitLoading(true)

      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price),
        durationId: Number(formData.durationId),
        createdBy: 10,
        updatedBy: 10,
      }

      if (editingService) {
        await axios.put(`/api/services/${editingService.id}`, {
          name: payload.name,
          price: payload.price,
          durationId: payload.durationId,
          updatedBy: 10,
        })
      } else {
        await axios.post("/api/services", payload)
      }

      await fetchServices()
      closeModal()
    } catch (error: any) {
      console.error("Submit error:", error)
      alert(error?.response?.data?.message || "Something went wrong")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return
    try {
      await API.delete(`/services/${deleteId}`)
      await fetchServices()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading services...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-slate-200 font-semibold">{error}</p>
            <p className="text-slate-500 text-sm mt-1">Check your connection and try again</p>
          </div>
          <button
            onClick={fetchServices}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Service Table</h1>
          <nav className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-300">Service</span>
          </nav>
        </div>

        <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 100-4H5a2 2 0 000 4m14 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m14 0H5"
              />
            </svg>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Service Datatable</h2>
          </div>

          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Service
              </button>

              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-9 pr-8 py-2.5 w-60 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                />
                {search && (
                  <button
                    onClick={() => onSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-5 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Services List</span>
              <span className="ml-auto text-xs text-slate-600 font-medium">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
              Show
              <select
                value={pageSize}
                onChange={(e) => onPageSize(Number(e.target.value))}
                className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-slate-300 outline-none focus:ring-1 focus:ring-violet-500/40 cursor-pointer [&>option]:bg-[#13152a]"
              >
                {ENTRIES_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              entries
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Created At
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Updated At
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-600">
                          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.2}
                              d="M19 11H5m14 0a2 2 0 100-4H5a2 2 0 000 4m14 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m14 0H5"
                            />
                          </svg>
                          <p className="text-sm font-semibold">No services found</p>
                          {search && <p className="text-xs">Try adjusting your search</p>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((service, i) => (
                      <tr key={service.id ?? i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/25 flex items-center justify-center text-[11px] font-bold text-violet-400 shrink-0">
                              {service.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                            <span className="text-slate-200 font-medium">{service.name}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-300 font-mono text-xs">₹ {service.price}</td>

                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                            {service.duration?.value ?? "-"} Minutes
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-400 text-xs">
                          {service.createdAt ? new Date(service.createdAt).toLocaleString() : "-"}
                        </td>

                        <td className="px-4 py-3.5 text-slate-400 text-xs">
                          {service.updatedAt ? new Date(service.updatedAt).toLocaleString() : "-"}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(service)}
                              title="Edit"
                              className="w-7 h-7 rounded-lg bg-violet-500/10 hover:bg-violet-500/25 border border-violet-500/20 flex items-center justify-center text-violet-400 transition-all hover:scale-110"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteId(service.id)}
                              title="Delete"
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 flex items-center justify-center text-red-400 transition-all hover:scale-110"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="text-slate-300 font-medium">{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}</span>
                {" "}to{" "}
                <span className="text-slate-300 font-medium">{Math.min(page * pageSize, filtered.length)}</span>
                {" "}of{" "}
                <span className="text-slate-300 font-medium">{filtered.length}</span> entries
                {services.length !== filtered.length && (
                  <span className="text-slate-600"> (filtered from {services.length})</span>
                )}
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                {pageButtons.map((p, i) =>
                  p === "..." ? (
                    <span key={`d${i}`} className="px-1.5 text-slate-600 text-xs select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${page === p
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
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#1a1d2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-base font-bold text-white">
                {editingService ? "Edit Service" : "Add Service"}
              </h3>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Service name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#141a2f] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Price</label>
                <input
                  type="number"
                  name="price"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#141a2f] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Duration</label>
                <select
                  name="durationId"
                  value={formData.durationId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#141a2f] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60"
                >
                  <option value="">Select Duration</option>
                  {durations.map((duration) => (
                    <option key={duration.id} value={duration.id}>
                      {duration.value} Minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 w-full border-t border-white/10 px-5 py-4">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-60"
              >
                {submitLoading
                  ? editingService
                    ? "Updating..."
                    : "Submitting..."
                  : editingService
                    ? "Update"
                    : "Submit"}
              </button>
            </div>
          </div >
        </div >
      )
      }

      {
        deleteId !== null && (
          <DeleteDialog
            onCancel={() => setDeleteId(null)}
            onConfirm={handleDeleteConfirm}
          />
        )
      }
    </>
  )
}

function DeleteDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1a1d2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl z-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Delete Service</h3>
            <p className="text-sm text-slate-400 mt-1">This cannot be undone.</p>
          </div>
          <div className="flex gap-2.5 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}