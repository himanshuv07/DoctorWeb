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
  { id: 1, patient: 'Rahul Sharma',    doctor: 'Dr. Mehta',   time: '09:00 AM', status: 'Confirmed' },
  { id: 2, patient: 'Priya Patel',     doctor: 'Dr. Singh',   time: '10:30 AM', status: 'Pending' },
  { id: 3, patient: 'Amit Verma',      doctor: 'Dr. Rao',     time: '11:00 AM', status: 'Confirmed' },
  { id: 4, patient: 'Sneha Desai',     doctor: 'Dr. Mehta',   time: '12:00 PM', status: 'Cancelled' },
  { id: 5, patient: 'Karan Malhotra',  doctor: 'Dr. Joshi',   time: '02:00 PM', status: 'Confirmed' },
];

const statusStyles: Record<string, string> = {
  Confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Pending:   'bg-amber-100  text-amber-700  border-amber-200',
  Cancelled: 'bg-red-100    text-red-600    border-red-200',
};

// ─── Stat Cards Data ──────────────────────────────────────────────────────────
const stats = [
  {
    label:   'Total Patients',
    value:   '1,284',
    change:  '+12%',
    up:      true,
    icon:    Users,
    color:   'text-violet-600',
    bg:      'bg-violet-100',
    border:  'border-violet-200',
  },
  {
    label:   "Today's Appointments",
    value:   '24',
    change:  '+4%',
    up:      true,
    icon:    CalendarClock,
    color:   'text-blue-600',
    bg:      'bg-blue-100',
    border:  'border-blue-200',
  },
  {
    label:   'Active Doctors',
    value:   '18',
    change:  '+2%',
    up:      true,
    icon:    Stethoscope,
    color:   'text-emerald-600',
    bg:      'bg-emerald-100',
    border:  'border-emerald-200',
  },
  {
    label:   'Monthly Revenue',
    value:   '₹2.4L',
    change:  '-3%',
    up:      false,
    icon:    TrendingUp,
    color:   'text-orange-600',
    bg:      'bg-orange-100',
    border:  'border-orange-200',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Good Morning, Admin 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3.5 py-2">
          <Activity className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-medium text-violet-600">System Online</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, up, icon: Icon, color, bg, border }) => (
          <Card key={label} className="border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{label}</p>
                  <p className="text-2xl font-bold text-gray-800">{value}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    {up
                      ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                      : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    }
                    <span className={`text-xs font-medium ${up ? 'text-emerald-500' : 'text-red-400'}`}>
                      {change} vs last month
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Area Chart — This Week */}
        <Card className="xl:col-span-2 border border-gray-200/80 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-2 px-6 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700">Appointments This Week</CardTitle>
              <Badge className="bg-violet-100 text-violet-600 border-violet-200 text-[11px]">This Week</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={appointmentData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="appointmentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12 }}
                  cursor={{ stroke: '#7c3aed', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#appointmentGrad)"
                  dot={{ fill: '#7c3aed', r: 3 }}
                  activeDot={{ r: 5, fill: '#7c3aed' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart — Patients per Month */}
        <Card className="border border-gray-200/80 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-2 px-6 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700">New Patients</CardTitle>
              <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200 text-[11px]">6 Months</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={patientData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12 }}
                  cursor={{ fill: '#f5f3ff' }}
                />
                <Bar dataKey="patients" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments Table */}
      <Card className="border border-gray-200/80 shadow-sm bg-white rounded-2xl">
        <CardHeader className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">Recent Appointments</CardTitle>
            <button className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors">
              View All →
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <div className="space-y-2">
            {/* Header row */}
            <div className="grid grid-cols-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
              <span>Patient</span>
              <span>Doctor</span>
              <span>Time</span>
              <span>Status</span>
            </div>
            {/* Data rows */}
            {recentAppointments.map((appt) => (
              <div
                key={appt.id}
                className="grid grid-cols-4 py-2.5 text-sm text-gray-600 border-b border-gray-50 hover:bg-gray-50/60 rounded-lg px-1 transition-colors"
              >
                <span className="font-medium text-gray-800">{appt.patient}</span>
                <span className="text-gray-500">{appt.doctor}</span>
                <span className="text-gray-500">{appt.time}</span>
                <Badge className={`w-fit text-[11px] border ${statusStyles[appt.status]}`}>
                  {appt.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}