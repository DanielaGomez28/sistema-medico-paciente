'use client';

import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, Activity, LogOut, Stethoscope } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrdersCount: number;
  lowStockCount: number;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, pendingOrdersCount, lowStockCount, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'orders', name: 'Pedidos', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeColor: 'bg-amber-500 text-black' },
    { id: 'products', name: 'Productos', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-rose-500 text-white animate-pulse' },
    { id: 'customers', name: 'Clientes', icon: Users, badge: null },
    { id: 'doctors', name: 'Gestión Médicos', icon: Stethoscope, badge: null },
    { id: 'cms', name: 'Configuración CMS', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-full shrink-0 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight text-lg leading-none">Zenith OMS</h1>
          <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Gestion de Pedidos</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-white border-l-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-l-2 border-transparent'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
              <span>{item.name}</span>
              
              {item.badge !== null && (
                <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
              
              {isActive && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/20">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/40 transition-colors duration-150">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
            CM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Carlos Mendoza</p>
            <p className="text-xs text-slate-500 truncate">Administrador</p>
          </div>
          <button 
            onClick={onLogout}
            className="text-slate-500 hover:text-rose-450 transition-colors p-1.5 hover:bg-slate-800/60 rounded-lg cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
