"use client"

import React, { useState, useEffect } from "react"
import type { User } from "./Getalluserdata"
import API from "@/lib/Axios"

interface AddUserModalProps {
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

const SPECIALITIES = [
  "Physiologist", "Cardiologist", "General Physician",
  "Gynaecologist", "Neurologist", "Dermatologist",
  "Orthopaedic", "Paediatrician", "Radiologist",
]

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  role: string
  password: string
  speciality: string[]
  isActive: boolean
}

const INIT: FormData = {
  firstName: "", lastName: "", email: "", phone: "",
  gender: "male", role: "staff", password: "",
  speciality: [], isActive: true,
}

export default function AddUserModal({ user, onClose, onSuccess }: AddUserModalProps) {
  const isEdit = !!user
  const [form, setForm]       = useState<FormData>(INIT)
  const [errors, setErrors]   = useState<Partial<FormData & { general: string }>>({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? "",
        lastName:  user.lastName  ?? "",
        email:     user.email     ?? "",
        phone:     user.phone     ?? "",
        gender:    user.gender    ?? "male",
        role:      user.role      ?? "staff",
        password:  "",
        speciality: user.speciality ?? [],
        isActive:  user.isActive  ?? true,
      })
    }
  }, [user])

  const set = (k: keyof FormData, v: string | boolean | string[]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const toggleSpeciality = (s: string) =>
    set("speciality", form.speciality.includes(s)
      ? form.speciality.filter((x) => x !== s)
      : [...form.speciality, s])

  const validate = (): boolean => {
    const e: Partial<FormData & { general: string }> = {}
    if (!form.firstName.trim()) e.firstName = "Required"
    if (!form.lastName.trim())  e.lastName  = "Required"
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required"
    if (!form.phone.trim() || form.phone.length < 7) e.phone = "Valid phone required"
    if (!isEdit && !form.password) e.password = "Password required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = { ...form, ...(isEdit && !form.password ? { password: undefined } : {}) }
      if (isEdit) {
        await API.put(`/users/${user!.id}`, payload)
      } else {
        await API.post("/users", payload)
      }
      onSuccess()
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message ?? "Something went wrong." })
    } finally {
      setLoading(false)
    }
  }

  const Field = ({
    label, name, type = "text", placeholder, children,
  }: {
    label: string; name: keyof FormData; type?: string; placeholder?: string; children?: React.ReactNode
  }) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      {children ?? (
        <input
          type={type}
          value={form[name] as string}
          onChange={(e) => set(name, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 bg-white/5 border rounded-xl text-sm text-slate-200
                      placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all
                      ${errors[name]
                        ? "border-red-500/50 focus:ring-red-500/30"
                        : "border-white/10 focus:ring-violet-500/40 focus:border-violet-500/50"}`}
        />
      )}
      {errors[name] && (
        <p className="text-xs text-red-400">{errors[name]}</p>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#13152a] border border-white/10 rounded-2xl w-full max-w-xl
                      shadow-2xl shadow-black/60 my-8 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30
                            flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{isEdit ? "Edit User" : "Add New User"}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? "Update user information" : "Fill in the details below"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center
                       text-slate-500 hover:text-slate-300 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errors.general && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" name="firstName" placeholder="e.g. John" />
            <Field label="Last Name"  name="lastName"  placeholder="e.g. Doe" />
          </div>

          <Field label="Email" name="email" type="email" placeholder="john@example.com" />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" name="phone" placeholder="+91 9000000000" />

            {/* Gender Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                           text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40
                           focus:border-violet-500/50 transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                           text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40
                           focus:border-violet-500/50 transition-all"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password {isEdit && <span className="text-slate-600 normal-case font-normal">(leave blank to keep)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 pr-10 bg-white/5 border rounded-xl text-sm text-slate-200
                              placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all
                              ${errors.password
                                ? "border-red-500/50 focus:ring-red-500/30"
                                : "border-white/10 focus:ring-violet-500/40 focus:border-violet-500/50"}`}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>
          </div>

          {/* Speciality (only for doctors) */}
          {form.role === "doctor" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Specialities
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALITIES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSpeciality(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.speciality.includes(s)
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                        : "bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-white/[0.03] rounded-xl border border-white/5">
            <div>
              <p className="text-sm font-medium text-slate-200">Active Status</p>
              <p className="text-xs text-slate-500 mt-0.5">User can log in and access the system</p>
            </div>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.isActive ? "bg-violet-600" : "bg-white/10"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                               transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/10 text-slate-300
                         hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500
                         text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : (isEdit ? "Save Changes" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}