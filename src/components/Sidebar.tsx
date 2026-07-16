'use client';

/**
 * @fileoverview Componente sidebar.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

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
 */
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrdersCount: number;
  onLogout: () => void;
  adminName: string;
  enableOperationalTabs?: boolean;
}

/**
 * Componente contenedor que implementa el `AppSidebar` genérico con la configuración
 * específica para el portal de Administrador.
 * @param {SidebarProps} props - Propiedades de navegación y perfil.
 * @returns {JSX.Element}
 */
export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingOrdersCount,
  onLogout,
  adminName,
  enableOperationalTabs = true,
}: SidebarProps) {
  const getInitials = (nameString: string) => {
    const parts = nameString.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : 'AD';
  };

  const dynamicInitials = getInitials(adminName || 'Administrador Sistema');

  return (
    <AppSidebar
      accent="primary"
      brand={{
        icon: Activity,
        title: 'Admin',
      }}
      items={[
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        ...(enableOperationalTabs
          ? [
              {
                id: 'orders',
                name: 'Despacho',
                icon: ShoppingBag,
                badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
                badgeColor: 'portal-nav-badge',
              },
              { id: 'customers', name: 'Clientes', icon: Users },
            ]
          : []),
        { id: 'doctors', name: 'Gestión Médicos', icon: Stethoscope },
        { id: 'financials', name: 'Comisiones', icon: DollarSign },
        { id: 'cms', name: 'Configuración Global', icon: Settings },
      ]}
      activeId={activeTab}
      onNavigate={setActiveTab}
      profile={{
        initials: dynamicInitials,
        name: adminName || 'Administrador Sistema',
        avatarClassName: 'portal-profile-avatar',
      }}
      onLogout={onLogout}
      logoutVariant="icon"
    />
  );
}
