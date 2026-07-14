'use client';

/**
 * @fileoverview Punto de entrada del frontend SMP Farmahumana.
 * @description Orquesta la sesi?n, el portal activo y la composici?n principal de vistas del cliente.
 */

import { useState } from 'react';
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
import { Activity } from 'lucide-react';
import LoginView from '../components/LoginView';
import DoctorView from '../components/DoctorView';
import PatientView from '../components/PatientView';
import CmsView from '../components/CmsView';
import DoctorsManagerView from '../components/DoctorsManagerView';
import FinancialSettingsView from '../components/FinancialSettingsView';


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
    digitalSignatureHash?: string | null;
    officeLocation?: string | null;
    status?: string | null;
  } | null;
};

/**
 * Componente principal (Home) que actúa como controlador y orquestador (Entry Point).
 * Dependiendo del estado de autenticación (role: 'médico' | 'paciente' | 'admin'), 
 * renderiza el portal (vista) correspondiente.
 * 
 * También maneja el estado global maestro para la aplicación administrativa (Orders, Products, Customers)
 * y se encarga de hidratar la memoria local (localStorage) en el cliente para persistencia de datos simulada.
 * 
 * @returns {JSX.Element}
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
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
        role: parsed.role || '',
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
              digitalSignatureHash: parsed.doctorProfile.digitalSignatureHash || null,
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


  // Sync helpers
  const handleLoginSuccess = (user: AuthenticatedUser) => {
    setCurrentUser(user);
    localStorage.setItem('zenith_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('zenith_user');
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

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-950 text-primary-400 font-semibold gap-3 h-screen">
        <Activity className="h-6 w-6 animate-pulse" />
        <span>Cargando Médico-Paciente...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const normalizedRole = currentUser.role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normalizedRole === 'medico') {
    // 🚀 Ommran: Nombre dinámico si viene en las credenciales del usuario
    const currentName = currentUser.name || APP_USER_DEFAULTS.doctorName;
    return (
      <DoctorView
        doctorName={currentName}
        doctorEmail={currentUser.email}
        doctorId={currentUser.doctorId || currentUser.userId || currentUser.email}
        doctorProfile={currentUser.doctorProfile || null}
        onLogout={handleLogout}
      />
    );
  }

  if (normalizedRole === 'paciente') {
    // 🚀 Ommran: Nombre dinámico si viene en las credenciales del usuario
    const currentName = currentUser.name || APP_USER_DEFAULTS.patientName;
    return (
      <PatientView
        patientName={currentName}
        patientEmail={currentUser.email}
        patientId={currentUser.patientId || null}
        socketIdentity={currentUser.socketIdentity || currentUser.patientId || currentUser.email}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <AppShell
      portal="admin"
      sidebar={
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingOrdersCount={pendingCount}
          onLogout={handleLogout}
          adminName={currentUser?.name || APP_USER_DEFAULTS.adminName}
        />
      }
      // 📄 Dentro de tu src/app/page.tsx (Sección del Header del Administrador)
      header={({ onMenuClick }) => {
        // 🚀 1. Calculamos las iniciales en tiempo real basándonos en el backend
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
            statusLabel={adminName} // El label que ya tenías
            showNotifications={false}
            // 🚀 2. INYECTAMOS LAS PROPIEDADES DINÁMICAS AQUÍ:
            profileName={adminName}
            profileInitials={adminInitials}
            actions={
              <AppHeaderAction variant="admin" onClick={() => setIsNewOrderOpen(true)}>
                Nuevo Pedido
              </AppHeaderAction>
            }
          />
        );
      }}
    >
      {activeTab === 'dashboard' && (
        <DashboardView
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'orders' && (
        <OrdersView
          orders={orders}
          onSelectOrder={setSelectedOrder}
          onOpenNewOrder={() => setIsNewOrderOpen(true)}
        />
      )}

      {activeTab === 'customers' && (
        <CustomersView customers={customers} onAddCustomer={handleAddCustomer} />
      )}

      {activeTab === 'cms' && <CmsView />}

      {activeTab === 'doctors' && <DoctorsManagerView />}

      {activeTab === 'financials' && <FinancialSettingsView />}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {isNewOrderOpen && (
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
