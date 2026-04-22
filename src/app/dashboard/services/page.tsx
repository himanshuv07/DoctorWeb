"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import axios from "axios"
import API from "@/lib/axios"
import { toast, Toaster } from 'react-hot-toast'
import { debounce } from 'lodash'

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

// Custom hook for localStorage persistence
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue]
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceType[]>([])
  const [durations, setDurations] = useState<DurationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useLocalStorage("services-search", "")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useLocalStorage("services-page-size", 10)

  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<ServiceType | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [formData, setFormData] = useState<FormDataType>(initialForm)
  const [formErrors, setFormErrors] = useState<Partial<FormDataType>>({})

  const searchRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Fetch services with caching
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get("/services")
      setServices(res.data.data || [])
    } catch (err) {
      setError("Failed to fetch services. Please try again.")
      toast.error("Failed to fetch services")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDurations = useCallback(async () => {
    try {
      const res = await axios.get("/duration")
      setDurations(res.data.data || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch durations")
    }
  }, [])

  useEffect(() => {
    fetchServices()
    fetchDurations()
  }, [fetchServices, fetchDurations])

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearch(value)
      setPage(1)
    }, 300),
    [setSearch]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }

  // Filter services
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return services

    return services.filter((service) => {
      return (
        service.name.toLowerCase().includes(q) ||
        String(service.price).includes(q) ||
        String(service.duration?.value || "").includes(q)
      )
    })
  }, [services, search])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = useMemo(() =>
    filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  )

  const handlePageSizeChange = (n: number) => {
    setPageSize(n)
    setPage(1)
  }

  // Pagination buttons with ellipsis
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

  // Modal handlers
  const openAddModal = () => {
    setEditingService(null)
    setFormData(initialForm)
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (service: ServiceType) => {
    setEditingService(service)
    setFormData({
      name: service.name || "",
      price: String(service.price || ""),
      durationId: String(service.durationId || service.duration?.id || ""),
    })
    setFormErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingService(null)
    setFormData(initialForm)
    setFormErrors({})
  }

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<FormDataType> = {}

    if (!formData.name.trim()) {
      errors.name = "Service name is required"
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters"
    } else if (formData.name.length > 100) {
      errors.name = "Name must be less than 100 characters"
    }

    if (!formData.price) {
      errors.price = "Price is required"
    } else {
      const priceNum = Number(formData.price)
      if (isNaN(priceNum) || priceNum <= 0) {
        errors.price = "Price must be a positive number"
      } else if (priceNum > 999999) {
        errors.price = "Price must be less than 1,000,000"
      }
    }

    if (!formData.durationId) {
      errors.durationId = "Duration is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
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
        await axios.put(`/services/${editingService.id}`, {
          name: payload.name,
          price: payload.price,
          durationId: payload.durationId,
          updatedBy: 10,
        })
        toast.success("Service updated successfully")
      } else {
        await axios.post("/services", payload)
        toast.success("Service created successfully")
      }

      await fetchServices()
      closeModal()
    } catch (error: any) {
      const message = error?.response?.data?.message || "Something went wrong"
      toast.error(message)
      console.error("Submit error:", error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return

    try {
      setDeleteLoading(true)
      await API.delete(`/services/${deleteId}`)
      await fetchServices()
      toast.success("Service deleted successfully")
    } catch (e) {
      console.error(e)
      toast.error("Failed to delete service")
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape' && showModal) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showModal])

  // Click outside modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && showModal) {
        closeModal()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModal])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchServices} />
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1d2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#0f1119] to-[#13152a] p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent">
                Services Management
              </h1>
              <nav className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-slate-300">Services</span>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-mono text-slate-400 bg-white/5 border border-white/10 rounded-lg">
                Ctrl + K
              </kbd>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
            {/* Card Header */}
            <div className="px-4 md:px-6 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
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

              <div className="text-xs text-slate-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/40"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Service
                </button>

                <div className="relative flex-1 max-w-md">
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
                    placeholder="Search services... (Ctrl + K)"
                    defaultValue={search}
                    onChange={handleSearchChange}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-slate-300 outline-none focus:ring-1 focus:ring-violet-500/40 cursor-pointer"
                  >
                    {ENTRIES_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span>entries</span>
                </div>

                <div className="text-xs text-slate-500">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Table */}
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
                      <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-20 text-center">
                          <EmptyState search={search} onClear={() => setSearch("")} />
                        </td>
                      </tr>
                    ) : (
                      paginated.map((service) => (
                        <tr key={service.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/25 flex items-center justify-center text-[11px] font-bold text-violet-400 shrink-0">
                                {service.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </div>
                              <span className="text-slate-200 font-medium break-words max-w-[200px]">
                                {service.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 font-mono text-xs">
                            ₹ {service.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 whitespace-nowrap">
                              {service.duration?.value ?? "-"} Minutes
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                            {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                            {service.updatedAt ? new Date(service.updatedAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(service)}
                                aria-label="Edit service"
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
                                aria-label="Delete service"
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

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="text-slate-300 font-medium">
                      {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}
                    </span>
                    {" "}to{" "}
                    <span className="text-slate-300 font-medium">
                      {Math.min(page * pageSize, filtered.length)}
                    </span>
                    {" "}of{" "}
                    <span className="text-slate-300 font-medium">{filtered.length}</span>
                    {" "}entries
                  </p>

                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>

                    {pageButtons.map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="px-1.5 text-slate-600 text-xs select-none">…</span>
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <ServiceModal
          ref={modalRef}
          editingService={editingService}
          formData={formData}
          formErrors={formErrors}
          durations={durations}
          submitLoading={submitLoading}
          onFormChange={setFormData}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {deleteId !== null && (
        <DeleteDialog
          loading={deleteLoading}
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  )
}

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f1119] to-[#13152a]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium animate-pulse">Loading services...</p>
    </div>
  </div>
)

// Error State Component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f1119] to-[#13152a]">
    <div className="flex flex-col items-center gap-4 text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        onClick={onRetry}
        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-violet-900/40"
      >
        Retry
      </button>
    </div>
  </div>
)

// Empty State Component
const EmptyState = ({ search, onClear }: { search: string; onClear: () => void }) => (
  <div className="flex flex-col items-center gap-3 text-slate-600">
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M19 11H5m14 0a2 2 0 100-4H5a2 2 0 000 4m14 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m14 0H5"
      />
    </svg>
    <p className="text-sm font-semibold text-slate-300">No services found</p>
    {search && (
      <>
        <p className="text-xs text-slate-500">No results matching "{search}"</p>
        <button
          onClick={onClear}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Clear search
        </button>
      </>
    )}
  </div>
)

// Service Modal Component
const ServiceModal = React.forwardRef<HTMLDivElement, {
  editingService: ServiceType | null
  formData: FormDataType
  formErrors: Partial<FormDataType>
  durations: DurationType[]
  submitLoading: boolean
  onFormChange: (data: FormDataType) => void
  onSubmit: () => void
  onClose: () => void
}>(({ editingService, formData, formErrors, durations, submitLoading, onFormChange, onSubmit, onClose }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    onFormChange({ ...formData, [name]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={ref} className="relative bg-[#1a1d2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-bold text-white">
            {editingService ? "Edit Service" : "Add New Service"}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-5 px-5 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Service Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Haircut, Massage, Consultation"
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-xl border ${formErrors.name ? 'border-red-500/50' : 'border-white/10'
                } bg-[#141a2f] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition-all`}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-red-400">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Price (₹) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="price"
              placeholder="Enter price in rupees"
              value={formData.price}
              onChange={handleChange}
              className={`w-full rounded-xl border ${formErrors.price ? 'border-red-500/50' : 'border-white/10'
                } bg-[#141a2f] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition-all`}
            />
            {formErrors.price && (
              <p className="mt-1 text-xs text-red-400">{formErrors.price}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Duration <span className="text-red-400">*</span>
            </label>
            <select
              name="durationId"
              value={formData.durationId}
              onChange={handleChange}
              className={`w-full rounded-xl border ${formErrors.durationId ? 'border-red-500/50' : 'border-white/10'
                } bg-[#141a2f] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 transition-all`}
            >
              <option value="">Select duration</option>
              {durations.map((duration) => (
                <option key={duration.id} value={duration.id}>
                  {duration.value} Minutes
                </option>
              ))}
            </select>
            {formErrors.durationId && (
              <p className="mt-1 text-xs text-red-400">{formErrors.durationId}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 w-full border-t border-white/10 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitLoading}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{editingService ? "Updating..." : "Creating..."}</span>
              </div>
            ) : (
              <span>{editingService ? "Update Service" : "Create Service"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
})

ServiceModal.displayName = 'ServiceModal'

// Delete Dialog Component
const DeleteDialog = ({ loading, onCancel, onConfirm }: { loading: boolean; onCancel: () => void; onConfirm: () => void }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-[#1a1d2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
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
            <p className="text-sm text-slate-400 mt-1">
              Are you sure? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2.5 w-full">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}