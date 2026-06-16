'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
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
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingOrdersCount,
  onLogout,
}: SidebarProps) {
  return (
    <AppSidebar
      accent="primary"
      brand={{
        icon: Activity,
        title: 'Admin',
      }}
      items={[
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'orders',
          name: 'Despacho',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
          badgeColor: 'portal-nav-badge',
        },
        { id: 'customers', name: 'Clientes', icon: Users },
        { id: 'doctors', name: 'Gestión Médicos', icon: Stethoscope },
        { id: 'financials', name: 'Comisiones', icon: DollarSign },
        { id: 'cms', name: 'Configuración Global', icon: Settings },
      ]}
      activeId={activeTab}
      onNavigate={setActiveTab}
      profile={{
        initials: 'CM',
        name: 'Carlos Mendoza',
        avatarClassName: 'portal-profile-avatar',
      }}
      onLogout={onLogout}
      logoutVariant="icon"
    />
  );
}
