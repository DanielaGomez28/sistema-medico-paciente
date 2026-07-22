'use client';

/**
 * @fileoverview Punto de entrada del frontend SMP Farmahumana.
 * @description Orquesta la sesión, el portal activo y la composición principal de vistas del cliente.
 */

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { AppShell, AppHeader, AppHeaderAction } from '../components/layout';
import DashboardView from '../components/DashboardView';
import OrdersView from '../components/OrdersView';
import CustomersView from '../components/CustomersView';
import OrderDetailModal from '../components/OrderDetailModal';
import NewOrderModal from '../components/NewOrderModal';
import { Order, Product, Customer, OrderStatus } from '../types';
import {
  CUSTOMERS_DATA_VERSION,
  loadCustomersFromStorage,
  shouldRefreshCustomersStorage,
} from '../lib/customerLocation';
import {
  PRODUCTS_DATA_VERSION,
  loadProductsFromStorage,
  shouldRefreshProductsStorage,
} from '../lib/productCatalog';
import { APP_USER_DEFAULTS, INITIAL_ORDERS, INITIAL_PRODUCTS } from '../data/mockData';
import LoginView from '../components/LoginView';
import DoctorView from '../components/DoctorView';
import PatientView from '../components/PatientView';
import CmsView from '../components/CmsView';
import DoctorsManagerView from '../components/DoctorsManagerView';
import FinancialSettingsView from '../components/FinancialSettingsView';
import AdminRecipesView from '../components/AdminRecipesView';

type PlatformTermsState = {
  platformTermsVersion: number;
  termsAndConditionsText: string;
  usagePolicyText: string;
};

type InitialAdminState = {
  orders: Order[];
  products: Product[];
  customers: Customer[];
};

/**
 * Lee la persistencia administrativa local y devuelve un estado inicial consistente.
 * @returns {InitialAdminState} Estado inicial hidratado para ?rdenes, productos y clientes.
 */
function getInitialAdminState(): InitialAdminState {
  if (typeof window === 'undefined') {
    return {
      orders: INITIAL_ORDERS,
      products: INITIAL_PRODUCTS,
      customers: loadCustomersFromStorage(null),
    };
  }

  try {
    const localOrders = localStorage.getItem('zenith_orders');
    const localProducts = localStorage.getItem('zenith_products');
    const localCustomers = localStorage.getItem('zenith_customers');

    const storedProductsVersion = Number(localStorage.getItem('zenith_products_version') ?? '0') || null;
    const productsData = loadProductsFromStorage(localProducts);
    const refreshProducts = shouldRefreshProductsStorage(storedProductsVersion, productsData);
    const products = refreshProducts ? INITIAL_PRODUCTS : productsData;
    const orders = refreshProducts
      ? INITIAL_ORDERS
      : localOrders && localOrders !== 'undefined' && localOrders !== 'null'
        ? JSON.parse(localOrders)
        : INITIAL_ORDERS;

    localStorage.setItem('zenith_products', JSON.stringify(products));
    localStorage.setItem('zenith_orders', JSON.stringify(orders));
    localStorage.setItem('zenith_products_version', String(PRODUCTS_DATA_VERSION));

    const storedCustomersVersion = Number(localStorage.getItem('zenith_customers_version') ?? '0') || null;
    const customers = loadCustomersFromStorage(localCustomers);
    localStorage.setItem('zenith_customers', JSON.stringify(customers));
    if (shouldRefreshCustomersStorage(storedCustomersVersion)) {
      localStorage.setItem('zenith_customers_version', String(CUSTOMERS_DATA_VERSION));
    }

    return { orders, products, customers };
  } catch (error) {
    console.error('Error cargando datos de LocalStorage en desarrollo:', error);
    localStorage.removeItem('zenith_user');
    return {
      orders: INITIAL_ORDERS,
      products: INITIAL_PRODUCTS,
      customers: loadCustomersFromStorage(null),
    };
  }
}

