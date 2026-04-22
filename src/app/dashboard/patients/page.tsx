"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "@/lib/axios";
import { toast, Toaster } from "react-hot-toast";
import { debounce } from "lodash";

/* ───────────────── TYPES ───────────────── */

type PatientType = {
    id: number;
    fname: string;
    lname: string;
    phone: string;
    email: string;
    gender: string;
    country: string;
    address1: string;
    address2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    createdAt?: string;
    updatedAt?: string;
};

type FormType = {
    fname: string;
    lname: string;
    phone: string;
    email: string;
    gender: string;
    country: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zipCode: string;
};

const initialForm: FormType = {
    fname: "",
    lname: "",
    phone: "",
    email: "",
    gender: "",
    country: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
};

const ENTRIES_OPTIONS = [10, 25, 50, 100];

/* ───────────────── LOADING SPINNER ───────────────── */

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f1119] to-[#13152a]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium animate-pulse">
                Loading patients...
            </p>
        </div>
    </div>
);

/* ───────────────── ERROR STATE ───────────────── */

const ErrorState = ({
    error,
    onRetry,
}: {
    error: string;
    onRetry: () => void;
}) => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f1119] to-[#13152a]">
        <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <svg
                    className="w-8 h-8 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
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
                <p className="text-slate-500 text-sm mt-1">
                    Check your connection and try again
                </p>
            </div>
            <button
                onClick={onRetry}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-violet-900/40"
            >
                Retry
            </button>
        </div>
    </div>
);

/* ───────────────── EMPTY STATE ───────────────── */

const EmptyState = ({
    search,
    onClear,
}: {
    search: string;
    onClear: () => void;
}) => (
    <div className="flex flex-col items-center gap-3 text-slate-600">
        <svg
            className="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
        <p className="text-sm font-semibold text-slate-300">No patients found</p>
        {search && (
            <>
                <p className="text-xs text-slate-500">
                    No results matching &ldquo;{search}&rdquo;
                </p>
                <button
                    onClick={onClear}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                    Clear search
                </button>
            </>
        )}
    </div>
);

/* ───────────────── DELETE DIALOG ───────────────── */

