"use client"

import React, { useState, useEffect, useCallback } from "react"
import type { User } from "./Getalluserdata"
import API from "@/lib/axios"

// ── Constants ────────────────────────────────────────────────────────────────
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

interface FormState {
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

type FormErrors = Partial<Record<keyof FormState | "general" | "speciality", string>>

const EMPTY: FormState = {
  firstName: "", lastName: "", email: "", phone: "",
  gender: "male", role: "staff", password: "",
  speciality: [], isActive: true,
}

// ── Validators ───────────────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isValidPhone = (v: string) => /^\d{10}$/.test(v.trim())
const isValidPassword = (v: string) =>
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(v)

// ── Component ────────────────────────────────────────────────────────────────
export default function AddUserModal({ user, onClose, onSuccess }: AddUserModalProps) {
  const isEdit = !!user

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errs, setErrs] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // ── Populate form on edit ─────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      const raw = user as any
      setForm({
        firstName:  raw.fname       ?? raw.firstName  ?? "",
        lastName:   raw.lname       ?? raw.lastName   ?? "",
        email:      raw.email       ?? "",
        phone:      raw.phone       ?? "",
        gender:     raw.gender      ?? "male",
        role:       raw.role        ?? "staff",
        password:   "",
        speciality: Array.isArray(raw.speciality)
          ? raw.speciality
          : Array.isArray(raw.Services)
            ? raw.Services.map((s: any) => s.name ?? "").filter(Boolean)
            : [],
        isActive:   raw.isActive    ?? true,
      })
    } else {
      setForm(EMPTY)
    }
    setErrs({})
    setShowPass(false)
  }, [user])

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  // ── Stable field handlers (prevents input remount) ────────────────────────
  const setFirstName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, firstName: e.target.value }))
    setErrs(p => ({ ...p, firstName: undefined }))
  }, [])

  const setLastName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, lastName: e.target.value }))
    setErrs(p => ({ ...p, lastName: undefined }))
  }, [])

  const setEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, email: e.target.value }))
    setErrs(p => ({ ...p, email: undefined }))
  }, [])

  // Phone: digits only, max 10
  const handlePhone = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
    setForm(f => ({ ...f, phone: digits }))
    setErrs(p => ({ ...p, phone: undefined }))
  }, [])

  const setPassword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, password: e.target.value }))
    setErrs(p => ({ ...p, password: undefined }))
  }, [])

  const setGender = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, gender: e.target.value }))
  }, [])

  const setRole = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, role: e.target.value, speciality: [] }))
    setErrs(p => ({ ...p, speciality: undefined }))
  }, [])

  const toggleActive = useCallback(() => {
    setForm(f => ({ ...f, isActive: !f.isActive }))
  }, [])

  const toggleSpec = useCallback((s: string) => {
    setForm(f => ({
      ...f,
      speciality: f.speciality.includes(s)
        ? f.speciality.filter(x => x !== s)
        : [...f.speciality, s],
    }))
    setErrs(p => ({ ...p, speciality: undefined }))
  }, [])

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {}

    // First name
    if (!form.firstName.trim())
      e.firstName = "First name is required."
    else if (form.firstName.trim().length < 2)
      e.firstName = "First name must be at least 2 characters."

    // Last name
    if (!form.lastName.trim())
      e.lastName = "Last name is required."
    else if (form.lastName.trim().length < 2)
      e.lastName = "Last name must be at least 2 characters."

    // Email
    if (!form.email.trim())
      e.email = "Email address is required."
    else if (!isValidEmail(form.email))
      e.email = "Enter a valid email address (e.g. john@example.com)."

    // Phone
    if (!form.phone.trim())
      e.phone = "Phone number is required."
    else if (!isValidPhone(form.phone))
      e.phone = `Phone must be exactly 10 digits (${form.phone.length}/10 entered).`

    // Password
    if (!isEdit) {
      if (!form.password.trim())
        e.password = "Password is required."
      else if (form.password.length < 8)
        e.password = "Password must be at least 8 characters."
      else if (!isValidPassword(form.password))
        e.password = "Must include letters, numbers & a special character (!@#$...)."
    } else if (form.password.trim()) {
      if (form.password.length < 8)
        e.password = "Password must be at least 8 characters."
      else if (!isValidPassword(form.password))
        e.password = "Must include letters, numbers & a special character (!@#$...)."
    }

    // Speciality (doctor only)
    if (form.role === "doctor" && form.speciality.length === 0)
      e.speciality = "Please select at least one speciality for a doctor."

    setErrs(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        fname:      form.firstName.trim(),
        lname:      form.lastName.trim(),
        email:      form.email.trim().toLowerCase(),
        phone:      form.phone.trim(),
        gender:     form.gender,
        role:       form.role,
        speciality: form.speciality,
        isActive:   form.isActive,
      }
      if (form.password.trim()) payload.password = form.password

      if (isEdit) {
        await API.put(`/users/${(user as any).id}`, payload)
      } else {
        await API.post("/users", payload)
      }
      onSuccess()
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.response?.data?.errors?.[0] ??
        "Something went wrong. Please try again."
      setErrs({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-[#13152a] border border-white/10 rounded-2xl w-full max-w-xl
                      shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30
                            flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEdit ? "Edit User" : "Add New User"}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isEdit ? "Update the user's details below" : "Fill in the form to create a new user"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center
                       text-slate-500 hover:text-slate-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          autoComplete="off"
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

            {/* General error banner */}
            {errs.general && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm text-red-400">{errs.general}</p>
              </div>
            )}

            {/* Row 1 — First / Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" id="modal-fname" required error={errs.firstName}>
                <input
                  id="modal-fname"
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={setFirstName}
                  className={inputCls(!!errs.firstName)}
                />
              </Field>
              <Field label="Last Name" id="modal-lname" required error={errs.lastName}>
                <input
                  id="modal-lname"
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={setLastName}
                  className={inputCls(!!errs.lastName)}
                />
              </Field>
            </div>

            {/* Email */}
            <Field label="Email Address" id="modal-email" required error={errs.email}>
              <input
                id="modal-email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={setEmail}
                className={inputCls(!!errs.email)}
              />
            </Field>

            {/* Row 2 — Phone / Gender */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" id="modal-phone" required error={errs.phone}>
                <div className="relative">
                  <input
                    id="modal-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="9000000000"
                    maxLength={10}
                    value={form.phone}
                    onChange={handlePhone}
                    className={inputCls(!!errs.phone)}
                  />
                  {/* live digit counter */}
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono
                    ${form.phone.length === 10 ? "text-emerald-500" : "text-slate-600"}`}>
                    {form.phone.length}/10
                  </span>
                </div>
              </Field>

              <Field label="Gender" id="modal-gender">
                <select
                  id="modal-gender"
                  value={form.gender}
                  onChange={setGender}
                  className={selectCls}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            {/* Row 3 — Role / Password */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Role" id="modal-role">
                <select
                  id="modal-role"
                  value={form.role}
                  onChange={setRole}
                  className={selectCls}
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="doctor">Doctor</option>
                </select>
              </Field>

              <Field
                label={isEdit ? "Password (leave blank to keep)" : "Password"}
                id="modal-pass"
                required={!isEdit}
                error={errs.password}
              >
                <div className="relative">
                  <input
                    id="modal-pass"
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={setPassword}
                    className={inputCls(!!errs.password) + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
                {/* Password strength hint */}
                {!isEdit && form.password.length > 0 && (
                  <PasswordStrength password={form.password} />
                )}
              </Field>
            </div>

            {/* Specialities — doctor only */}
            {form.role === "doctor" && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Specialities
                  <span className="text-violet-400 ml-0.5">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALITIES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpec(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.speciality.includes(s)
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {errs.speciality && (
                  <p className="text-[11px] text-red-400 mt-1">{errs.speciality}</p>
                )}
              </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
              <div>
                <p className="text-sm font-semibold text-slate-200">Active Status</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {form.isActive
                    ? "User can log in and access the system"
                    : "Account is deactivated — user cannot log in"}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleActive}
                role="switch"
                aria-checked={form.isActive}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                  form.isActive ? "bg-violet-600" : "bg-white/10"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                                  transition-transform duration-200 ${form.isActive ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex gap-2.5 px-6 py-4 border-t border-white/[0.06] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/10 text-slate-300
                         hover:bg-white/5 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500
                         text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
            >
              {loading
                ? <><Spinner />{isEdit ? "Saving..." : "Creating..."}</>
                : isEdit ? "Save Changes" : "Create User"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Password Strength Indicator ───────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[a-zA-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  ]
  const score = checks.filter(Boolean).length

  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][score]
  const color = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"][score]
  const textColor = ["text-red-400", "text-red-400", "text-amber-400", "text-emerald-400", "text-emerald-400"][score]

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? color : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${textColor}`}>{label}</p>
    </div>
  )
}

// ── Styled helpers ────────────────────────────────────────────────────────────
const inputCls = (hasErr: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl bg-[#0d0f1e] border text-sm text-slate-200
   placeholder:text-slate-600 outline-none transition-all focus:ring-2 focus:ring-offset-0
   ${hasErr
     ? "border-red-500/60 focus:ring-red-500/25"
     : "border-white/10 hover:border-white/20 focus:ring-violet-500/40 focus:border-violet-500/50"
   }`

const selectCls =
  `w-full px-3.5 py-2.5 rounded-xl bg-[#0d0f1e] border border-white/10 text-sm text-slate-200
   outline-none transition-all cursor-pointer hover:border-white/20
   focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50
   [&>option]:bg-[#13152a] [&>option]:text-slate-200`

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label, id, required, error, children,
}: {
  label: string
  id: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
      >
        {label}
        {required && <span className="text-violet-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Micro components ──────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
)

const EyeOn = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
         -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOff = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
         a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
         M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29
         M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
         a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)