"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Users,
    Filter,
    ArrowUpDown,
} from "lucide-react";
import { debounce } from "lodash";

type PatientType = {
    id: number;
    fname: string;
    lname: string;
    phone: string;
    email: string;
    gender: string;
    country: string;
    address1: string;
    address2?: string;
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

type ErrorType = Partial<Record<keyof FormType, string>>;

type SortField = "fname" | "lname" | "email" | "createdAt";
type SortOrder = "asc" | "desc";

const ENTRIES_OPTIONS = [10, 25, 50, 100];

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

// Custom hook for localStorage
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};

export default function PatientsPage() {
    const [patients, setPatients] = useState<PatientType[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
    const [search, setSearch] = useLocalStorage("patients-search", "");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useLocalStorage("patients-page-size", 10);
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<PatientType | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<PatientType | null>(null);
    const [formData, setFormData] = useState<FormType>(initialForm);
    const [errors, setErrors] = useState<ErrorType>({});
    const [toast, setToast] = useState<{
        show: boolean;
        type: "success" | "error";
        message: string;
    }>({ show: false, type: "success", message: "" });

    const searchInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const showToast = useCallback((type: "success" | "error", message: string) => {
        setToast({ show: true, type, message });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 3000);
    }, []);

    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/patients");
            setPatients(res.data.data || []);
        } catch (error: any) {
            console.error("Failed to fetch patients:", error);
            showToast("error", "Failed to fetch patients");
            setPatients([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === "Escape" && modalOpen) {
                closeModal();
            }
        };
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [modalOpen]);

    // Click outside modal
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node) && modalOpen) {
                closeModal();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [modalOpen]);

    // Filter and sort patients
    const processedPatients = useMemo(() => {
        let result = [...patients];

        // Apply search filter
        if (search) {
            const term = search.toLowerCase();
            result = result.filter((patient) => {
                return (
                    patient.fname.toLowerCase().includes(term) ||
                    patient.lname.toLowerCase().includes(term) ||
                    patient.email.toLowerCase().includes(term) ||
                    patient.phone.toLowerCase().includes(term) ||
                    patient.city.toLowerCase().includes(term) ||
                    patient.state.toLowerCase().includes(term)
                );
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            let aVal: any = a[sortField];
            let bVal: any = b[sortField];

            if (sortField === "createdAt") {
                aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            }

            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [patients, search, sortField, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(processedPatients.length / pageSize));
    const paginatedPatients = useMemo(() => {
        const start = (page - 1) * pageSize;
        return processedPatients.slice(start, start + pageSize);
    }, [processedPatients, page, pageSize]);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [search, pageSize]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const debouncedSearch = useMemo(
        () => debounce((value: string) => setSearch(value), 300),
        [setSearch]
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    const openAddModal = () => {
        setEditingPatient(null);
        setFormData(initialForm);
        setErrors({});
        setModalOpen(true);
    };

    const openEditModal = (patient: PatientType) => {
        setEditingPatient(patient);
        setFormData({
            fname: patient.fname || "",
            lname: patient.lname || "",
            phone: patient.phone || "",
            email: patient.email || "",
            gender: patient.gender || "",
            country: patient.country || "",
            address1: patient.address1 || "",
            address2: patient.address2 || "",
            city: patient.city || "",
            state: patient.state || "",
            zipCode: patient.zipCode || "",
        });
        setErrors({});
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingPatient(null);
        setFormData(initialForm);
        setErrors({});
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name as keyof FormType]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: ErrorType = {};

        if (!formData.fname.trim()) newErrors.fname = "First name is required";
        else if (formData.fname.length < 2) newErrors.fname = "First name must be at least 2 characters";

        if (!formData.lname.trim()) newErrors.lname = "Last name is required";
        else if (formData.lname.length < 2) newErrors.lname = "Last name must be at least 2 characters";

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone is required";
        } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
            newErrors.phone = "Phone must be 10 digits";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
        ) {
            newErrors.email = "Invalid email address";
        }

        if (!formData.gender) newErrors.gender = "Gender is required";
        if (!formData.country.trim()) newErrors.country = "Country is required";
        if (!formData.address1.trim()) newErrors.address1 = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.zipCode.trim()) {
            newErrors.zipCode = "Zip code is required";
        } else if (!/^\d{4,10}$/.test(formData.zipCode.trim())) {
            newErrors.zipCode = "Invalid zip code format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast("error", "Please fix the highlighted fields");
            return;
        }

        try {
            setSubmitLoading(true);

            const payload = {
                ...formData,
                fname: formData.fname.trim(),
                lname: formData.lname.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                gender: formData.gender,
                country: formData.country.trim(),
                address1: formData.address1.trim(),
                address2: formData.address2.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zipCode: formData.zipCode.trim(),
                createdBy: 10,
                updatedBy: 10,
            };

            if (editingPatient) {
                await axios.put(`/api/patients/${editingPatient.id}`, {
                    ...payload,
                    createdBy: undefined,
                });
                showToast("success", "Patient updated successfully");
            } else {
                await axios.post("/api/patients", payload);
                showToast("success", "Patient created successfully");
            }

            await fetchPatients();
            closeModal();
        } catch (error: any) {
            console.error("Submit error:", error);
            showToast(
                "error",
                error?.response?.data?.message || "Something went wrong"
            );
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (patient: PatientType) => {
        setDeleteConfirm(patient);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            setDeleteLoading(deleteConfirm.id);
            await axios.delete(`/api/patients/${deleteConfirm.id}`);
            showToast("success", "Patient deleted successfully");
            await fetchPatients();
        } catch (error: any) {
            console.error("Delete error:", error);
            showToast(
                "error",
                error?.response?.data?.message || "Failed to delete patient"
            );
        } finally {
            setDeleteLoading(null);
            setDeleteConfirm(null);
        }
    };

    const SortButton = ({ field, label }: { field: SortField; label: string }) => (
        <button
            onClick={() => handleSort(field)}
            className="inline-flex items-center gap-1 hover:text-white transition-colors"
        >
            {label}
            <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-violet-400" : "opacity-50"}`} />
        </button>
    );

    const inputClass = (field: keyof FormType) =>
        `w-full rounded-xl border bg-[#141a2f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#66708f] transition-all ${
            errors[field]
                ? "border-rose-500/70 focus:border-rose-500 ring-1 ring-rose-500/20"
                : "border-white/10 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
        }`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#070b1a] via-[#0a0f1f] to-[#070b1a]">
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-5 right-5 z-[100] animate-in slide-in-from-top-5 duration-300">
                    <div
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm ${
                            toast.type === "success"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                        }`}
                    >
                        {toast.type === "success" ? (
                            <CheckCircle2 className="h-5 w-5" />
                        ) : (
                            <AlertCircle className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent">
                        Patient Management
                    </h1>
                    <p className="text-sm text-[#7f89b0] mt-2">
                        Dashboard <span className="mx-2">›</span> Patients
                    </p>
                </div>

                {/* Main Card */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#171c33] to-[#12172b] shadow-2xl overflow-hidden">
                    {/* Header Actions */}
                    <div className="border-b border-white/10 px-4 md:px-6 py-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                    <Users className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-xs uppercase tracking-[0.22em] text-violet-300 font-semibold">
                                        Patient Directory
                                    </h2>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        {patients.length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f789b] w-4 h-4" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search patients... (Ctrl+K)"
                                        defaultValue={search}
                                        onChange={handleSearchChange}
                                        className="w-full sm:w-80 rounded-xl border border-white/10 bg-[#1b2138] pl-10 pr-4 py-2.5 text-sm text-white outline-none placeholder:text-[#66708f] focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={openAddModal}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Patient
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Controls */}
                    <div className="px-4 md:px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <span>Show</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="bg-[#1b2138] border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none cursor-pointer"
                                >
                                    {ENTRIES_OPTIONS.map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <span>entries</span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-1">
                                <Filter className="w-3 h-3" />
                                <span>Sort by:</span>
                                <SortButton field="fname" label="Name" />
                                <span className="text-white/30">|</span>
                                <SortButton field="email" label="Email" />
                            </div>
                        </div>
                        <div className="text-xs text-[#8d98c4]">
                            Showing {paginatedPatients.length} of {processedPatients.length} patients
                            {search && <span className="text-violet-400"> (filtered)</span>}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/[0.03] border-b border-white/10">
                                <tr className="text-[#9da7cf] text-[11px] font-semibold uppercase tracking-wider">
                                    <th className="text-left px-4 md:px-5 py-4">First Name</th>
                                    <th className="text-left px-4 md:px-5 py-4">Last Name</th>
                                    <th className="text-left px-4 md:px-5 py-4">Phone</th>
                                    <th className="text-left px-4 md:px-5 py-4 hidden lg:table-cell">Email</th>
                                    <th className="text-left px-4 md:px-5 py-4">Gender</th>
                                    <th className="text-left px-4 md:px-5 py-4 hidden md:table-cell">Location</th>
                                    <th className="text-center px-4 md:px-5 py-4">Actions</th>
                                 </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center px-4 py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                                <p className="text-[#8b94b8]">Loading patients...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center px-4 py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-12 h-12 text-[#8b94b8] opacity-50" />
                                                <p className="text-[#8b94b8]">
                                                    {search ? "No patients match your search" : "No patients found"}
                                                </p>
                                                {search && (
                                                    <button
                                                        onClick={() => setSearch("")}
                                                        className="text-xs text-violet-400 hover:text-violet-300"
                                                    >
                                                        Clear search
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPatients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            className="border-t border-white/5 hover:bg-white/[0.03] transition-colors"
                                        >
                                            <td className="px-4 md:px-5 py-4 text-white font-medium">
                                                {patient.fname}
                                            </td>
                                            <td className="px-4 md:px-5 py-4 text-white">
                                                {patient.lname}
                                            </td>
                                            <td className="px-4 md:px-5 py-4 text-[#9ba5c7] font-mono text-xs">
                                                {patient.phone}
                                            </td>
                                            <td className="px-4 md:px-5 py-4 text-[#9ba5c7] hidden lg:table-cell truncate max-w-[200px]">
                                                {patient.email}
                                            </td>
                                            <td className="px-4 md:px-5 py-4">
                                                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium capitalize ${
                                                    patient.gender === "male" 
                                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                        : patient.gender === "female"
                                                        ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                                                        : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                                }`}>
                                                    {patient.gender}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-4 text-[#9ba5c7] hidden md:table-cell">
                                                {patient.city}, {patient.state}
                                            </td>
                                            <td className="px-4 md:px-5 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(patient)}
                                                        className="p-2 rounded-lg border border-violet-500/20 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition-all"
                                                        title="Edit patient"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(patient)}
                                                        disabled={deleteLoading === patient.id}
                                                        className="p-2 rounded-lg border border-rose-500/20 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 transition-all disabled:opacity-50"
                                                        title="Delete patient"
                                                    >
                                                        {deleteLoading === patient.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
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
                    {processedPatients.length > 0 && (
                        <div className="border-t border-white/10 px-4 md:px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-xs text-[#8d98c4]">
                                    Showing {(page - 1) * pageSize + 1} to{" "}
                                    {Math.min(page * pageSize, processedPatients.length)} of{" "}
                                    {processedPatients.length} entries
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg border border-white/10 text-[#8d98c4] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {(() => {
                                        const pages = [];
                                        const maxVisible = 5;
                                        let start = Math.max(1, page - Math.floor(maxVisible / 2));
                                        let end = Math.min(totalPages, start + maxVisible - 1);
                                        if (end - start + 1 < maxVisible) {
                                            start = Math.max(1, end - maxVisible + 1);
                                        }
                                        for (let i = start; i <= end; i++) {
                                            pages.push(i);
                                        }
                                        return pages.map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`w-8 h-8 text-sm font-medium rounded-lg transition-all ${
                                                    page === p
                                                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg"
                                                        : "text-[#8d98c4] hover:bg-white/5"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ));
                                    })()}
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 rounded-lg border border-white/10 text-[#8d98c4] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div
                        ref={modalRef}
                        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-[#181d35] to-[#101427] shadow-2xl animate-in zoom-in-95 duration-200"
                    >
                        <div className="sticky top-0 bg-inherit flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <h3 className="text-lg font-semibold text-white">
                                {editingPatient ? "Edit Patient" : "Add New Patient"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="rounded-lg p-2 text-[#95a0cb] hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    First Name <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fname"
                                    value={formData.fname}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    className={inputClass("fname")}
                                />
                                {errors.fname && <p className="mt-1 text-xs text-rose-400">{errors.fname}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Last Name <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lname"
                                    value={formData.lname}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    className={inputClass("lname")}
                                />
                                {errors.lname && <p className="mt-1 text-xs text-rose-400">{errors.lname}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Phone <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    onChange={handleChange}
                                    placeholder="10-digit mobile number"
                                    className={inputClass("phone")}
                                />
                                {errors.phone && <p className="mt-1 text-xs text-rose-400">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Email <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="patient@example.com"
                                    className={inputClass("email")}
                                />
                                {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Gender <span className="text-rose-400">*</span>
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className={inputClass("gender")}
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.gender && <p className="mt-1 text-xs text-rose-400">{errors.gender}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Country <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="Country"
                                    className={inputClass("country")}
                                />
                                {errors.country && <p className="mt-1 text-xs text-rose-400">{errors.country}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Address Line 1 <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="address1"
                                    value={formData.address1}
                                    onChange={handleChange}
                                    placeholder="Street address"
                                    className={inputClass("address1")}
                                />
                                {errors.address1 && <p className="mt-1 text-xs text-rose-400">{errors.address1}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Address Line 2 <span className="text-white/40 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="address2"
                                    value={formData.address2}
                                    onChange={handleChange}
                                    placeholder="Apartment, suite, etc."
                                    className={inputClass("address2")}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    City <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className={inputClass("city")}
                                />
                                {errors.city && <p className="mt-1 text-xs text-rose-400">{errors.city}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    State <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="State/Province"
                                    className={inputClass("state")}
                                />
                                {errors.state && <p className="mt-1 text-xs text-rose-400">{errors.state}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Zip Code <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                    placeholder="Postal code"
                                    className={inputClass("zipCode")}
                                />
                                {errors.zipCode && <p className="mt-1 text-xs text-rose-400">{errors.zipCode}</p>}
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-inherit flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-[#a7b1db] hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitLoading}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{editingPatient ? "Updating..." : "Creating..."}</span>
                                    </div>
                                ) : (
                                    <span>{editingPatient ? "Update Patient" : "Create Patient"}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#181d35] to-[#101427] shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-7 h-7 text-rose-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Delete Patient</h3>
                                    <p className="text-sm text-[#9ba5c7] mt-2">
                                        Are you sure you want to delete{" "}
                                        <span className="text-white font-medium">
                                            {deleteConfirm.fname} {deleteConfirm.lname}
                                        </span>
                                        ? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-[#a7b1db] hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition-all hover:scale-[1.02]"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}