'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  Activity,
  Stethoscope,
  DollarSign,
} from 'lucide-react';
import { AppSidebar } from './layout';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrdersCount: number;
  lowStockCount: number;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingOrdersCount,
  lowStockCount,
  onLogout,
}: SidebarProps) {
  return (
    <AppSidebar
      accent="primary"
      brand={{
        icon: Activity,
        title: 'Zenith OMS',
        subtitle: 'Gestion de Pedidos',
      }}
      items={[
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'orders',
          name: 'Pedidos',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
          badgeColor: 'bg-primary-500 text-surface-950',
        },
        {
          id: 'products',
          name: 'Productos',
          icon: Package,
          badge: lowStockCount > 0 ? lowStockCount : null,
          badgeColor: 'bg-secondary-500 text-white animate-pulse',
        },
        { id: 'customers', name: 'Clientes', icon: Users },
        { id: 'doctors', name: 'Gestión Médicos', icon: Stethoscope },
        { id: 'financials', name: 'Comisiones', icon: DollarSign },
        { id: 'cms', name: 'Configuración CMS', icon: Settings },
      ]}
      activeId={activeTab}
      onNavigate={setActiveTab}
      profile={{
        initials: 'CM',
        name: 'Carlos Mendoza',
        role: 'Administrador',
      }}
      onLogout={onLogout}
      logoutVariant="icon"
    />
  );
}
