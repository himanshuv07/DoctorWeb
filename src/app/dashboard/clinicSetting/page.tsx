"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

// ✅ Flat — mirrors DB columns returned by GET (no nested smtp object)
type ClinicType = {
  id: number;
  clinicName: string;
  logo?: string | null;
  startDay: string;
  leaveDays?: string[] | null;
  timezone?: string;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpTls?: boolean | null;
};

type FormDataType = {
  clinicName: string;
  logo: string;
  startDay: string;
  leaveDays: string[];
  timezone: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpHost: string;
  smtpPort: string;
  smtpTls: boolean;
};

type FieldErrors = Partial<Record<keyof FormDataType, string>>;

const DAYS_OF_WEEK = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
];

const TIMEZONES = [
  { value: "Asia/Kolkata",       label: "(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi" },
  { value: "America/New_York",   label: "(GMT-5:00) Eastern Time (US & Canada)" },
  { value: "America/Chicago",    label: "(GMT-6:00) Central Time (US & Canada)" },
  { value: "America/Denver",     label: "(GMT-7:00) Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles",label: "(GMT-8:00) Pacific Time (US & Canada)" },
  { value: "Europe/London",      label: "(GMT+0:00) London, Edinburgh, Dublin" },
  { value: "Europe/Paris",       label: "(GMT+1:00) Paris, Berlin, Rome, Madrid" },
  { value: "Asia/Dubai",         label: "(GMT+4:00) Abu Dhabi, Muscat" },
  { value: "Asia/Singapore",     label: "(GMT+8:00) Singapore, Kuala Lumpur" },
  { value: "Asia/Tokyo",         label: "(GMT+9:00) Tokyo, Osaka, Sapporo" },
  { value: "Australia/Sydney",   label: "(GMT+10:00) Sydney, Melbourne" },
];

const initialForm: FormDataType = {
  clinicName:   "",
  logo:         "",
  startDay:     "sunday",
  leaveDays:    [],
  timezone:     "Asia/Kolkata",
  smtpUsername: "",
  smtpPassword: "",
  smtpHost:     "",
  smtpPort:     "587",
  smtpTls:      false,
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(form: FormDataType): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.clinicName.trim()) {
    errors.clinicName = "Clinic name is required.";
  } else if (form.clinicName.trim().length < 2) {
    errors.clinicName = "Clinic name must be at least 2 characters.";
  } else if (form.clinicName.trim().length > 100) {
    errors.clinicName = "Clinic name must be under 100 characters.";
  }

  if (form.logo && !/^https?:\/\/.+\..+/.test(form.logo.trim())) {
    errors.logo = "Logo must be a valid URL starting with http:// or https://.";
  }

  // SMTP: if any smtp field is filled, all are required
  const hasSmtp = form.smtpUsername || form.smtpPassword || form.smtpHost;

  if (hasSmtp) {
    if (!form.smtpUsername.trim()) {
      errors.smtpUsername = "SMTP username is required when configuring SMTP.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.smtpUsername.trim())) {
      errors.smtpUsername = "SMTP username must be a valid email address.";
    }

    if (!form.smtpPassword.trim()) {
      errors.smtpPassword = "SMTP password is required when configuring SMTP.";
    } else if (form.smtpPassword.length < 4) {
      errors.smtpPassword = "SMTP password must be at least 4 characters.";
    }

    if (!form.smtpHost.trim()) {
      errors.smtpHost = "SMTP host is required when configuring SMTP.";
    } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.smtpHost.trim())) {
      errors.smtpHost = "SMTP host must be a valid hostname (e.g. smtp.gmail.com).";
    }

    if (!form.smtpPort) {
      errors.smtpPort = "SMTP port is required when configuring SMTP.";
    } else {
      const port = Number(form.smtpPort);
      if (isNaN(port) || !Number.isInteger(port) || port < 1 || port > 65535) {
        errors.smtpPort = "SMTP port must be an integer between 1 and 65535.";
      }
    }
  } else if (form.smtpPort && form.smtpPort !== "587") {
    const port = Number(form.smtpPort);
    if (isNaN(port) || !Number.isInteger(port) || port < 1 || port > 65535) {
      errors.smtpPort = "SMTP port must be an integer between 1 and 65535.";
    }
  }

  return errors;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: number; type: ToastType; title: string; message: string; }
