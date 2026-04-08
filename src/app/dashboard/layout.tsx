'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, CalendarClock, Stethoscope,
  UserCog, Settings, ChevronLeft, ChevronRight, LogOut, Bell, Search,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Patients',     href: '/dashboard/patients',     icon: Users },
  { label: 'Appointments', href: '/dashboard/appointments', icon: CalendarClock },
  { label: 'Doctors',      href: '/dashboard/doctors',      icon: Stethoscope },
  { label: 'Users',        href: '/dashboard/users',        icon: UserCog },
  { label: 'Duration',     href: '/dashboard/duration',     icon: CalendarClock },
  { label: 'Settings',     href: '/dashboard/settings',     icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0f1e]">

      {/* ── Sidebar ── */}
      <aside className={cn(
        'relative flex flex-col bg-[#0f0f14] border-r border-white/[0.06] transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-[68px]' : 'w-[230px]'
      )}>
        <div className="absolute top-0 left-0 w-full h-48 bg-violet-700/10 blur-[60px] pointer-events-none" />
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500 to-transparent shrink-0" />

        {/* Logo */}
        <div className={cn('flex items-center gap-2.5 px-4 py-5 shrink-0', collapsed && 'justify-center px-0')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-[0.1em] text-white">
              I<span className="text-violet-400">X</span>ORA
            </span>
          )}
        </div>

        <div className="mx-3 h-px bg-white/[0.06] shrink-0" />

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Tooltip key={href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push(href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group',
                      collapsed && 'justify-center px-0',
                      active
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'text-white/40 hover:bg-white/[0.05] hover:text-white/75 border border-transparent'
                    )}>
                    <Icon className={cn(
                      'shrink-0 transition-colors',
                      collapsed ? 'w-5 h-5' : 'w-4 h-4',
                      active ? 'text-violet-400' : 'text-white/35 group-hover:text-white/60'
                    )} />
                    {!collapsed && <span>{label}</span>}
                    {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-[#1a1a28] text-white border-white/10 text-xs">
                    {label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        <div className="mx-3 h-px bg-white/[0.06] shrink-0" />

        <div className={cn('p-3 shrink-0', collapsed && 'flex justify-center')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                'w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.05] transition-all',
                collapsed && 'w-auto justify-center'
              )}>
                <Avatar className="w-7 h-7 shrink-0 ring-1 ring-violet-500/40">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-violet-600/30 text-violet-300 text-[10px] font-semibold">AD</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-[12px] font-medium text-white/80 truncate">Admin User</p>
                    <p className="text-[10px] text-white/35 truncate">admin@ixora.com</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-48 bg-[#1a1a28] border-white/10 text-white">
              <DropdownMenuLabel className="text-white/50 text-xs">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer text-sm"
                onClick={() => router.push('/dashboard/settings')}>
                <Settings className="w-3.5 h-3.5 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-sm"
                onClick={handleLogout}>
                <LogOut className="w-3.5 h-3.5 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-[#1e1e2e] border border-white/10
                     flex items-center justify-center text-white/50 hover:text-white hover:border-violet-500/50
                     transition-all shadow-md z-10">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* DARK topbar */}
        <header className="shrink-0 h-14 bg-[#0f0f14] border-b border-white/[0.06] flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl
                          px-3.5 py-2 w-72 focus-within:border-violet-500/40 focus-within:bg-white/[0.07] transition-all">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Search patients, appointments..."
              className="bg-transparent text-[13px] text-white/70 placeholder-white/25 outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08]
                               flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4 text-white/50" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
            </button>
            <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[11px] font-medium px-2.5">
              Admin
            </Badge>
            <Avatar className="w-8 h-8 ring-2 ring-violet-500/30 cursor-pointer">
              <AvatarImage src="" />
              <AvatarFallback className="bg-violet-600/30 text-violet-300 text-[11px] font-semibold">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* DARK page area */}
        <main className="flex-1 overflow-y-auto bg-[#0d0f1e]">
          {children}
        </main>
      </div>
    </div>
  );
}