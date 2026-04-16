"use client"

import React, { useEffect, useState, useCallback } from "react"
import API from "@/lib/axios"
import DataTable from "./DataTable"

export interface User {
  id: string | number
  firstName: string
  lastName: string
  phone: string
  email: string
  gender: string
  role: "admin" | "staff" | "doctor"
  speciality?: string[]
  isActive: boolean
}

export default function GetAllUserData() {
  const [tableData, setTableData] = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const getAllUserData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await API.get("/users")
      // support both { users: [...] } and [...] response shapes
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.users)
          ? response.data.users
          : []
      setTableData(list)
    } catch (err) {
      setError("Failed to fetch users. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { getAllUserData() }, [getAllUserData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 sm:border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-400 font-medium">Loading users...</p>
        </div>
      </div>
    )
  }

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
          <button onClick={getAllUserData}
            className="px-4 sm:px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">User Table</h1>
        <nav className="flex items-center gap-1 sm:gap-1.5 mt-1 text-[10px] sm:text-xs text-slate-500">
          <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-300">User</span>
        </nav>
      </div>

      {/* Card */}
      <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] flex items-center gap-2">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">User Datatable</h2>
        </div>
        <div className="p-3 sm:p-4 md:p-5">
          <DataTable data={tableData} refresh={getAllUserData} />
        </div>
      </div>
    </div>
  )
}