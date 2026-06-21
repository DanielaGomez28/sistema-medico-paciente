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

/**
 * Propiedades del componente Sidebar de Administración.
 * @interface SidebarProps
 * @property {string} activeTab - ID de la pestaña o ruta actualmente activa en la vista.
 * @property {(tab: string) => void} setActiveTab - Función ejecutada para cambiar de vista.
 * @property {number} pendingOrdersCount - Cantidad de órdenes pendientes (usada para la insignia/badge).
 * @property {() => void} onLogout - Función que maneja el cierre de sesión del admin.
 */
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrdersCount: number;
  onLogout: () => void;
}

/**
 * Componente contenedor que implementa el `AppSidebar` genérico con la configuración
 * específica para el portal de Administrador. Define los ítems de navegación y el perfil.
 *
 * @param {SidebarProps} props - Propiedades y acciones de navegación.
 * @returns {JSX.Element} Sidebar configurado para admin.
 */
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
