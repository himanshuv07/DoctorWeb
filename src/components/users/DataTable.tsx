"use client"

import React, { useState, useMemo, useRef } from "react"
import type { User } from "./Getalluserdata"
import AddUserModal from "./Addusermodal"
import API from "@/lib/axios"

interface DataTableProps {
    data: User[]
    refresh: () => void
}

type RoleFilter = "all" | "admin" | "staff" | "doctor"
const ENTRIES_OPTIONS = [10, 25, 50, 100]

const ROLE_BADGE: Record<string, string> = {
    admin: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    staff: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    doctor: "bg-violet-500/15 text-violet-400 border-violet-500/30",
}
const GENDER_ICON: Record<string, string> = { male: "♂", female: "♀", other: "⚧" }

/**
 * Handles every possible shape the backend can return for specialities:
 *
 * A) Flat strings:         speciality: ["Cardiologist"]
 * B) Sequelize include:    Services: [{ id, name }]   ← include('Services')
 * C) Junction + nested:    User_Services: [{ Service: { name } }]
 * D) Array of objects:     speciality: [{ id, name }]
 * E) Single string:        speciality: "Cardiologist"
 */
function extractSpecialities(u: any): string[] {
    // B — direct Sequelize association include
    if (Array.isArray(u.Services) && u.Services.length > 0) {
        return u.Services
            .map((s: any) => s.name ?? s.serviceName ?? s.title ?? "")
            .filter(Boolean)
    }
    // C — junction table with nested Service object
    if (Array.isArray(u.User_Services) && u.User_Services.length > 0) {
        return u.User_Services
            .map((us: any) =>
                us?.Service?.name ?? us?.service?.name ??
                us?.serviceName ?? us?.name ?? ""
            )
            .filter(Boolean)
    }
    // D — array of objects
    if (Array.isArray(u.speciality)) {
        return u.speciality
            .map((s: any) => typeof s === "string" ? s : (s.name ?? s.serviceName ?? s.label ?? ""))
            .filter(Boolean)
    }
    // E — single string
    if (typeof u.speciality === "string" && u.speciality.trim()) {
        return u.speciality.split(",").map((s: string) => s.trim()).filter(Boolean)
    }
    return []
}

function normalise(u: any) {
    return {
        ...u,
        _id: u.id ?? u._id,
        displayFirst: u.fname ?? u.firstName ?? "",
        displayLast: u.lname ?? u.lastName ?? "",
        firstName: u.fname ?? u.firstName ?? "",
        lastName: u.lname ?? u.lastName ?? "",
        isActive: u.isActive ?? u.active ?? true,
        specialities: extractSpecialities(u),
    }
}

