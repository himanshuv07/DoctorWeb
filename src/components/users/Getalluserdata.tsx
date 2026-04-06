"use client"

import React, { useEffect, useState, useCallback } from "react"
import API from "@/lib/axios"
import DataTable from "./DataTable.tsx"

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAllUserData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await API.get("/users")
      setTableData(Array.isArray(response.data.users) ? response.data.users : [])
    } catch (err) {
      setError("Failed to fetch users. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getAllUserData()
  }, [getAllUserData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading users...</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-200 font-semibold">{error}</p>
            <p className="text-slate-500 text-sm mt-1">Check your connection and try again</p>
          </div>
          <button
            onClick={getAllUserData}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">User Table</h1>
        <nav className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
          <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-300">User</span>
        </nav>
      </div>

      {/* Data Table Card */}
      <div className="bg-[#1a1d2e] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            User Datatable
          </h2>
        </div>
        <div className="p-4">
          <DataTable data={tableData} refresh={getAllUserData} />
        </div>
      </div>
    </div>
  )
}