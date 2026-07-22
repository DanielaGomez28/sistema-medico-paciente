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
  FileText,
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
  enableOperationalTabs = true,
}: SidebarProps) {
  return (
    <AppSidebar
      accent="primary"
      className="admin-sidebar-shell !border-r-surface-850"
      navClassName="admin-nav-cyan"
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
        { id: 'recipes', name: 'Gestión Recipes', icon: FileText },
        { id: 'financials', name: 'Gestión Comisiones', icon: DollarSign },
      ]}
      bottomItems={[
        { id: 'cms', name: 'Configuración', icon: Settings },
      ]}
      activeId={activeTab}
      onNavigate={setActiveTab}
    />
  );
}
