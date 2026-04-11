"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    UserRound,
    Mail,
    Phone,
    MapPin,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

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

type ToastType = {
    show: boolean;
    type: "success" | "error";
    message: string;
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

export default function PatientsPage() {
    const [patients, setPatients] = useState<PatientType[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<PatientType | null>(null);
    const [formData, setFormData] = useState<FormType>(initialForm);
    const [errors, setErrors] = useState<ErrorType>({});
    const [toast, setToast] = useState<ToastType>({
        show: false,
        type: "success",
        message: "",
    });

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ show: true, type, message });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 3000);
    };

    const fetchPatients = async () => {
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
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const filteredPatients = useMemo(() => {
        return patients.filter((patient) => {
            const term = search.toLowerCase();
            return (
                patient.fname.toLowerCase().includes(term) ||
                patient.lname.toLowerCase().includes(term) ||
                patient.email.toLowerCase().includes(term) ||
                patient.phone.toLowerCase().includes(term) ||
                patient.city.toLowerCase().includes(term) ||
                patient.state.toLowerCase().includes(term)
            );
        });
    }, [patients, search]);

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

    const validateForm = () => {
        const newErrors: ErrorType = {};

        if (!formData.fname.trim()) newErrors.fname = "First name is required";
        if (!formData.lname.trim()) newErrors.lname = "Last name is required";
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone is required";
        } else if (!/^[0-9]{10,15}$/.test(formData.phone.trim())) {
            newErrors.phone = "Phone must be 10 to 15 digits";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
        ) {
            newErrors.email = "Invalid email address";
        }

        if (!formData.gender.trim()) newErrors.gender = "Gender is required";
        if (!formData.country.trim()) newErrors.country = "Country is required";
        if (!formData.address1.trim()) newErrors.address1 = "Address Line 1 is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.zipCode.trim()) {
            newErrors.zipCode = "Zip code is required";
        } else if (formData.zipCode.trim().length < 4) {
            newErrors.zipCode = "Zip code is too short";
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
                gender: formData.gender.trim(),
                country: formData.country.trim(),
                address1: formData.address1.trim(),
                address2: formData.address2.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zipCode: formData.zipCode.trim(),
                createdBy: 1,
                updatedBy: 1,
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

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm("Are you sure you want to delete this patient?");
        if (!confirmed) return;

        try {
            await axios.delete(`/api/patients/${id}`);
            showToast("success", "Patient deleted successfully");
            await fetchPatients();
        } catch (error: any) {
            console.error("Delete error:", error);
            showToast(
                "error",
                error?.response?.data?.message || "Failed to delete patient"
            );
        }
    };

    const inputClass = (field: keyof FormType) =>
        `w-full rounded-xl border bg-[#141a2f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#66708f] transition ${errors[field]
            ? "border-rose-500/70 focus:border-rose-500"
            : "border-white/10 focus:border-violet-500/60"
        }`;

    return (
        <div className="min-h-screen bg-[#070b1a] text-white px-4 md:px-6 py-6">
            {toast.show && (
                <div
                    className={`fixed top-5 right-5 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl ${toast.type === "success"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                        }`}
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-wide text-white">
                    Patient Table
                </h1>
                <p className="text-sm text-[#7f89b0] mt-1">
                    Dashboard <span className="mx-2">›</span> Patient
                </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#171c33_0%,#12172b_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-white/10 px-4 md:px-6 py-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="text-sm uppercase tracking-[0.22em] text-[#c8d0ff] font-semibold">
                                Patient Datatable
                            </h2>
                        </div>

                        <div className="relative w-full md:w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f789b] w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search patient..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-[#1b2138] pl-10 pr-4 py-2.5 text-sm text-white outline-none placeholder:text-[#66708f] focus:border-violet-500/60"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)] transition hover:scale-[1.02]"
                        >
                            <Plus className="w-4 h-4" />
                            Add Patient
                        </button>

                        <div className="text-xs text-[#8d98c4]">
                            Total Patients: {patients.length}
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    <div className="rounded-2xl border border-white/10 overflow-hidden">
                        <table className="w-full table-fixed text-sm">
                            <thead className="bg-white/[0.03] text-[#9da7cf] uppercase text-[11px] tracking-wider">
                                <tr>
                                    <th className="text-left px-5 py-4">First Name</th>
                                    <th className="text-left px-5 py-4">Last Name</th>
                                    <th className="text-left px-5 py-4">Phone</th>
                                    <th className="text-left px-5 py-4">Email</th>
                                    <th className="text-left px-5 py-4">Gender</th>
                                    <th className="text-left px-5 py-4">Country</th>
                                    <th className="text-left px-5 py-4">City</th>
                                    <th className="text-left px-5 py-4">State</th>
                                    <th className="text-left px-5 py-4">Zip Code</th>
                                    <th className="text-left px-5 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="text-center px-4 py-10 text-[#8b94b8]">
                                            Loading patients...
                                        </td>
                                    </tr>
                                ) : filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center px-4 py-10 text-[#8b94b8]">
                                            No patients found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            className="border-t border-white/5 hover:bg-white/[0.025] transition"
                                        >
                                            <td className="px-4 py-4 text-[#d7ddff]">{patient.fname}</td>
                                            <td className="px-4 py-4 text-[#d7ddff]">{patient.lname}</td>
                                            <td className="px-4 py-4 text-[#d7ddff]">{patient.phone}</td>
                                            <td className="px-4 py-4 text-[#9ba5c7] max-w-[180px] truncate">
                                                {patient.email}
                                            </td>
                                            <td className="px-4 py-4 text-[#9ba5c7] capitalize">
                                                {patient.gender}
                                            </td>
                                            <td className="px-4 py-4 text-[#9ba5c7]">{patient.country}</td>
                                            <td className="px-4 py-4 text-[#9ba5c7]">{patient.city}</td>
                                            <td className="px-4 py-4 text-[#9ba5c7]">{patient.state}</td>
                                            <td className="px-4 py-4 text-[#9ba5c7]">{patient.zipCode}</td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(patient)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(patient.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#181d35_0%,#101427_100%)] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <h3 className="text-lg font-semibold text-white">
                                {editingPatient ? "Edit Patient" : "Add New Patient"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="rounded-lg p-2 text-[#95a0cb] hover:bg-white/5 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    First Name <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fname"
                                    value={formData.fname}
                                    onChange={handleChange}
                                    placeholder="First name"
                                    className={inputClass("fname")}
                                />
                                {errors.fname && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.fname}</p>
                                )}
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
                                    placeholder="Last name"
                                    className={inputClass("lname")}
                                />
                                {errors.lname && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.lname}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Phone <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Phone number"
                                    className={inputClass("phone")}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.phone}</p>
                                )}
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
                                    placeholder="Email address"
                                    className={inputClass("email")}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
                                )}
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
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.gender && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.gender}</p>
                                )}
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
                                {errors.country && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.country}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Address Line 1 <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="address1"
                                    value={formData.address1}
                                    onChange={handleChange}
                                    placeholder="Address line 1"
                                    className={inputClass("address1")}
                                />
                                {errors.address1 && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.address1}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                    Address Line 2
                                </label>
                                <input
                                    type="text"
                                    name="address2"
                                    value={formData.address2}
                                    onChange={handleChange}
                                    placeholder="Address line 2"
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
                                {errors.city && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.city}</p>
                                )}
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
                                    placeholder="State"
                                    className={inputClass("state")}
                                />
                                {errors.state && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.state}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <div className="max-w-[220px]">
                                    <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                                        Zip Code <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        placeholder="Zip code"
                                        className={inputClass("zipCode")}
                                    />
                                    {errors.zipCode && (
                                        <p className="mt-1 text-xs text-rose-400">{errors.zipCode}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
                            <button
                                onClick={closeModal}
                                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#a7b1db] hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitLoading}
                                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)] disabled:opacity-60"
                            >
                                {submitLoading
                                    ? editingPatient
                                        ? "Updating..."
                                        : "Submitting..."
                                    : editingPatient
                                        ? "Update"
                                        : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}