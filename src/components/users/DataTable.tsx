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
    admin: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    staff: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    doctor: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
}

const GENDER_ICON: Record<string, string> = {
    male: "♂",
    female: "♀",
    other: "⚧",
}

export default function DataTable({ data, refresh }: DataTableProps) {
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [showModal, setShowModal] = useState(false)
    const [editUser, setEditUser] = useState<User | null>(null)
    const [deleteId, setDeleteId] = useState<string | number | null>(null)
    const [sortKey, setSortKey] = useState<keyof User>("firstName")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
    const searchRef = useRef<HTMLInputElement>(null)

    /* ── Filtering + Sorting ── */
    const filtered = useMemo(() => {
        const normalizedData = data.map((u) => ({
            ...u,
            firstName: (u as any).fname,
            lastName: (u as any).lname,
        }))
        const q = search.toLowerCase().trim()
        return normalizedData
            .filter((u) => roleFilter === "all" || u.role === roleFilter)
            .filter((u) =>
                !q ||
                u.firstName?.toLowerCase().includes(q) ||
                u.lastName?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.phone?.includes(q) ||
                u.role?.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                const av = String(a[sortKey] ?? "").toLowerCase()
                const bv = String(b[sortKey] ?? "").toLowerCase()
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
            })
    }, [data, search, roleFilter, sortKey, sortDir])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

    const handleSort = (key: keyof User) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        else { setSortKey(key); setSortDir("asc") }
    }

    const handlePageSize = (n: number) => { setPageSize(n); setPage(1) }
    const handleSearch = (v: string) => { setSearch(v); setPage(1) }
    const handleRole = (r: RoleFilter) => { setRoleFilter(r); setPage(1) }

    const SortIcon = ({ col }: { col: keyof User }) => (
        <span className="ml-1 inline-flex flex-col gap-[2px] opacity-40">
            <span className={`block w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-transparent ${sortKey === col && sortDir === "asc" ? "border-b-violet-400 opacity-100" : "border-b-slate-500"}`} />
            <span className={`block w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-transparent ${sortKey === col && sortDir === "desc" ? "border-t-violet-400 opacity-100" : "border-t-slate-500"}`} />
        </span>
    )

    /* ── Pagination buttons ── */
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

    return (
        <>
            {/* ── Top Controls ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                {/* Add User */}
                <button
                    onClick={() => { setEditUser(null); setShowModal(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 active:scale-95
                     text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/40"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add User
                </button>

                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 w-56 bg-white/5 border border-white/10 rounded-xl text-sm
                       text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2
                       focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                    />
                    {search && (
                        <button onClick={() => handleSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Role Filter Tabs ── */}
            <div className="flex items-center gap-1 mb-5">
                <span className="text-xs text-slate-500 mr-2 font-medium">Role:</span>
                {(["all", "admin", "staff", "doctor"] as RoleFilter[]).map((r) => (
                    <button
                        key={r}
                        onClick={() => handleRole(r)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${roleFilter === r
                            ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5"
                            }`}
                    >
                        {r}
                    </button>
                ))}
                <span className="ml-auto text-xs text-slate-600">
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ── Entries selector ── */}
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                <span>Show</span>
                <select
                    value={pageSize}
                    onChange={(e) => handlePageSize(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-slate-300
                     focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
                >
                    {ENTRIES_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.03]">
                            {([
                                ["firstName", "First Name"],
                                ["lastName", "Last Name"],
                                ["phone", "Phone"],
                                ["email", "Email"],
                                ["gender", "Gender"],
                                ["role", "Role"],
                            ] as [keyof User, string][]).map(([key, label]) => (
                                <th
                                    key={key}
                                    onClick={() => handleSort(key)}
                                    className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider
                             cursor-pointer select-none hover:text-slate-200 transition-colors whitespace-nowrap"
                                >
                                    <span className="flex items-center">
                                        {label}
                                        <SortIcon col={key} />
                                    </span>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Speciality
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Status
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.04]">
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-slate-600">
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-sm font-medium">No users found</p>
                                        {search && <p className="text-xs">Try adjusting your search or filters</p>}
                                    </div>
                                </td>
                            </tr>
                        ) : paginated.map((user, i) => (
                            <tr
                                key={user.id ?? i}
                                className="group hover:bg-white/[0.03] transition-colors"
                            >
                                {/* First Name with avatar */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30
                                    flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">
                                            {user.firstName?.charAt(0)?.toUpperCase() ?? "?"}
                                        </div>
                                        <span className="text-slate-200 font-medium">{user.firstName}</span>
                                    </div>
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap text-slate-300">{user.lastName}</td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    <a href={`tel:${user.phone}`}
                                        className="text-slate-400 hover:text-violet-400 transition-colors font-mono text-xs">
                                        {user.phone}
                                    </a>
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    <a href={`mailto:${user.email}`}
                                        className="text-slate-400 hover:text-violet-400 transition-colors">
                                        {user.email}
                                    </a>
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`text-sm ${user.gender === "female" ? "text-pink-400" : "text-blue-400"}`}>
                                        {GENDER_ICON[user.gender?.toLowerCase()] ?? "–"}
                                    </span>
                                    <span className="text-slate-400 capitalize ml-1.5 text-xs">{user.gender}</span>
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${ROLE_BADGE[user.role] ?? "bg-slate-500/10 text-slate-400"}`}>
                                        {user.role}
                                    </span>
                                </td>

                                {/* Speciality tags */}
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {user.speciality?.length ? user.speciality.map((s) => (
                                            <span key={s}
                                                className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25
                                   text-emerald-400 text-xs rounded-md font-medium whitespace-nowrap">
                                                {s}
                                            </span>
                                        )) : (
                                            <span className="text-slate-600 text-xs">—</span>
                                        )}
                                    </div>
                                </td>

                                {/* Active Status */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${user.isActive ? "text-emerald-400" : "text-slate-500"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-400 shadow-sm shadow-emerald-400/60" : "bg-slate-600"}`} />
                                        {user.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditUser(user); setShowModal(true) }}
                                            title="Edit user"
                                            className="w-7 h-7 rounded-lg bg-violet-500/10 hover:bg-violet-500/25 border border-violet-500/20
                                 flex items-center justify-center text-violet-400 transition-all hover:scale-110"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => setDeleteId(user.id)}
                                            title="Delete user"
                                            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20
                                 flex items-center justify-center text-red-400 transition-all hover:scale-110"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Always visible icon fallback */}
                                    <div className="group-hover:hidden flex items-center justify-center">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30
                                    flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    {/* Repeat header as footer for long tables */}
                    {paginated.length > 5 && (
                        <tfoot>
                            <tr className="border-t border-white/5 bg-white/[0.02]">
                                {["First Name", "Last Name", "Phone", "Email", "Gender", "Role", "Speciality", "Status", "Action"].map((h) => (
                                    <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* ── Footer: info + pagination ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="text-slate-300 font-medium">
                        {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="text-slate-300 font-medium">
                        {Math.min(page * pageSize, filtered.length)}
                    </span>{" "}
                    of{" "}
                    <span className="text-slate-300 font-medium">{filtered.length}</span>{" "}
                    entries
                    {data.length !== filtered.length && (
                        <span className="text-slate-600"> (filtered from {data.length} total)</span>
                    )}
                </p>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-slate-400
                       hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Previous
                    </button>

                    {pageButtons.map((p, i) =>
                        p === "..." ? (
                            <span key={`dots-${i}`} className="px-2 text-slate-600 text-xs select-none">…</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => setPage(p as number)}
                                className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${page === p
                                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/50"
                                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-white/10"
                                    }`}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-slate-400
                       hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* ── Add / Edit Modal ── */}
            {showModal && (
                <AddUserModal
                    user={editUser}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); refresh() }}
                />
            )}

            {/* ── Delete Confirm Dialog ── */}
            {deleteId !== null && (
                <DeleteConfirmDialog
                    userId={deleteId}
                    onCancel={() => setDeleteId(null)}
                    onConfirm={async () => {
                        try {
                            await API.delete(`/users/${deleteId}`)
                            refresh()
                        } catch (e) { console.error(e) }
                        finally { setDeleteId(null) }
                    }}
                />
            )}
        </>
    )
}

/* ──────────────────────────────────────────────────── */
/*  Delete Confirm Dialog                               */
/* ──────────────────────────────────────────────────── */
function DeleteConfirmDialog({
    onCancel, onConfirm,
}: { userId: string | number; onCancel: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[#1a1d2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Delete User</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            This action cannot be undone. The user will be permanently removed.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full">
                        <button onClick={onCancel}
                            className="flex-1 py-2 text-sm font-medium rounded-xl border border-white/10 text-slate-300
                         hover:bg-white/5 transition-colors">
                            Cancel
                        </button>
                        <button onClick={onConfirm}
                            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500
                         text-white transition-colors">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}