export default function DataTable({ data, refresh }: DataTableProps) {
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [showModal, setShowModal] = useState(false)
    const [editUser, setEditUser] = useState<User | null>(null)
    const [deleteId, setDeleteId] = useState<string | number | null>(null)
    const [sortKey, setSortKey] = useState<"firstName" | "lastName" | "email" | "phone" | "gender" | "role">("firstName")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
    const searchRef = useRef<HTMLInputElement>(null)

    const normalised = useMemo(() => data.map(normalise), [data])

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        return normalised
            .filter(u => roleFilter === "all" || u.role === roleFilter)
            .filter(u =>
                !q ||
                u.displayFirst.toLowerCase().includes(q) ||
                u.displayLast.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.phone?.includes(q) ||
                u.role?.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                const av = String(a[sortKey] ?? "").toLowerCase()
                const bv = String(b[sortKey] ?? "").toLowerCase()
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
            })
    }, [normalised, search, roleFilter, sortKey, sortDir])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

    const handleSort = (k: typeof sortKey) => {
        if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortKey(k); setSortDir("asc") }
    }
    const onSearch = (v: string) => { setSearch(v); setPage(1) }
    const onPageSize = (n: number) => { setPageSize(n); setPage(1) }
    const onRole = (r: RoleFilter) => { setRoleFilter(r); setPage(1) }

    const pageButtons = useMemo(() => {
        const pages: (number | "...")[] = []
        if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i)
        else {
            pages.push(1)
            if (page > 3) pages.push("...")
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
            if (page < totalPages - 2) pages.push("...")
            pages.push(totalPages)
        }
        return pages
    }, [page, totalPages])

    const COLS: { key: typeof sortKey; label: string }[] = [
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "gender", label: "Gender" },
        { key: "role", label: "Role" },
    ]

    return (
        <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
                <button
                    onClick={() => { setEditUser(null); setShowModal(true) }}
                    className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-violet-600 hover:bg-violet-500
                     active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all
                     shadow-lg shadow-violet-900/40 w-full sm:w-auto">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add User
                </button>

                <div className="relative w-full sm:w-60">
                    <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 pointer-events-none"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input ref={searchRef} type="text" placeholder="Search users..." value={search}
                        onChange={e => onSearch(e.target.value)}
                        className="pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 sm:py-2.5 w-full bg-white/[0.05] border border-white/[0.08] rounded-lg sm:rounded-xl text-xs sm:text-sm
                       text-slate-200 placeholder:text-slate-600 outline-none
                       focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all" />
                    {search && (
                        <button onClick={() => onSearch("")}
                            className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Role tabs */}
            <div className="flex items-center gap-1 sm:gap-1.5 mb-4 sm:mb-5 flex-wrap">
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium mr-1">Role:</span>
                {(["all", "admin", "staff", "doctor"] as RoleFilter[]).map(r => (
                    <button key={r} onClick={() => onRole(r)}
                        className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold capitalize transition-all ${roleFilter === r
                                ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                                : "bg-white/[0.05] text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/[0.08]"
                            }`}>
                        {r}
                    </button>
                ))}
                <span className="ml-auto text-[10px] sm:text-xs text-slate-600 font-medium">
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Entries */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[10px] sm:text-xs text-slate-500">
                Show
                <select value={pageSize} onChange={e => onPageSize(Number(e.target.value))}
                    className="bg-white/[0.05] border border-white/[0.08] rounded-md sm:rounded-lg px-1.5 sm:px-2 py-1 text-slate-300
                     outline-none focus:ring-1 focus:ring-violet-500/40 cursor-pointer [&>option]:bg-[#13152a] text-xs sm:text-sm">
                    {ENTRIES_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                entries
            </div>

            {/* Table - Mobile Scroll */}
            <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-white/[0.06] -mx-3 sm:mx-0">
                <div className="min-w-[900px] sm:min-w-full">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                        <thead>
                            <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                                {COLS.map(({ key, label }) => (
                                    <th key={key} onClick={() => handleSort(key)}
                                        className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase
                                 tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1">
                                            {label}
                                            <SortArrow active={sortKey === key} dir={sortDir} />
                                        </span>
                                    </th>
                                ))}
                                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    Speciality
                                </th>
                                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-3 sm:px-4 py-16 sm:py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 sm:gap-3 text-slate-600">
                                            <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="text-xs sm:text-sm font-semibold">No users found</p>
                                            {search && <p className="text-[10px] sm:text-xs">Try adjusting your search or filters</p>}
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.map((user: any, i) => (
                                <tr key={user._id ?? i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">

                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                                        <div className="flex items-center gap-2 sm:gap-2.5">
                                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/20 border border-violet-500/25
                                        flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-violet-400 shrink-0">
                                                {user.displayFirst?.charAt(0)?.toUpperCase() ?? "?"}
                                            </div>
                                            <span className="text-slate-200 font-medium text-xs sm:text-sm">{user.displayFirst}</span>
                                        </div>
                                    </td>

                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-slate-300 text-xs sm:text-sm">{user.displayLast}</td>

                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                                        <a href={`tel:${user.phone}`} className="text-slate-400 hover:text-violet-400 transition-colors font-mono text-[10px] sm:text-xs">
                                            {user.phone}
                                        </a>
                                    </td>

                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                                        <a href={`mailto:${user.email}`} className="text-slate-400 hover:text-violet-400 transition-colors text-xs sm:text-sm break-all">
                                            {user.email}
                                        </a>
                                    </td>

                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">
                                        <span className={`text-xs sm:text-sm mr-1 sm:mr-1.5 ${user.gender?.toLowerCase() === "female" ? "text-pink-400" : "text-blue-400"}`}>
                                            {GENDER_ICON[user.gender?.toLowerCase()] ?? ""}
                                        </span>
                                        <span className="text-slate-400 capitalize text-[10px] sm:text-xs">{user.gender}</span>
                                    </td>

                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-semibold capitalize border ${ROLE_BADGE[user.role] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>

                                    {/* Speciality — powered by extractSpecialities() */}
                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                                        <div className="flex flex-wrap gap-1 max-w-[180px] sm:max-w-[220px]">
                                            {user.specialities.length > 0
                                                ? user.specialities.map((s: string) => (
                                                    <span key={s}
                                                        className="px-1.5 sm:px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20
                                           text-emerald-400 text-[9px] sm:text-[11px] rounded sm:rounded-md font-medium whitespace-nowrap">
                                                        {s}
                                                    </span>
                                                ))
                                                : <span className="text-slate-600 text-[10px] sm:text-xs">—</span>
                                            }
                                        </div>
                                    </td>

                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-semibold ${user.isActive ? "text-emerald-400" : "text-slate-500"
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user.isActive ? "bg-emerald-400 shadow-sm shadow-emerald-400/60" : "bg-slate-600"
                                                }`} />
                                            {user.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>

                                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                                        <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                                            <button onClick={() => { setEditUser(user); setShowModal(true) }} title="Edit"
                                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/10 hover:bg-violet-500/25 border border-violet-500/20
                                     flex items-center justify-center text-violet-400 transition-all hover:scale-110">
                                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => setDeleteId(user._id)} title="Delete"
                                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20
                                     flex items-center justify-center text-red-400 transition-all hover:scale-110">
                                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                    {data.length !== filtered.length && <span className="text-slate-600"> (filtered from {data.length})</span>}
                </p>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border border-white/[0.08] text-slate-400
                           hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        Previous
                    </button>
                    {pageButtons.map((p, i) =>
                        p === "..."
                            ? <span key={`d${i}`} className="px-1 sm:px-1.5 text-slate-600 text-[10px] sm:text-xs select-none">…</span>
                            : <button key={p} onClick={() => setPage(p as number)}
                                className={`w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-all ${page === p ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-white/[0.08]"
                                    }`}>{p}</button>
                    )}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border border-white/[0.08] text-slate-400
                           hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        Next
                    </button>
                </div>
            </div>

            {showModal && (
                <AddUserModal user={editUser} onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); refresh() }} />
            )}

            {deleteId !== null && (
                <DeleteDialog onCancel={() => setDeleteId(null)}
                    onConfirm={async () => {
                        try { await API.delete(`/users/${deleteId}`); refresh() }
                        catch (e) { console.error(e) }
                        finally { setDeleteId(null) }
                    }} />
            )}
        </>
    )
}

function SortArrow({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
    return (
        <span className="inline-flex flex-col gap-[2px]">
            <span className={`block w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-transparent
                        ${active && dir === "asc" ? "border-b-violet-400" : "border-b-slate-600"}`} />
            <span className={`block w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent
                        ${active && dir === "desc" ? "border-t-violet-400" : "border-t-slate-600"}`} />
        </span>
    )
}

function DeleteDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[#1a1d2e] border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl z-10">
                <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-white">Delete User</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">This cannot be undone.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full">
                        <button onClick={onCancel}
                            className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl border border-white/10
                             text-slate-300 hover:bg-white/5 transition-colors order-2 sm:order-1">Cancel</button>
                        <button onClick={onConfirm}
                            className="w-full sm:flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-500
                             text-white transition-colors order-1 sm:order-2">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    )
}