let _toastId = 0;

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; title: string; progress: string }> = {
  success: { bg: "bg-[#0a1f12]", border: "border-emerald-600/60", icon: "text-emerald-400", title: "text-emerald-300", progress: "bg-emerald-500" },
  error:   { bg: "bg-[#1f0a0a]", border: "border-red-600/60",     icon: "text-red-400",     title: "text-red-300",     progress: "bg-red-500"     },
  warning: { bg: "bg-[#1f1500]", border: "border-amber-500/60",   icon: "text-amber-400",   title: "text-amber-300",   progress: "bg-amber-500"   },
  info:    { bg: "bg-[#0a1020]", border: "border-violet-500/60",  icon: "text-violet-400",  title: "text-violet-300",  progress: "bg-violet-500"  },
};

function ToastIcon({ type }: { type: ToastType }) {
  const cls = "w-4 h-4 flex-shrink-0";
  if (type === "success") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (type === "error")   return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (type === "warning") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>;
  return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))] pointer-events-none">
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.type];
        return (
          <div key={t.id} className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border ${s.bg} ${s.border} shadow-2xl pointer-events-auto overflow-hidden`}>
            <span className={`mt-0.5 ${s.icon}`}><ToastIcon type={t.type} /></span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${s.title}`}>{t.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{t.message}</p>
            </div>
            <button onClick={() => remove(t.id)} className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className={`absolute bottom-0 left-0 h-[2px] ${s.progress} opacity-40 animate-[shrink_4s_linear_forwards]`} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Field error ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 mt-1.5 text-[11px] text-red-400">
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {message}
    </p>
  );
}

// ─── Input primitives ─────────────────────────────────────────────────────────

const inputBase  = "w-full rounded-xl border bg-[#141a2f] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 transition-all";
const inputOk    = "border-white/10 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15";
const inputBad   = "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15";

