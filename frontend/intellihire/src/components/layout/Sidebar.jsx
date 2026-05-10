import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Video, FileText, Bot, Map,
  Settings, LogOut, ChevronLeft, ChevronRight, Diamond,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard',  path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'interviews', path: '/setup',      icon: Video,           label: 'New Interview' },
  { id: 'reports',    path: '/results',    icon: FileText,        label: 'Reports' },
  { id: 'ai-coach',   path: '/ai-coach',  icon: Bot,             label: 'AI Coach' },
  { id: 'roadmap',    path: '/roadmap',   icon: Map,             label: 'Roadmap' },
  { id: 'settings',   path: '/settings',  icon: Settings,        label: 'Settings' },
];

const SECTION_DIVIDER_AFTER = new Set(['interviews', 'reports']);

export const Sidebar = ({ collapsed, onToggle }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 z-[900]',
        'flex flex-col',
        'bg-white/96 backdrop-blur-2xl',
        'border-r border-[#D6E7F7]',
        'transition-all duration-280 ease-in-out',
        'hidden lg:flex',
        collapsed ? 'w-16' : 'w-[220px]'
      )}
    >
      {/* ── Navigation ── */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/' && pathname.startsWith(item.path + '/'));

          const node = (
            <Link
              key={item.id}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center rounded-xl transition-all duration-180 overflow-hidden group',
                collapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-10 gap-3 px-3',
                !isActive && 'hover:bg-slate-50/90 hover:text-slate-800',
                isActive ? 'text-primary-700' : 'text-slate-500'
              )}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="activeSidebarItem"
                  className="absolute inset-0 rounded-xl sidebar-active-pill"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}

              {/* Icon */}
              <item.icon
                className={cn(
                  'relative z-10 shrink-0 transition-colors duration-150',
                  collapsed ? 'w-[18px] h-[18px]' : 'w-[17px] h-[17px]',
                  isActive
                    ? 'text-primary-600'
                    : 'text-slate-400 group-hover:text-slate-600'
                )}
              />

              {/* Label — animated in/out */}
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="relative z-10 text-[13.5px] font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );

          return (
            <React.Fragment key={item.id}>
              {node}
              {/* Subtle section divider */}
              {!collapsed && SECTION_DIVIDER_AFTER.has(item.id) && (
                <div className="my-1.5 mx-2 h-px bg-[#D6E7F7]/80" />
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-2.5 py-3 border-t border-[#D6E7F7]/80 space-y-0.5">
        {/* User info — expanded only */}
        <AnimatePresence initial={false}>
          {!collapsed && user && (
            <Link to="/settings" className="block">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2.5 px-3 py-2 mb-1 overflow-hidden rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[11px] font-bold uppercase shrink-0">
                  {(user.username || 'U')[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
                    {user.username}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate leading-tight">
                    {user.email || 'Pro Plan'}
                  </p>
                </div>
              </motion.div>
            </Link>
          )}
        </AnimatePresence>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group',
            collapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 gap-3 px-3'
          )}
        >
          <LogOut className="w-[17px] h-[17px] shrink-0 transition-colors" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="text-[13.5px] font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'w-full flex items-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-150',
            collapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 gap-3 px-3'
          )}
        >
          {collapsed
            ? <ChevronRight className="w-[17px] h-[17px]" />
            : <ChevronLeft  className="w-[17px] h-[17px]" />
          }
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="text-[13.5px] font-medium"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
};
