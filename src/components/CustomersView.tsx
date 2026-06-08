'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, Users, Mail, Phone, MapPin, DollarSign, ShoppingBag, X } from 'lucide-react';
import { Customer } from '../types';
import { formatCurrency } from '../lib/currency';
import { PageHeader, Button, Input, Modal, ModalBody, ModalFooter, ListCard } from './ui';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent'>) => Customer;
}

export default function CustomersView({ customers, onAddCustomer }: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  // Filters
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  // Statistics
  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageSpent = customers.length > 0 ? totalSpentAll / customers.length : 0;
  
  const topSpender = useMemo(() => {
    if (customers.length === 0) return null;
    return [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [customers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, address, city } = newCustomerForm;
    if (!name || !email || !address || !city) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }
    onAddCustomer({ name, email, phone, address, city });
    setNewCustomerForm({ name: '', email: '', phone: '', address: '', city: '' });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Directorio de Clientes"
        description="Listado, datos de contacto y estadísticas de consumo."
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Añadir Cliente
          </Button>
        }
      />

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface-900/40 border border-surface-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="zenith-field-label">Clientes Totales</span>
            <p className="text-lg font-semibold text-white mt-0.5">{customers.length}</p>
          </div>
        </div>
        <div className="bg-surface-900/40 border border-surface-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="zenith-field-label">Gasto Medio</span>
            <p className="text-lg font-semibold text-white mt-0.5">
              {formatCurrency(averageSpent)}
            </p>
          </div>
        </div>
        <div className="bg-surface-900/40 border border-surface-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-secondary-500/10 text-secondary-400 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <span className="zenith-field-label">Mayor Comprador</span>
            <p className="text-sm font-bold text-white truncate max-w-[150px] mt-0.5" title={topSpender?.name}>
              {topSpender ? `${topSpender.name} (${topSpender.totalOrders} ped.)` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
        <input
          type="text"
          placeholder="Buscar clientes por nombre, correo o ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-900/40 border border-surface-800 rounded-xl text-xs text-white placeholder-surface-550 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Customers Table List */}
      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl overflow-hidden backdrop-blur-md">
        {filteredCustomers.length > 0 ? (
          <>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-850 bg-surface-950/20 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Dirección</th>
                  <th className="px-6 py-4 text-center">Pedidos</th>
                  <th className="px-6 py-4 text-right">Facturación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-850/20 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                          {c.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-surface-200 leading-none">{c.name}</p>
                          <span className="text-[10px] text-surface-500 font-mono mt-1 block">ID: {c.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 space-y-1">
                      <p className="text-xs text-surface-350 flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-surface-500 shrink-0" />
                        {c.email}
                      </p>
                      {c.phone && (
                        <p className="text-xs text-surface-400 flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-surface-500 shrink-0" />
                          {c.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4.5">
                      <p className="text-xs text-surface-350 flex items-center gap-1.5" title={c.address}>
                        <MapPin className="h-3.5 w-3.5 text-surface-500 shrink-0" />
                        <span>{c.address}, {c.city}</span>
                      </p>
                    </td>
                    <td className="px-6 py-4.5 text-center font-mono font-bold text-white text-xs">
                      {c.totalOrders}
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono font-bold text-primary-400">
                      {formatCurrency(c.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden space-y-3 p-4">
            {filteredCustomers.map((c) => (
              <ListCard
                key={c.id}
                title={c.name}
                subtitle={c.email}
                fields={[
                  { label: 'Ciudad', value: c.city },
                  { label: 'Pedidos', value: c.totalOrders },
                  { label: 'Facturación', value: formatCurrency(c.totalSpent) },
                  { label: 'Teléfono', value: c.phone || '—' },
                ]}
              />
            ))}
          </div>
          </>
        ) : (
          <div className="text-center py-24 text-surface-500 flex flex-col items-center justify-center p-6 border-surface-800">
            <div className="h-12 w-12 rounded-full bg-surface-950 border border-surface-800 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-surface-600" />
            </div>
            <p className="font-semibold text-surface-400">No se encontraron clientes</p>
            <p className="text-xs text-surface-500 mt-1">Modifique los términos de búsqueda.</p>
          </div>
        )}
      </div>

      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="md">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
            <h3 className="zenith-section-title flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-primary-400" />
              Registrar Nuevo Cliente
            </h3>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="p-1 rounded-lg text-surface-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ModalBody className="space-y-4">
              <div>
                <label className="zenith-field-label">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Martínez"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                />
              </div>

              <div>
                <label className="zenith-field-label">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="laura@email.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                />
              </div>

              <div>
                <label className="zenith-field-label">Teléfono de Contacto</label>
                <input
                  type="text"
                  placeholder="+58 412 000 0000"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="zenith-field-label">Dirección Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Calle, Número, Escalera"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                    className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                  />
                </div>
                <div>
                  <label className="zenith-field-label">Ciudad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Caracas"
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                  />
                </div>
              </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" className="w-full" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full">
              Guardar Cliente
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
