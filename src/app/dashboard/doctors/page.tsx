"use client"

import React, { useEffect, useState, useCallback } from "react"
import API from "@/lib/axios"

// ── Types ─────────────────────────────────────────────────────

interface DaySchedule {
    isAvailable: boolean
    startTime: string | null
    endTime: string | null
    display: string
}

interface TimetableRow {
    id: number
    doctorName: string
    specialities: string[]
    schedule: {
        monday: string
        tuesday: string
        wednesday: string
        thursday: string
        friday: string
        saturday: string
        sunday: string
    }
}

interface DoctorDetail {
    id: number
    doctorName: string
    specialities: { id: number; name: string }[]
    schedule: {
        monday: DaySchedule
        tuesday: DaySchedule
        wednesday: DaySchedule
        thursday: DaySchedule
        friday: DaySchedule
        saturday: DaySchedule
        sunday: DaySchedule
    }
}

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

interface EditDayState {
    isAvailable: boolean
    startTime: string
    endTime: string
}

type EditFormState = Record<DayKey, EditDayState>

const DAY_KEYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
const DAY_LABELS: Record<DayKey, string> = {
    monday: "Monday",
    tuesday: "Tuessday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
}

// ── Helpers ───────────────────────────────────────────────────

function buildDefaultForm(detail: DoctorDetail): EditFormState {
    const form = {} as EditFormState
    for (const day of DAY_KEYS) {
        const d = detail.schedule[day]
        form[day] = {
            isAvailable: d.isAvailable,
            startTime: d.startTime ?? "",
            endTime: d.endTime ?? "",
        }
    }
    return form
}

// ── Sub-components ────────────────────────────────────────────

function Spinner() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-[3px] border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Loading...</p>
            </div>
        </div>
    )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm text-slate-200 font-semibold">{message}</p>
                    <p className="text-xs text-slate-500 mt-1">Check your connection and try again</p>
                </div>
                <button onClick={onRetry}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors">
                    Retry
                </button>
            </div>
        </div>
    )
}

// ── Toggle Switch ─────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-violet-600" : "bg-slate-600"
                }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
            />
        </button>
    )
}

// ── Speciality Badge ──────────────────────────────────────────

function SpecialityBadge({ name }: { name: string }) {
    const colors = [
        "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
        "bg-violet-500/15 text-violet-400 border-violet-500/20",
        "bg-sky-500/15 text-sky-400 border-sky-500/20",
        "bg-amber-500/15 text-amber-400 border-amber-500/20",
        "bg-pink-500/15 text-pink-400 border-pink-500/20",
    ]
    const color = colors[name.charCodeAt(0) % colors.length]
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
            {name}
        </span>
    )
}

// ── LIST VIEW ─────────────────────────────────────────────────

