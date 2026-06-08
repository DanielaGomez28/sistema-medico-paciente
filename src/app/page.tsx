'use client';

import React, { useState, useEffect } from 'react';
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
import { INITIAL_ORDERS, INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from '../data/mockData';
import { Bell, Activity } from 'lucide-react';
import LoginView from '../components/LoginView';
import DoctorView from '../components/DoctorView';
import PatientView from '../components/PatientView';
import CmsView from '../components/CmsView';
import DoctorsManagerView from '../components/DoctorsManagerView';
import FinancialSettingsView from '../components/FinancialSettingsView';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<{ role: string; email: string } | null>(null);
  
  // Master states
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    const localUser = localStorage.getItem('zenith_user');
    if (localUser) {
      setCurrentUser(JSON.parse(localUser));
    }

    const localOrders = localStorage.getItem('zenith_orders');
    const localProducts = localStorage.getItem('zenith_products');
    const localCustomers = localStorage.getItem('zenith_customers');

    if (localOrders) {
      setOrders(JSON.parse(localOrders));
    } else {
      setOrders(INITIAL_ORDERS);
      localStorage.setItem('zenith_orders', JSON.stringify(INITIAL_ORDERS));
    }

    if (localProducts) {
      setProducts(JSON.parse(localProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('zenith_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    const storedCustomersVersion = Number(localStorage.getItem('zenith_customers_version') ?? '0') || null;
    const customersData = loadCustomersFromStorage(localCustomers);
    setCustomers(customersData);
    localStorage.setItem('zenith_customers', JSON.stringify(customersData));
    if (shouldRefreshCustomersStorage(storedCustomersVersion)) {
      localStorage.setItem('zenith_customers_version', String(CUSTOMERS_DATA_VERSION));
    }
    
    setIsLoaded(true);
  }, []);

  // Sync helpers
  const handleLoginSuccess = (role: string, email: string) => {
    const user = { role, email };
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
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

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

  if (currentUser.role === 'médico') {
    return <DoctorView doctorName="Dr. Alejandro Ríos" doctorEmail={currentUser.email} onLogout={handleLogout} />;
  }

  if (currentUser.role === 'paciente') {
    return <PatientView patientName="Sofía Peralta" patientEmail={currentUser.email} onLogout={handleLogout} />;
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
        />
      }
      header={({ onMenuClick }) => (
        <AppHeader
          onMenuClick={onMenuClick}
          notificationCount={pendingCount + lowStockCount}
          actions={
            <AppHeaderAction variant="admin" onClick={() => setIsNewOrderOpen(true)}>
              Nuevo Pedido
            </AppHeaderAction>
          }
        />
      )}
    >
      {activeTab === 'dashboard' && (
        <DashboardView
          orders={orders}
          products={products}
          onNavigate={setActiveTab}
          onSelectOrder={setSelectedOrder}
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