type AuthenticatedUser = {
  role: string;
  email: string;
  name: string;
  token?: string | null;
  userId?: string | null;
  doctorId?: string | null;
  patientId?: string | null;
  socketIdentity?: string | null;
  doctorProfile?: {
    mpps?: string | null;
    specialty?: string | null;
    medicalCollege?: string | null;
    specialSanitaryRegistration?: string | null;
    officeLocation?: string | null;
    status?: string | null;
  } | null;
};

/**
 * Normaliza el rol autenticado del frontend para evitar bifurcaciones entre alias administrativos.
 * @param {string | null | undefined} role - Rol crudo recibido desde login o persistencia local.
 * @returns {string} Rol estable del cliente.
 */
function normalizeFrontendRole(role: string | null | undefined): string {
  const normalizedRole = String(role || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['superusuario', 'superuser', 'superadmin', 'admin'].includes(normalizedRole)) {
    return 'admin';
  }

  if (['medico', 'doctor'].includes(normalizedRole)) {
    return 'doctor';
  }

  if (['paciente', 'patient'].includes(normalizedRole)) {
    return 'patient';
  }

  return normalizedRole;
}

function getPlatformTermsAcceptanceStorageKey(user: AuthenticatedUser) {
  return `zenith_platform_terms_acceptance:${user.userId || user.email}`;
}