const DeleteDialog = ({
    loading,
    onCancel,
    onConfirm,
}: {
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-[#1a1d2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <svg
                            className="w-7 h-7 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Delete Patient</h3>
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
    );
};

/* ───────────────── PATIENT MODAL ───────────────── */

const PatientModal = ({
    editingPatient,
    formData,
    formErrors,
    submitLoading,
    onFormChange,
    onSubmit,
    onClose,
}: {
    editingPatient: PatientType | null;
    formData: FormType;
    formErrors: Partial<FormType>;
    submitLoading: boolean;
    onFormChange: (data: FormType) => void;
    onSubmit: () => void;
    onClose: () => void;
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        onFormChange({ ...formData, [name]: value });
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const inputClass = (field: keyof FormType) =>
        `w-full rounded-xl border ${formErrors[field] ? "border-red-500/50" : "border-white/10"
        } bg-[#141a2f] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition-all`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                ref={modalRef}
                className="relative bg-[#1a1d2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
                    <h3 className="text-base font-bold text-white">
                        {editingPatient ? "Edit Patient" : "Add New Patient"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors flex items-center justify-center"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-5 py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                First Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="fname"
                                placeholder="First Name"
                                value={formData.fname}
                                onChange={handleChange}
                                className={inputClass("fname")}
                            />
                            {formErrors.fname && (
                                <p className="mt-1 text-xs text-red-400">{formErrors.fname}</p>
                            )}
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Last Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="lname"
                                placeholder="Last Name"
                                value={formData.lname}
                                onChange={handleChange}
                                className={inputClass("lname")}
                            />
                            {formErrors.lname && (
                                <p className="mt-1 text-xs text-red-400">{formErrors.lname}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Phone Number <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="phone"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                                className={inputClass("phone")}
                            />
                            {formErrors.phone && (
                                <p className="mt-1 text-xs text-red-400">{formErrors.phone}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Email Address <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass("email")}
                            />
                            {formErrors.email && (
                                <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>
                            )}
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Gender <span className="text-red-400">*</span>
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className={inputClass("gender")}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            {formErrors.gender && (
                                <p className="mt-1 text-xs text-red-400">
                                    {formErrors.gender}
                                </p>
                            )}
                        </div>

                        {/* Country */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Country <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="country"
                                placeholder="Country"
                                value={formData.country}
                                onChange={handleChange}
                                className={inputClass("country")}
                            />
                            {formErrors.country && (
                                <p className="mt-1 text-xs text-red-400">
                                    {formErrors.country}
                                </p>
                            )}
                        </div>

                        {/* City */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                placeholder="City"
                                value={formData.city}
                                onChange={handleChange}
                                className={inputClass("city")}
                            />
                        </div>

                        {/* State */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                State
                            </label>
                            <input
                                type="text"
                                name="state"
                                placeholder="State"
                                value={formData.state}
                                onChange={handleChange}
                                className={inputClass("state")}
                            />
                        </div>

                        {/* Zip Code */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Zip Code
                            </label>
                            <input
                                type="text"
                                name="zipCode"
                                placeholder="Zip Code"
                                value={formData.zipCode}
                                onChange={handleChange}
                                className={inputClass("zipCode")}
                            />
                        </div>

                        {/* Address 1 — full width */}
                        <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Address Line 1 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="address1"
                                placeholder="Address Line 1"
                                value={formData.address1}
                                onChange={handleChange}
                                className={inputClass("address1")}
                            />
                            {formErrors.address1 && (
                                <p className="mt-1 text-xs text-red-400">
                                    {formErrors.address1}
                                </p>
                            )}
                        </div>

                        {/* Address 2 — full width */}
                        <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Address Line 2
                            </label>
                            <input
                                type="text"
                                name="address2"
                                placeholder="Address Line 2 (optional)"
                                value={formData.address2}
                                onChange={handleChange}
                                className={inputClass("address2")}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2.5 border-t border-white/10 px-5 py-4 shrink-0">
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
                                <span>
                                    {editingPatient ? "Updating..." : "Creating..."}
                                </span>
                            </div>
                        ) : (
                            <span>
                                {editingPatient ? "Update Patient" : "Create Patient"}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ───────────────── MAIN PAGE ───────────────── */

export default function PatientsPage() {
    const [patients, setPatients] = useState<PatientType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [showModal, setShowModal] = useState(false);
    const [editingPatient, setEditingPatient] = useState<PatientType | null>(
        null
    );
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [formData, setFormData] = useState<FormType>(initialForm);
    const [formErrors, setFormErrors] = useState<Partial<FormType>>({});

    const searchRef = useRef<HTMLInputElement>(null);

    /* ───── FETCH ───── */

    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get("/patients");
            setPatients(res.data.data || []);
        } catch {
            setError("Failed to fetch patients. Please try again.");
            toast.error("Failed to fetch patients");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    /* ───── KEYBOARD SHORTCUTS ───── */

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key === "Escape" && showModal) {
                closeModal();
            }
        };
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [showModal]);

    /* ───── DEBOUNCED SEARCH ───── */

    const debouncedSearch = useMemo(
        () =>
            debounce((value: string) => {
                setSearch(value);
                setPage(1);
            }, 300),
        []
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    /* ───── FILTER ───── */

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return patients;
        return patients.filter((p) =>
            `${p.fname} ${p.lname} ${p.email} ${p.phone} ${p.city} ${p.state}`
                .toLowerCase()
                .includes(q)
        );
    }, [patients, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    const paginated = useMemo(
        () => filtered.slice((page - 1) * pageSize, page * pageSize),
        [filtered, page, pageSize]
    );

    /* ───── PAGINATION BUTTONS ───── */

    const pageButtons = useMemo(() => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push("...");
            for (
                let i = Math.max(2, page - 1);
                i <= Math.min(totalPages - 1, page + 1);
                i++
            )
                pages.push(i);
            if (page < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    }, [page, totalPages]);

    /* ───── MODAL ───── */

    const openAdd = () => {
        setEditingPatient(null);
        setFormData(initialForm);
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (p: PatientType) => {
        setEditingPatient(p);
        setFormData({
            fname: p.fname,
            lname: p.lname,
            phone: p.phone,
            email: p.email,
            gender: p.gender,
            country: p.country,
            address1: p.address1,
            address2: p.address2 || "",
            city: p.city,
            state: p.state,
            zipCode: p.zipCode,
        });
        setFormErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPatient(null);
        setFormData(initialForm);
        setFormErrors({});
    };

    /* ───── VALIDATION ───── */

    /* ───── VALIDATION ───── */

    const validateForm = (): boolean => {
        const errors: Partial<FormType> = {};

        // First Name
        if (!formData.fname.trim()) {
            errors.fname = "First name is required";
        } else if (formData.fname.trim().length < 2) {
            errors.fname = "First name must be at least 2 characters";
        }

        // Last Name
        if (!formData.lname.trim()) {
            errors.lname = "Last name is required";
        } else if (formData.lname.trim().length < 2) {
            errors.lname = "Last name must be at least 2 characters";
        }

        // Phone
        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required";
        } else if (!/^[0-9]{10,10}$/.test(formData.phone.trim())) {
            errors.phone = "Enter valid phone number";
        }

        // Email
        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ) {
            errors.email = "Enter valid email address";
        }

        // Gender
        if (!formData.gender) {
            errors.gender = "Gender is required";
        }

        // Country
        if (!formData.country.trim()) {
            errors.country = "Country is required";
        }

        // Address 1
        if (!formData.address1.trim()) {
            errors.address1 = "Address is required";
        } else if (formData.address1.trim().length < 5) {
            errors.address1 = "Address must be at least 5 characters";
        }

        // Optional City
        if (formData.city && formData.city.trim().length < 2) {
            errors.city = "City must be at least 2 characters";
        }

        // Optional State
        if (formData.state && formData.state.trim().length < 2) {
            errors.state = "State must be at least 2 characters";
        }

        // Optional Zip Code
        if (
            formData.zipCode &&
            !/^[a-zA-Z0-9 -]{4,10}$/.test(formData.zipCode.trim())
        ) {
            errors.zipCode = "Enter valid zip code";
        }

        setFormErrors(errors);

        return Object.keys(errors).length === 0;
    };

    /* ───── SUBMIT ───── */

    /* ───── SUBMIT ───── */

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        try {
            setSubmitLoading(true);
            setFormErrors({});

            if (editingPatient) {
                await axios.put(`/patients/${editingPatient.id}`, formData);
                toast.success("Patient updated successfully");
            } else {
                await axios.post("/patients", formData);
                toast.success("Patient created successfully");
            }

            await fetchPatients();
            closeModal();
        } catch (err: any) {
            // backend field validation errors
            if (
                err?.response?.status === 422 ||
                err?.response?.data?.errors
            ) {
                const apiErrors = err.response.data.errors || {};
                const fieldErrors: Partial<FormType> = {};

                Object.keys(apiErrors).forEach((key) => {
                    fieldErrors[key as keyof FormType] = Array.isArray(apiErrors[key])
                        ? apiErrors[key][0]
                        : apiErrors[key];
                });

                setFormErrors(fieldErrors);
                toast.error("Please fix the highlighted errors");
                return;
            }

            const message =
                err?.response?.data?.message || "Something went wrong";

            toast.error(message);
        } finally {
            setSubmitLoading(false);
        }
    };

    /* ───── DELETE ───── */

    const handleDeleteConfirm = async () => {
        if (deleteId === null) return;
        try {
            setDeleteLoading(true);
            await axios.delete(`/patients/${deleteId}`);
            await fetchPatients();
            toast.success("Patient deleted successfully");
        } catch {
            toast.error("Failed to delete patient");
        } finally {
            setDeleteLoading(false);
            setDeleteId(null);
        }
    };

    /* ───── RENDER ───── */

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorState error={error} onRetry={fetchPatients} />;

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: "#1a1d2e",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.1)",
                    },
                    success: {
                        iconTheme: { primary: "#10b981", secondary: "#fff" },
                    },
                    error: {
                        iconTheme: { primary: "#ef4444", secondary: "#fff" },
                    },
                }}
            />

            <div className="min-h-screen bg-gradient-to-br from-[#0f1119] to-[#13152a] p-4 md:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto space-y-5">

                    {/* ── HEADER ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent">
                                Patients Management
                            </h1>
                            <nav className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                                <span className="hover:text-slate-300 cursor-pointer transition-colors">
                                    Dashboard
                                </span>
                                <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                                <span className="text-slate-300">Patients</span>
                            </nav>
                        </div>

                        <div className="flex items-center gap-2">
                            <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-mono text-slate-400 bg-white/5 border border-white/10 rounded-lg">
                                Ctrl + K
                            </kbd>
                        </div>
                    </div>

                    {/* ── MAIN CARD ── */}
                    <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">

                        {/* Card Header */}
                        <div className="px-4 md:px-6 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-4 h-4 text-violet-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                                    Patient Datatable
                                </h2>
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
                                    onClick={openAdd}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/40"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    Add Patient
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
                                        placeholder="Search patients... (Ctrl + K)"
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
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
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
                                    {filtered.length} result
                                    {filtered.length !== 1 ? "s" : ""}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                                <table className="w-full text-sm border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                                            {[
                                                "Name",
                                                "Phone",
                                                "Email",
                                                "Gender",
                                                "Location",
                                                "Zip",
                                                "Created At",
                                                "Updated At",
                                                "Actions",
                                            ].map((col) => (
                                                <th
                                                    key={col}
                                                    className={`px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ${col === "Actions" ? "text-center" : "text-left"
                                                        }`}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-20 text-center">
                                                    <EmptyState
                                                        search={search}
                                                        onClear={() => {
                                                            setSearch("");
                                                            if (searchRef.current)
                                                                searchRef.current.value = "";
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            paginated.map((p) => (
                                                <tr
                                                    key={p.id}
                                                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                                                >
                                                    {/* Name */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/25 flex items-center justify-center text-[11px] font-bold text-violet-400 shrink-0">
                                                                {p.fname?.charAt(0)?.toUpperCase() ?? "?"}
                                                            </div>
                                                            <span className="text-slate-200 font-medium whitespace-nowrap">
                                                                {p.fname} {p.lname}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Phone */}
                                                    <td className="px-4 py-3.5 text-slate-300 font-mono text-xs whitespace-nowrap">
                                                        {p.phone}
                                                    </td>

                                                    {/* Email */}
                                                    <td className="px-4 py-3.5 text-slate-300 text-xs max-w-[180px] truncate">
                                                        {p.email}
                                                    </td>

                                                    {/* Gender */}
                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border whitespace-nowrap ${p.gender === "male"
                                                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                                                : p.gender === "female"
                                                                    ? "bg-pink-500/15 text-pink-400 border-pink-500/30"
                                                                    : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                                                                }`}
                                                        >
                                                            {p.gender
                                                                ? p.gender.charAt(0).toUpperCase() +
                                                                p.gender.slice(1)
                                                                : "-"}
                                                        </span>
                                                    </td>

                                                    {/* Location */}
                                                    <td className="px-4 py-3.5 text-slate-300 text-xs whitespace-nowrap">
                                                        {[p.city, p.state, p.country]
                                                            .filter(Boolean)
                                                            .join(", ") || "-"}
                                                    </td>

                                                    {/* Zip */}
                                                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                                                        {p.zipCode || "-"}
                                                    </td>

                                                    {/* Created At */}
                                                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                                                        {p.createdAt
                                                            ? new Date(p.createdAt).toLocaleDateString()
                                                            : "-"}
                                                    </td>

                                                    {/* Updated At */}
                                                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                                                        {p.updatedAt
                                                            ? new Date(p.updatedAt).toLocaleDateString()
                                                            : "-"}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* Edit */}
                                                            <button
                                                                onClick={() => openEdit(p)}
                                                                aria-label="Edit patient"
                                                                className="w-7 h-7 rounded-lg bg-violet-500/10 hover:bg-violet-500/25 border border-violet-500/20 flex items-center justify-center text-violet-400 transition-all hover:scale-110"
                                                            >
                                                                <svg
                                                                    className="w-3.5 h-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                            </button>

                                                            {/* Delete */}
                                                            <button
                                                                onClick={() => setDeleteId(p.id)}
                                                                aria-label="Delete patient"
                                                                className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 flex items-center justify-center text-red-400 transition-all hover:scale-110"
                                                            >
                                                                <svg
                                                                    className="w-3.5 h-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
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
                                            {filtered.length === 0
                                                ? 0
                                                : (page - 1) * pageSize + 1}
                                        </span>{" "}
                                        to{" "}
                                        <span className="text-slate-300 font-medium">
                                            {Math.min(page * pageSize, filtered.length)}
                                        </span>{" "}
                                        of{" "}
                                        <span className="text-slate-300 font-medium">
                                            {filtered.length}
                                        </span>{" "}
                                        entries
                                    </p>

                                    <div className="flex items-center gap-1 flex-wrap justify-center">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            Previous
                                        </button>

                                        {pageButtons.map((pb, i) =>
                                            pb === "..." ? (
                                                <span
                                                    key={`dots-${i}`}
                                                    className="px-1.5 text-slate-600 text-xs select-none"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={pb}
                                                    onClick={() => setPage(pb as number)}
                                                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${page === pb
                                                        ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                                                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-white/[0.08]"
                                                        }`}
                                                >
                                                    {pb}
                                                </button>
                                            )
                                        )}

                                        <button
                                            onClick={() =>
                                                setPage((p) => Math.min(totalPages, p + 1))
                                            }
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

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <PatientModal
                    editingPatient={editingPatient}
                    formData={formData}
                    formErrors={formErrors}
                    submitLoading={submitLoading}
                    onFormChange={setFormData}
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                />
            )}

            {/* DELETE DIALOG */}
            {deleteId !== null && (
                <DeleteDialog
                    loading={deleteLoading}
                    onCancel={() => setDeleteId(null)}
                    onConfirm={handleDeleteConfirm}
                />
            )}
        </>
    );
}