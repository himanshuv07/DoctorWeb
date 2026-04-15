'use client';

import { Users, CalendarClock, Stethoscope, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const appointmentData = [
  { day: 'Mon', appointments: 12 },
  { day: 'Tue', appointments: 19 },
  { day: 'Wed', appointments: 14 },
  { day: 'Thu', appointments: 22 },
  { day: 'Fri', appointments: 18 },
  { day: 'Sat', appointments: 9 },
  { day: 'Sun', appointments: 5 },
];

const patientData = [
  { month: 'Jan', patients: 40 },
  { month: 'Feb', patients: 55 },
  { month: 'Mar', patients: 47 },
  { month: 'Apr', patients: 63 },
  { month: 'May', patients: 58 },
  { month: 'Jun', patients: 72 },
];

const recentAppointments = [
  { id: 1, patient: 'Rahul Sharma', doctor: 'Dr. Mehta', time: '09:00 AM', status: 'Confirmed' },
  { id: 2, patient: 'Priya Patel', doctor: 'Dr. Singh', time: '10:30 AM', status: 'Pending' },
  { id: 3, patient: 'Amit Verma', doctor: 'Dr. Rao', time: '11:00 AM', status: 'Confirmed' },
  { id: 4, patient: 'Sneha Desai', doctor: 'Dr. Mehta', time: '12:00 PM', status: 'Cancelled' },
  { id: 5, patient: 'Karan Malhotra', doctor: 'Dr. Joshi', time: '02:00 PM', status: 'Confirmed' },
];

const statusStyles: Record<string, string> = {
  Confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-100  text-amber-700  border-amber-200',
  Cancelled: 'bg-red-100    text-red-600    border-red-200',
};

// ─── Stat Cards Data ──────────────────────────────────────────────────────────
const stats = [
  {
    label: 'Total Patients',
    value: '1,284',
    change: '+12%',
    up: true,
    icon: Users,
    color: 'text-violet-600',
    bg: 'bg-violet-100',
    border: 'border-violet-200',
  },
  {
    label: "Today's Appointments",
    value: '24',
    change: '+4%',
    up: true,
    icon: CalendarClock,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
  },
  {
    label: 'Active Doctors',
    value: '18',
    change: '+2%',
    up: true,
    icon: Stethoscope,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
  },
  {
    label: 'Monthly Revenue',
    value: '₹2.4L',
    change: '-3%',
    up: false,
    icon: TrendingUp,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-200',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Good Morning, Admin 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">{today}</p>
        </div>

        <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3.5 py-2">
          <Activity className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-violet-300">System Online</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, up, icon: Icon }) => (
          <div
            key={label}
            className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl p-5 shadow-xl hover:bg-white/[0.03] transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {label}
                </p>

                <p className="text-2xl font-bold text-white">{value}</p>

                <div className="flex items-center gap-1 mt-1.5">
                  {up ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change} vs last month
                  </span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Area Chart */}
        <div className="xl:col-span-2 bg-[#1a1d2e] border border-white/[0.06] rounded-2xl shadow-xl">
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <h3 className="text-sm font-semibold text-slate-300">
              Appointments This Week
            </h3>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              This Week
            </span>
          </div>

          <div className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={appointmentData}>
                <defs>
                  <linearGradient id="appointmentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />

                <Tooltip
                  contentStyle={{
                    background: "#1f2337",
                    border: "1px solid #2a2d3e",
                    borderRadius: 10,
                    color: "#fff"
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#8b5cf6"
                  fill="url(#appointmentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl shadow-xl">
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <h3 className="text-sm font-semibold text-slate-300">
              New Patients
            </h3>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              6 Months
            </span>
          </div>

          <div className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={patientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />

                <Tooltip
                  contentStyle={{
                    background: "#1f2337",
                    border: "1px solid #2a2d3e",
                    borderRadius: 10,
                    color: "#fff"
                  }}
                />

                <Bar dataKey="patients" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Appointments Table */}
      <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-slate-300">
            Recent Appointments
          </h3>
          <button className="text-xs text-violet-400 hover:text-violet-300">
            View All →
          </button>
        </div>

        <div className="px-6 pb-5 space-y-2">
          <div className="grid grid-cols-4 text-[11px] font-bold text-slate-500 uppercase border-b border-white/[0.06] pb-2">
            <span>Patient</span>
            <span>Doctor</span>
            <span>Time</span>
            <span>Status</span>
          </div>

          {recentAppointments.map((appt) => (
            <div
              key={appt.id}
              className="grid grid-cols-4 py-3 text-sm text-slate-300 border-b border-white/[0.04] hover:bg-white/[0.03] rounded-lg transition"
            >
              <span className="font-medium text-white">{appt.patient}</span>
              <span className="text-slate-400">{appt.doctor}</span>
              <span className="text-slate-400">{appt.time}</span>

              <span className={`text-[11px] px-2 py-1 rounded-lg border w-fit ${statusStyles[appt.status]}`}>
                {appt.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 