/**
 * Componente principal (Home) que actÃºa como controlador y orquestador (Entry Point).
 * Dependiendo del estado de autenticaciÃ³n (role: 'mÃ©dico' | 'paciente' | 'admin'), 
 * renderiza el portal (vista) correspondiente.
 * 
 * TambiÃ©n maneja el estado global maestro para la aplicaciÃ³n administrativa (Orders, Products, Customers)
 * y se encarga de hidratar la memoria local (localStorage) en el cliente para persistencia de datos simulada.
 * 
 * @returns {JSX.Element}
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isHydrated, setIsHydrated] = useState(false);
  // Master state del usuario con el nombre dinámico incluido
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    if (typeof window === 'undefined') return null;

    try {
      const localUser = localStorage.getItem('zenith_user');
      if (!localUser || localUser === 'undefined' || localUser === 'null') {
        return null;
      }

      const parsed = JSON.parse(localUser);
      return {
        role: normalizeFrontendRole(parsed.role || parsed.rol),
        email: parsed.email || '',
        name: parsed.name || parsed.nombre || 'Usuario',
        userId: parsed.userId || null,
        doctorId: parsed.doctorId || null,
        patientId: parsed.patientId || null,
        socketIdentity: parsed.socketIdentity || null,
        token: parsed.token || null,
        doctorProfile: parsed.doctorProfile
          ? {
            mpps: parsed.doctorProfile.mpps || null,
            specialty: parsed.doctorProfile.specialty || null,
            medicalCollege: parsed.doctorProfile.medicalCollege || null,
            specialSanitaryRegistration: parsed.doctorProfile.specialSanitaryRegistration || null,
            officeLocation: parsed.doctorProfile.officeLocation || null,
            status: parsed.doctorProfile.status || null,
          }
          : null,
      };
    } catch {
      return null;
    }
  });

  // Master states
  const [initialAdminState] = useState<InitialAdminState>(() => getInitialAdminState());
  const [orders, setOrders] = useState<Order[]>(initialAdminState.orders);
  const [products, setProducts] = useState<Product[]>(initialAdminState.products);
  const [customers, setCustomers] = useState<Customer[]>(initialAdminState.customers);
  const [isLoaded] = useState(true);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [platformTerms, setPlatformTerms] = useState<PlatformTermsState | null>(null);
  const [showPlatformTermsModal, setShowPlatformTermsModal] = useState(false);
  const [hasReadTermsAndConditions, setHasReadTermsAndConditions] = useState(false);
  const [hasReadUsagePolicy, setHasReadUsagePolicy] = useState(false);

  // OJO: no usar requestAnimationFrame acá. El navegador lo suspende en pestañas
  // en segundo plano, así que si la app se abría sin foco (ctrl+click, restaurar
  // sesión, abrir en pestaña nueva) isHydrated nunca pasaba a true y la pantalla
  // quedaba clavada en el splash para siempre. useEffect ya corre solo en el
  // cliente después de hidratar, que es lo único que necesitamos garantizar.
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Sync helpers

  const handleLoginSuccess = (user: AuthenticatedUser) => {
    setCurrentUser(user);
    localStorage.setItem('zenith_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('zenith_user');
    setPlatformTerms(null);
    setShowPlatformTermsModal(false);
  };

  const saveOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('zenith_orders', JSON.stringify(updatedOrders));
  };

  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('zenith_products', JSON.stringify(updatedProducts));
  };

  const saveCustomers = (updatedCustomers: Customer[]) => {
    setCustomers(updatedCustomers);
    localStorage.setItem('zenith_customers', JSON.stringify(updatedCustomers));
  };

  // Actions
  const handleAddCustomer = (newCust: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent'>) => {
    const newId = `cust-${customers.length + 1}`;
    const customerWithId: Customer = {
      ...newCust,
      id: newId,
      totalOrders: 0,
      totalSpent: 0
    };
    const updated = [...customers, customerWithId];
    saveCustomers(updated);
    return customerWithId;
  };

  const handleCreateOrder = (newOrderData: Omit<Order, 'id' | 'createdAt' | 'history'>) => {
    // Generate Order ID
    const maxIdNum = orders.reduce((max, o) => {
      const match = o.id.match(/PED-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 1000);
    const newId = `PED-${maxIdNum + 1}`;

    const timestamp = new Date().toISOString();
    const newOrder: Order = {
      ...newOrderData,
      id: newId,
      createdAt: timestamp,
      history: [
        {
          status: 'Pendiente',
          timestamp: timestamp,
          note: 'Pedido registrado en el sistema.'
        }
      ]
    };

    // Deduct stock
    const updatedProducts = products.map(prod => {
      const cartItem = newOrder.items.find(item => item.productId === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity)
        };
      }
      return prod;
    });

    // Update Customer Statistics
    const updatedCustomers = customers.map(cust => {
      if (cust.id === newOrder.customerId) {
        return {
          ...cust,
          totalOrders: cust.totalOrders + 1,
          totalSpent: parseFloat((cust.totalSpent + newOrder.total).toFixed(2))
        };
      }
      return cust;
    });

    saveOrders([newOrder, ...orders]);
    saveProducts(updatedProducts);
    saveCustomers(updatedCustomers);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus, note: string) => {
    const timestamp = new Date().toISOString();

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedHistory = [
          ...order.history,
          {
            status: nextStatus,
            timestamp: timestamp,
            note: note
          }
        ];

        return {
          ...order,
          status: nextStatus,
          history: updatedHistory
        };
      }
      return order;
    });

    // Handle Cancelled order - return stock
    if (nextStatus === 'Cancelado') {
      const cancelledOrder = orders.find(o => o.id === orderId);
      if (cancelledOrder) {
        // Return product stock
        const updatedProducts = products.map(prod => {
          const item = cancelledOrder.items.find(i => i.productId === prod.id);
          if (item) {
            return { ...prod, stock: prod.stock + item.quantity };
          }
          return prod;
        });

        // Deduct from customer stats
        const updatedCustomers = customers.map(cust => {
          if (cust.id === cancelledOrder.customerId) {
            return {
              ...cust,
              totalOrders: Math.max(0, cust.totalOrders - 1),
              totalSpent: parseFloat(Math.max(0, cust.totalSpent - cancelledOrder.total).toFixed(2))
            };
          }
          return cust;
        });

        saveProducts(updatedProducts);
        saveCustomers(updatedCustomers);
      }
    }

    saveOrders(updatedOrders);

    // Sync current modal detail view
    const currentOrder = updatedOrders.find(o => o.id === orderId);
    if (currentOrder) {
      setSelectedOrder(currentOrder);
    }
  };

  // Calculations for Badges
  const pendingCount = orders.filter(o => o.status === 'Pendiente').length;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const enableOperationalTabs = /localhost|127\.0\.0\.1/i.test(apiBaseUrl);

  useEffect(() => {
    if (!currentUser || !isHydrated) {
      return;
    }

    let cancelled = false;

    const syncPlatformTerms = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/platform/terms`);
        const data = (await response.json()) as PlatformTermsState;

        if (!response.ok || cancelled) {
          return;
        }

        const nextTerms = {
          platformTermsVersion: Number(data.platformTermsVersion || 1),
          termsAndConditionsText: data.termsAndConditionsText || 'Términos de plataforma no disponibles.',
          usagePolicyText: data.usagePolicyText || 'Política de uso no disponible.',
        };

        setPlatformTerms(nextTerms);
        const acceptedVersion = Number(
          localStorage.getItem(getPlatformTermsAcceptanceStorageKey(currentUser)) || '0'
        );
        const mustAccept = acceptedVersion !== nextTerms.platformTermsVersion;
        setShowPlatformTermsModal(mustAccept);
        if (mustAccept) {
          setHasReadTermsAndConditions(false);
          setHasReadUsagePolicy(false);
        }
      } catch {
        if (!cancelled) {
          setShowPlatformTermsModal(false);
        }
      }
    };

    void syncPlatformTerms();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, currentUser, isHydrated]);

  const handleAcceptPlatformTerms = () => {
    if (!currentUser || !platformTerms || !hasReadTermsAndConditions || !hasReadUsagePolicy) {
      return;
    }

    localStorage.setItem(
      getPlatformTermsAcceptanceStorageKey(currentUser),
      String(platformTerms.platformTermsVersion)
    );
    setShowPlatformTermsModal(false);
    setHasReadTermsAndConditions(false);
    setHasReadUsagePolicy(false);
  };

  const withPlatformTermsGate = (content: React.ReactNode) => (
    <>
      {content}
      {showPlatformTermsModal && platformTerms ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-surface-950/80 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-surface-800 bg-surface-900 p-6 shadow-2xl space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-300">
                Términos de la plataforma
              </p>
              <h2 className="text-xl font-bold text-white">
                Debe aceptar los términos vigentes para continuar
              </h2>
              <p className="text-sm text-surface-400">
                Este aviso se muestra en el primer ingreso y cada vez que la plataforma actualiza sus términos.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-surface-800 bg-surface-950/60 p-4 space-y-2">
                <h3 className="text-sm font-bold text-white">Términos y condiciones</h3>
                <div className="max-h-72 overflow-y-auto text-sm leading-relaxed text-surface-300 whitespace-pre-wrap">
                  {platformTerms.termsAndConditionsText}
                </div>
              </section>

              <section className="rounded-2xl border border-surface-800 bg-surface-950/60 p-4 space-y-2">
                <h3 className="text-sm font-bold text-white">Política de uso</h3>
                <div className="max-h-72 overflow-y-auto text-sm leading-relaxed text-surface-300 whitespace-pre-wrap">
                  {platformTerms.usagePolicyText}
                </div>
              </section>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-surface-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasReadTermsAndConditions}
                    onChange={(e) => setHasReadTermsAndConditions(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-600 bg-surface-950 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  />
                  He leído y acepto los Términos y condiciones
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-surface-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasReadUsagePolicy}
                    onChange={(e) => setHasReadUsagePolicy(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-600 bg-surface-950 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  />
                  He leído y acepto la Política de uso
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-surface-700 bg-surface-950 px-4 py-2.5 text-sm font-bold text-surface-300"
                >
                  No aceptar y cerrar
                </button>
                <button
                  type="button"
                  onClick={handleAcceptPlatformTerms}
                  disabled={!hasReadTermsAndConditions || !hasReadUsagePolicy}
                  className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-surface-950 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Aceptar y continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (!isLoaded || !isHydrated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-950 gap-4 h-screen">
        <img
          src="/logo.png"
          alt="+Salud"
          width={74}
          height={74}
          className="animate-pulse"
          style={{ display: 'block', width: '74px', height: '74px', objectFit: 'contain' }}
        />
        <span className="text-primary-400 font-bold tracking-tight" style={{ fontSize: '28px' }}>+Salud</span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const normalizedRole = normalizeFrontendRole(currentUser.role);
  const isDoctorRole = normalizedRole === 'doctor';
  const isPatientRole = normalizedRole === 'patient';
  const isAdminRole = normalizedRole === 'admin';

  if (isDoctorRole) {
    // ðŸš€ Ommran: Nombre dinÃ¡mico si viene en las credenciales del usuario
    const currentName = currentUser.name || APP_USER_DEFAULTS.doctorName;
    return withPlatformTermsGate(
      <DoctorView
        doctorName={currentName}
        doctorEmail={currentUser.email}
        doctorId={currentUser.doctorId || currentUser.userId || currentUser.email}
        doctorProfile={currentUser.doctorProfile || null}
        onLogout={handleLogout}
      />
    );
  }

  if (isPatientRole) {
    // ðŸš€ Ommran: Nombre dinÃ¡mico si viene en las credenciales del usuario
    const currentName = currentUser.name || APP_USER_DEFAULTS.patientName;
    return withPlatformTermsGate(
      <PatientView
        patientName={currentName}
        patientEmail={currentUser.email}
        patientId={currentUser.patientId || null}
        socketIdentity={currentUser.socketIdentity || currentUser.patientId || currentUser.email}
        onLogout={handleLogout}
      />
    );
  }

  if (!isAdminRole) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return withPlatformTermsGate(
    <AppShell
      portal="admin"
      layout="vertical-collapsible"
      scrollKey={activeTab}
      sidebar={
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingOrdersCount={pendingCount}
          adminName={currentUser?.name || APP_USER_DEFAULTS.adminName}
          enableOperationalTabs={enableOperationalTabs}
        />
      }
      // ðŸ“„ Dentro de tu src/app/page.tsx (SecciÃ³n del Header del Administrador)
      header={({ onMenuClick }) => {
        // ðŸš€ 1. Calculamos las iniciales en tiempo real basÃ¡ndonos en el backend
        const getInitials = (nameString: string) => {
          const parts = nameString.trim().split(/\s+/);
          if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
          return parts[0] ? parts[0][0].toUpperCase() : 'AD';
        };

        const adminName = currentUser?.name || APP_USER_DEFAULTS.adminName;
        const adminInitials = getInitials(adminName);

        return (
          <AppHeader
            onMenuClick={onMenuClick}
            statusLabel=""
            showNotifications={false}
            className="admin-header-white"
            // ðŸš€ 2. INYECTAMOS LAS PROPIEDADES DINÃMICAS AQUÃ:
            profileName={adminName}
            profileInitials={adminInitials}
            showProfileName={false}
            showProfileAvatar={false}
            onLogout={handleLogout}
            actions={enableOperationalTabs ? (
              <AppHeaderAction variant="admin" onClick={() => setIsNewOrderOpen(true)}>
                Nuevo Pedido
              </AppHeaderAction>
            ) : undefined}
          />
        );
      }}
    >
      {activeTab === 'dashboard' && (
        <DashboardView
          onNavigate={setActiveTab}
        />
      )}

      {enableOperationalTabs && activeTab === 'orders' && (
        <OrdersView
          orders={orders}
          onSelectOrder={setSelectedOrder}
          onOpenNewOrder={() => setIsNewOrderOpen(true)}
        />
      )}

      {enableOperationalTabs && activeTab === 'customers' && (
        <CustomersView customers={customers} onAddCustomer={handleAddCustomer} />
      )}

      {activeTab === 'cms' && <CmsView />}

      {activeTab === 'doctors' && <DoctorsManagerView />}

      {activeTab === 'recipes' && <AdminRecipesView />}

      {activeTab === 'financials' && <FinancialSettingsView />}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {enableOperationalTabs && isNewOrderOpen && (
        <NewOrderModal
          isOpen={isNewOrderOpen}
          onClose={() => setIsNewOrderOpen(false)}
          products={products}
          customers={customers}
          onAddCustomer={handleAddCustomer}
          onCreateOrder={handleCreateOrder}
        />
      )}
    </AppShell>
  );
}