function TextInput({ name, value, onChange, placeholder, type = "text", error, disabled }: {
  name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; error?: string; disabled?: boolean;
}) {
  return (
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className={`${inputBase} ${error ? inputBad : inputOk} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} />
  );
}

function SelectInput({ name, value, onChange, children, error }: {
  name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode; error?: string;
}) {
  return (
    <select name={name} value={value} onChange={onChange}
      className={`${inputBase} ${error ? inputBad : inputOk} [&>option]:bg-[#13152a] cursor-pointer`}>
      {children}
    </select>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-slate-400">
      {children}{required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5 pb-4 border-b border-white/[0.06]">
      <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-violet-400">{icon}</span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClinicSettingPage() {
  // ✅ clinicId is the source of truth for whether a record exists.
  // Once set to a number it never goes null again — locks submit to PUT only.
  const [clinicId, setClinicId]           = useState<number | null>(null);
  const [loading, setLoading]             = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageError, setPageError]         = useState<string | null>(null);
  const [fieldErrors, setFieldErrors]     = useState<FieldErrors>({});
  const [toasts, setToasts]               = useState<Toast[]>([]);
  const [formData, setFormData]           = useState<FormDataType>(initialForm);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [logoError, setLogoError]         = useState(false);
  const toastTimers                       = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, type, title, message }]);
    const t = setTimeout(() => {
      setToasts((p) => p.filter((x) => x.id !== id));
      toastTimers.current.delete(id);
    }, 4000);
    toastTimers.current.set(id, t);
  }, []);

  const removeToast = useCallback((id: number) => {
    const t = toastTimers.current.get(id);
    if (t) { clearTimeout(t); toastTimers.current.delete(id); }
    setToasts((p) => p.filter((x) => x.id !== id));
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchClinic = useCallback(async () => {
    try {
      setLoading(true);
      setPageError(null);

      const res = await axios.get("/clinicSetting");
      // ✅ data is now a plain flat object (or null if no record yet)
      const data: ClinicType | null = res.data?.data ?? null;

      if (data?.id) {
        // ✅ Persist the id — once set, submit will always PUT
        setClinicId(data.id);
        setFormData({
          clinicName:   data.clinicName          ?? "",
          logo:         data.logo                ?? "",
          startDay:     data.startDay            ?? "sunday",
          leaveDays:    data.leaveDays           ?? [],
          timezone:     data.timezone            ?? "Asia/Kolkata",
          // ✅ Read flat fields directly — no data.smtp.username
          smtpUsername: data.smtpUsername        ?? "",
          smtpPassword: data.smtpPassword        ?? "",
          smtpHost:     data.smtpHost            ?? "",
          smtpPort:     String(data.smtpPort     ?? 587),
          smtpTls:      data.smtpTls             ?? false,
        });
      }
      // If data is null the form stays at initialForm — user will POST once
    } catch {
      setPageError("Failed to load clinic settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinic();
    return () => { toastTimers.current.forEach(clearTimeout); };
  }, [fetchClinic]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((p) => ({ ...p, [name]: val }));
    if (fieldErrors[name as keyof FormDataType]) {
      setFieldErrors((p) => { const n = { ...p }; delete n[name as keyof FormDataType]; return n; });
    }
    if (name === "logo") setLogoError(false);
  };

  const handleLeaveDay = (day: string) => {
    setFormData((p) => ({
      ...p,
      leaveDays: p.leaveDays.includes(day) ? p.leaveDays.filter((d) => d !== day) : [...p.leaveDays, day],
    }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errors = validateForm(formData);
    setFieldErrors(errors);

    const count = Object.keys(errors).length;
    if (count > 0) {
      addToast("error", "Please fix the errors below", `${count} field${count > 1 ? "s need" : " needs"} your attention.`);
      return;
    }

    // ✅ Always flat payload — matches both POST and PUT backend field names
    const payload = {
      clinicName:   formData.clinicName.trim(),
      logo:         formData.logo.trim()      || null,
      startDay:     formData.startDay,
      leaveDays:    formData.leaveDays,
      timezone:     formData.timezone,
      smtpUsername: formData.smtpUsername.trim() || null,
      smtpPassword: formData.smtpPassword        || null,
      smtpHost:     formData.smtpHost.trim()     || null,
      smtpPort:     formData.smtpPort ? Number(formData.smtpPort) : null,
      smtpTls:      formData.smtpTls,
    };

    try {
      setSubmitLoading(true);

      if (clinicId) {
        // ✅ Record exists → always PUT, never POST again from frontend
        await axios.put(`/clinicSetting/${clinicId}`, payload);
        addToast("success", "Settings Saved", "Clinic settings updated successfully.");
      } else {
        // First time only
        const res = await axios.post("/clinicSetting", payload);
        // ✅ Lock in the id immediately so next save is always a PUT
        const created: ClinicType = res.data?.data;
        if (created?.id) setClinicId(created.id);
        addToast("success", "Clinic Created", "Your clinic settings have been saved.");
      }

      await fetchClinic();
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        apiErrors.forEach((msg: string) => addToast("error", "Server Error", msg));
      } else {
        addToast("error", "Failed to Save", err?.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading settings…</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-200 font-semibold">{pageError}</p>
            <p className="text-xs text-slate-500 mt-1">Check your connection and try again</p>
          </div>
          <button onClick={fetchClinic} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const smtpHasError = (["smtpUsername","smtpPassword","smtpHost","smtpPort"] as const).some((k) => fieldErrors[k]);

  const IconClinic = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
  const IconSMTP = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes shrink{from{width:100%}to{width:0%}}`}</style>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <div className="p-3 sm:p-5 md:p-7 max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* Heading */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Clinic Settings</h1>
          <nav className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-300">Settings</span>
          </nav>
        </div>

        <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
          {/* Card header */}
          <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Configuration</h2>
            {clinicId && (
              <span className="ml-auto text-[10px] text-slate-600 font-mono">ID #{clinicId}</span>
            )}
          </div>

          <div className="p-4 sm:p-6 space-y-7">

            {/* ── Clinic Info ── */}
            <div>
              <SectionHeader icon={IconClinic} title="Clinic Information" subtitle="Basic details about your clinic" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <FieldLabel required>Clinic Name</FieldLabel>
                  <TextInput name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="e.g. Bright Smile Dental" error={fieldErrors.clinicName} />
                  <FieldError message={fieldErrors.clinicName} />
                </div>

                <div>
                  <FieldLabel>Logo URL</FieldLabel>
                  <TextInput name="logo" value={formData.logo} onChange={handleChange} placeholder="https://example.com/logo.png" error={fieldErrors.logo} />
                  <FieldError message={fieldErrors.logo} />
                  {formData.logo && !fieldErrors.logo && /^https?:\/\/.+\..+/.test(formData.logo) && (
                    <div className="mt-2 flex items-center gap-2">
                      {!logoError ? (
                        <img src={formData.logo} alt="Logo preview" className="w-9 h-9 rounded-lg object-contain border border-white/10 bg-white/5 p-0.5" onError={() => setLogoError(true)} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                      )}
                      <span className="text-[11px] text-slate-500">{logoError ? "Could not load image" : "Preview"}</span>
                    </div>
                  )}
                  {!fieldErrors.logo && <p className="mt-1.5 text-[11px] text-slate-600">Must be a valid image URL (http/https)</p>}
                </div>

                <div>
                  <FieldLabel required>Week Start Day</FieldLabel>
                  <SelectInput name="startDay" value={formData.startDay} onChange={handleChange}>
                    {DAYS_OF_WEEK.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </SelectInput>
                </div>

                <div>
                  <FieldLabel required>Timezone</FieldLabel>
                  <SelectInput name="timezone" value={formData.timezone} onChange={handleChange}>
                    {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </SelectInput>
                </div>
              </div>

              {/* Leave Days */}
              <div className="mt-5">
                <FieldLabel>Leave Days</FieldLabel>
                <p className="text-[11px] text-slate-600 mb-2.5">Select the days your clinic is closed</p>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const checked = formData.leaveDays.includes(day);
                    return (
                      <button key={day} type="button" onClick={() => handleLeaveDay(day)}
                        className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-[11px] font-medium transition-all ${checked ? "bg-violet-500/20 border-violet-500/50 text-violet-300" : "bg-white/[0.03] border-white/[0.08] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"}`}>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${checked ? "bg-violet-600 border-violet-400" : "border-white/20 bg-white/5"}`}>
                          {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </span>
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* ── SMTP ── */}
            <div>
              <SectionHeader icon={IconSMTP} title="SMTP Settings" subtitle="Configure email delivery for notifications and reports" />

              {smtpHasError && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-red-500/8 border border-red-500/20 rounded-xl">
                  <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  <p className="text-[11px] text-red-400">If configuring SMTP, all fields are required.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <FieldLabel>Username (Email)</FieldLabel>
                  <TextInput name="smtpUsername" value={formData.smtpUsername} onChange={handleChange} placeholder="smtp@yourdomain.com" error={fieldErrors.smtpUsername} />
                  <FieldError message={fieldErrors.smtpUsername} />
                </div>

                <div>
                  <FieldLabel>Password</FieldLabel>
                  <div className="relative">
                    <input type={showSmtpPassword ? "text" : "password"} name="smtpPassword" value={formData.smtpPassword} onChange={handleChange} placeholder="••••••••"
                      className={`${inputBase} pr-10 ${fieldErrors.smtpPassword ? inputBad : inputOk}`} />
                    <button type="button" tabIndex={-1} onClick={() => setShowSmtpPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showSmtpPassword
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    </button>
                  </div>
                  <FieldError message={fieldErrors.smtpPassword} />
                </div>

                <div>
                  <FieldLabel>Host</FieldLabel>
                  <TextInput name="smtpHost" value={formData.smtpHost} onChange={handleChange} placeholder="smtp.gmail.com" error={fieldErrors.smtpHost} />
                  <FieldError message={fieldErrors.smtpHost} />
                </div>

                <div>
                  <FieldLabel>Port</FieldLabel>
                  <TextInput name="smtpPort" value={formData.smtpPort} onChange={handleChange} placeholder="587" type="number" error={fieldErrors.smtpPort} />
                  <FieldError message={fieldErrors.smtpPort} />
                  {!fieldErrors.smtpPort && <p className="mt-1.5 text-[11px] text-slate-600">Common: 25, 465 (SSL), 587 (TLS), 2525</p>}
                </div>
              </div>

              {/* TLS toggle */}
              <div className="mt-5">
                <button type="button" onClick={() => setFormData((p) => ({ ...p, smtpTls: !p.smtpTls }))}
                  className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${formData.smtpTls ? "bg-violet-500/20 border-violet-500/50 text-violet-300" : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300"}`}>
                  <span className={`relative inline-flex w-9 h-5 rounded-full border transition-all ${formData.smtpTls ? "bg-violet-600 border-violet-400" : "bg-white/10 border-white/15"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${formData.smtpTls ? "left-4" : "left-0.5"}`} />
                  </span>
                  Enable TLS / STARTTLS
                </button>
                <p className="mt-1.5 text-[11px] text-slate-600">Recommended for secure email delivery (port 587)</p>
              </div>
            </div>

            {/* ── Footer / Save ── */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/[0.06]">
              <p className="text-[11px] text-slate-600">
                {clinicId
                  ? "Changes will update your existing clinic configuration."
                  : "This will create your clinic's settings for the first time."}
              </p>
              <button onClick={handleSubmit} disabled={submitLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">
                {submitLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>{clinicId ? "Save Changes" : "Create Clinic"}</>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}