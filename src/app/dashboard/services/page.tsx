"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Clock3,
  IndianRupee,
  BriefcaseMedical,
  X,
} from "lucide-react";

type DurationType = {
  id: number;
  value: number;
};

type ServiceType = {
  id: number;
  name: string;
  price: number;
  durationId: number;
  createdAt?: string;
  updatedAt?: string;
  duration?: {
    id: number;
    value: number;
  };
};

type FormDataType = {
  name: string;
  price: string;
  durationId: string;
};

const initialForm: FormDataType = {
  name: "",
  price: "",
  durationId: "",
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [durations, setDurations] = useState<DurationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState<FormDataType>(initialForm);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const term = search.toLowerCase();
      return (
        service.name.toLowerCase().includes(term) ||
        String(service.price).includes(term) ||
        String(service.duration?.value || "").includes(term)
      );
    });
  }, [services, search]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/services");
      setServices(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDurations = async () => {
    try {
      const res = await axios.get("/api/duration");
      setDurations(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch durations:", error);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchDurations();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceType) => {
    setEditingService(service);
    setFormData({
      name: service.name || "",
      price: String(service.price || ""),
      durationId: String(service.durationId || service.duration?.id || ""),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingService(null);
    setFormData(initialForm);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.durationId) {
      alert("Please fill all fields");
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price),
        durationId: Number(formData.durationId),
        createdBy: 1,
        updatedBy: 1,
      };

      if (editingService) {
        await axios.put(`/api/services/${editingService.id}`, {
          name: payload.name,
          price: payload.price,
          durationId: payload.durationId,
          updatedBy: 1,
        });
      } else {
        await axios.post("/api/services", payload);
      }

      await fetchServices();
      closeModal();
    } catch (error: any) {
      console.error("Submit error:", error);
      alert(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this service?");
    if (!confirmed) return;

    try {
      await axios.delete(`/api/services/${id}`);
      await fetchServices();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error?.response?.data?.message || "Failed to delete service");
    }
  };

  return (
    <div className="min-h-screen bg-[#070b1a] text-white px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-wide text-white">
          Service Table
        </h1>
        <p className="text-sm text-[#7f89b0] mt-1">
          Dashboard <span className="mx-2">›</span> Service
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#171c33_0%,#12172b_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/10 px-4 md:px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm uppercase tracking-[0.22em] text-[#c8d0ff] font-semibold">
                Service Datatable
              </h2>
            </div>

            <div className="relative w-full md:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f789b] w-4 h-4" />
              <input
                type="text"
                placeholder="Search service..."
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
              Add Service
            </button>

            {/* <div className="flex items-center gap-2 flex-wrap">
              <button className="rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/20 px-3 py-1.5 text-xs font-medium">
                All
              </button>
              <button className="rounded-lg bg-white/5 text-[#92a0d3] border border-white/10 px-3 py-1.5 text-xs font-medium">
                Active
              </button>
              <button className="rounded-lg bg-white/5 text-[#92a0d3] border border-white/10 px-3 py-1.5 text-xs font-medium">
                Premium
              </button>
            </div> */}
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-white/[0.03] text-[#9da7cf] uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="text-left px-4 py-4">Name</th>
                  <th className="text-left px-4 py-4">Price</th>
                  <th className="text-left px-4 py-4">Value (Minutes)</th>
                  <th className="text-left px-4 py-4">Created At</th>
                  <th className="text-left px-4 py-4">Updated At</th>
                  <th className="text-left px-4 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center px-4 py-10 text-[#8b94b8]">
                      Loading services...
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center px-4 py-10 text-[#8b94b8]">
                      No services found
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr
                      key={service.id}
                      className="border-t border-white/5 hover:bg-white/[0.025] transition"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
                            <BriefcaseMedical className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-white">{service.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-[#d7ddff]">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {service.price}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                          <Clock3 className="w-3.5 h-3.5" />
                          {service.duration?.value ?? "-"} Minutes
                        </span>
                      </td>

                      <td className="px-4 py-4 text-[#9ba5c7]">
                        {service.createdAt
                          ? new Date(service.createdAt).toLocaleString()
                          : "-"}
                      </td>

                      <td className="px-4 py-4 text-[#9ba5c7]">
                        {service.updatedAt
                          ? new Date(service.updatedAt).toLocaleString()
                          : "-"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(service)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
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

          <div className="mt-4 flex items-center justify-between text-xs text-[#6f789b]">
            <p>
              Showing {filteredServices.length} of {services.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[#7380ac]">
                Previous
              </button>
              <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-white">
                1
              </button>
              <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[#7380ac]">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#181d35_0%,#101427_100%)] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">
                {editingService ? "Edit Service" : "Add New Service"}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-[#95a0cb] hover:bg-white/5 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Service name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#141a2f] px-4 py-3 text-sm text-white outline-none placeholder:text-[#66708f] focus:border-violet-500/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#141a2f] px-4 py-3 text-sm text-white outline-none placeholder:text-[#66708f] focus:border-violet-500/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#c4cdf8]">
                  Duration
                </label>
                <select
                  name="durationId"
                  value={formData.durationId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#141a2f] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60"
                >
                  <option value="">Select Duration</option>
                  {durations.map((duration) => (
                    <option key={duration.id} value={duration.id}>
                      {duration.value} Minutes
                    </option>
                  ))}
                </select>
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
                  ? editingService
                    ? "Updating..."
                    : "Submitting..."
                  : editingService
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