function ListView({
    data,
    onEdit,
}: {
    data: TimetableRow[]
    onEdit: (id: number) => void
}) {
    const [search, setSearch] = useState("")
    const [pageSize, setPageSize] = useState(10)
    const [page, setPage] = useState(1)

    const filtered = data.filter(
        (r) =>
            r.doctorName.toLowerCase().includes(search.toLowerCase()) ||
            r.specialities.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    )
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

    // visible days in table (Mon–Sat, matching image)
    const visibleDays: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Time Table</h1>
                <nav className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-xs text-slate-500">
                    <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-slate-300">Time Table</span>
                </nav>
            </div>

            {/* Card */}
            <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
                {/* Card Header */}
                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h2 className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">
                        Doctor Time Table
                    </h2>
                </div>

                <div className="p-4 sm:p-5">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>Show entries</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                                className="bg-[#0f1117] border border-white/[0.08] text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                            >
                                {[5, 10, 25, 50].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                className="bg-[#0f1117] border border-white/[0.08] text-slate-300 placeholder-slate-600 text-xs rounded-lg pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-white/[0.05]">
                        <table className="w-full text-xs text-slate-300 min-w-[900px]">
                            <thead>
                                <tr className="bg-[#0f1117] border-b border-white/[0.06]">
                                    <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                                        Doctor Name
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                                        Speciality
                                    </th>
                                    {visibleDays.map((d) => (
                                        <th key={d} className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                                            {DAY_LABELS[d]}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-slate-500 text-xs">
                                            No doctors found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((row, i) => (
                                        <tr key={row.id}
                                            className={`transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                                            <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                                                {row.doctorName}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {row.specialities.length > 0
                                                        ? row.specialities.map((s) => <SpecialityBadge key={s} name={s} />)
                                                        : <span className="text-slate-600 text-[10px]">—</span>}
                                                </div>
                                            </td>
                                            {visibleDays.map((day) => (
                                                <td key={day} className="px-4 py-3 whitespace-nowrap">
                                                    {row.schedule[day] === "Not sitting" ? (
                                                        <span className="text-slate-600 text-[10px]">Not sitting</span>
                                                    ) : (
                                                        <span className="text-slate-300 text-[10px]">{row.schedule[day]}</span>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => onEdit(row.id)}
                                                    className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center transition-colors group"
                                                    title="Edit Timetable"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                        <p className="text-[10px] text-slate-500">
                            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
                            {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-[10px] font-medium rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...")
                                    acc.push(p)
                                    return acc
                                }, [])
                                .map((p, i) =>
                                    p === "..." ? (
                                        <span key={`dots-${i}`} className="px-2 text-[10px] text-slate-600">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p as number)}
                                            className={`w-7 h-7 text-[10px] font-semibold rounded-lg transition-all ${page === p
                                                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                                                : "text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-[10px] font-medium rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── EDIT VIEW ─────────────────────────────────────────────────

function EditView({
    doctor,
    onCancel,
    onSuccess,
}: {
    doctor: DoctorDetail
    onCancel: () => void
    onSuccess: () => void
}) {
    const [form, setForm] = useState<EditFormState>(() => buildDefaultForm(doctor))
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<any>({})

    const setDay = (day: string, field: string, value: any) => {
    setForm((prev: any) => ({
        ...prev,
        [day]: {
            ...prev[day],
            [field]: value
        }
    }))

    const key = `${day}.${field}`

    setFieldErrors((prev: any) => {
        if (!prev[key]) return prev
        const copy = { ...prev }
        delete copy[key]
        return copy
    })
}

    async function handleSubmit() {
        setSaving(true)
        setSaveError(null)

        const newErrors: any = {}

        // ✅ validate BEFORE API call
        for (const day of DAY_KEYS) {
            const d = form[day]

            if (d.isAvailable) {
                if (!d.startTime) {
                    newErrors[`${day}.startTime`] = "Start time is required"
                }
                if (!d.endTime) {
                    newErrors[`${day}.endTime`] = "End time is required"
                }

                if (d.startTime && d.endTime && d.endTime <= d.startTime) {
                    newErrors[`${day}.endTime`] = "End time must be after start time"
                }
            }
        }

        // 🚫 stop submit if errors exist
        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors)
            setSaving(false)
            return
        }

        try {
            const payload: Record<string, any> = {}

            for (const day of DAY_KEYS) {
                const d = form[day]
                payload[day] = {
                    isAvailable: d.isAvailable,
                    startTime: d.isAvailable ? d.startTime : null,
                    endTime: d.isAvailable ? d.endTime : null,
                }
            }

            await API.put(`/timetable/${doctor.id}`, payload)

            setFieldErrors({})
            onSuccess()

        } catch (err: any) {
            // ❌ REMOVE global error usage for validation
            setSaveError(
                err?.response?.data?.error ||
                "Failed to update timetable."
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Time Table</h1>
                <nav className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-xs text-slate-500">
                    <span
                        className="hover:text-slate-300 cursor-pointer transition-colors"
                        onClick={onCancel}
                    >
                        Dashboard
                    </span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span
                        className="hover:text-slate-300 cursor-pointer transition-colors"
                        onClick={onCancel}
                    >
                        Time Table
                    </span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-slate-300">Edit</span>
                </nav>
            </div>

            {/* Card */}
            <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h2 className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">
                        Edit Timetable
                    </h2>
                </div>

                <div className="p-5 space-y-6">
                    {/* Doctor Name */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Doctor Name
                        </label>
                        <div className="w-full px-4 py-2.5 bg-[#0f1117] border border-white/[0.08] rounded-xl text-sm text-slate-300">
                            {doctor.doctorName}
                        </div>
                    </div>

                    {/* Specialities */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Speciality
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {doctor.specialities.length > 0 ? (
                                doctor.specialities.map((s) => <SpecialityBadge key={s.id} name={s.name} />)
                            ) : (
                                <span className="text-slate-600 text-xs">No specialities assigned</span>
                            )}
                        </div>
                    </div>

                    {/* Days */}
                    <div className="space-y-4">
                        {DAY_KEYS.map((day) => {
                            const d = form[day]

                            const startError = fieldErrors[`${day}.startTime`]
                            const endError = fieldErrors[`${day}.endTime`]

                            return (
                                <div key={day} className="rounded-xl border border-white/[0.05] bg-[#0f1117]/60 overflow-hidden">

                                    {/* Day Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                                        <span className="text-sm font-semibold text-slate-200">
                                            {DAY_LABELS[day]}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-medium ${d.isAvailable ? "text-emerald-400" : "text-slate-500"
                                                }`}>
                                                {d.isAvailable ? "Available" : "Not Available"}
                                            </span>

                                            <Toggle
                                                checked={d.isAvailable}
                                                onChange={(v) => setDay(day, "isAvailable", v)}
                                            />
                                        </div>
                                    </div>

                                    {/* Time Inputs */}
                                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 transition-opacity duration-200 ${d.isAvailable ? "opacity-100" : "opacity-40 pointer-events-none"
                                        }`}>

                                        {/* Start Time */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                                Start Time
                                            </label>

                                            <input
                                                type="time"
                                                value={d.startTime}
                                                onChange={(e) => setDay(day, "startTime", e.target.value)}
                                                disabled={!d.isAvailable}
                                                className={`w-full px-4 py-2.5 bg-[#1a1d2e] border rounded-xl text-sm text-slate-300 outline-none transition-all [color-scheme:dark]
                                ${startError
                                                        ? "border-red-500 focus:ring-1 focus:ring-red-500"
                                                        : "border-white/[0.08] focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
                                                    }`}
                                            />

                                            {startError && (
                                                <p className="text-red-400 text-[11px] flex items-center gap-1">
                                                    ⚠ {startError}
                                                </p>
                                            )}
                                        </div>

                                        {/* End Time */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                                End Time
                                            </label>

                                            <input
                                                type="time"
                                                value={d.endTime}
                                                onChange={(e) => setDay(day, "endTime", e.target.value)}
                                                disabled={!d.isAvailable}
                                                className={`w-full px-4 py-2.5 bg-[#1a1d2e] border rounded-xl text-sm text-slate-300 outline-none transition-all [color-scheme:dark]
                                ${endError
                                                        ? "border-red-500 focus:ring-1 focus:ring-red-500"
                                                        : "border-white/[0.08] focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
                                                    }`}
                                            />

                                            {endError && (
                                                <p className="text-red-400 text-[11px] flex items-center gap-1">
                                                    ⚠ {endError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Save Error */}
                    {/* {saveError && (
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <p className="text-xs text-red-400">{saveError}</p>
                        </div>
                    )} */}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-violet-500/20"
                        >
                            {saving && (
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {saving ? "Updating..." : "Update"}
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={saving}
                            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── MAIN PAGE ─────────────────────────────────────────────────

export default function TimetablePage() {
    const [view, setView] = useState<"list" | "edit">("list")
    const [listData, setListData] = useState<TimetableRow[]>([])
    const [listLoading, setListLoading] = useState(true)
    const [listError, setListError] = useState<string | null>(null)

    const [editDoctor, setEditDoctor] = useState<DoctorDetail | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)

    // ── Fetch list ──
    const fetchList = useCallback(async () => {
        try {
            setListLoading(true)
            setListError(null)
            const res = await API.get("/timetable")
            const list = Array.isArray(res.data?.timetable) ? res.data.timetable : []
            setListData(list)
        } catch {
            setListError("Failed to fetch timetable. Please try again.")
        } finally {
            setListLoading(false)
        }
    }, [])

    useEffect(() => { fetchList() }, [fetchList])

    // ── Open edit ──
    const handleEdit = useCallback(async (id: number) => {
        setEditLoading(true)
        setEditError(null)
        setView("edit")
        try {
            const res = await API.get(`/timetable/${id}`)
            setEditDoctor(res.data?.doctor ?? null)
        } catch {
            setEditError("Failed to load doctor details.")
        } finally {
            setEditLoading(false)
        }
    }, [])

    // ── After successful save → go back to list and refresh ──
    const handleSuccess = useCallback(() => {
        setView("list")
        setEditDoctor(null)
        fetchList()
    }, [fetchList])

    const handleCancel = useCallback(() => {
        setView("list")
        setEditDoctor(null)
        setEditError(null)
    }, [])

    // ── EDIT VIEW ──
    if (view === "edit") {
        if (editLoading) return <Spinner />
        if (editError)
            return <ErrorState message={editError} onRetry={() => setView("list")} />
        if (!editDoctor)
            return <ErrorState message="Doctor not found." onRetry={() => setView("list")} />

        return (
            <EditView
                doctor={editDoctor}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
            />
        )
    }

    // ── LIST VIEW ──
    if (listLoading) return <Spinner />
    if (listError) return <ErrorState message={listError} onRetry={fetchList} />

    return <ListView data={listData} onEdit={handleEdit} />
}