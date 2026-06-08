'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Minus, User, PlusCircle, CreditCard, MapPin, Trash2, ShoppingBag } from 'lucide-react';
import { Product, Customer, Order, OrderItem } from '../types';
import { Button, Modal, ModalBody } from './ui';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent'>) => Customer;
  onCreateOrder: (order: Omit<Order, 'id' | 'createdAt' | 'history'>) => void;
}

export default function NewOrderModal({ 
  isOpen, 
  onClose, 
  products, 
  customers, 
  onAddCustomer, 
  onCreateOrder 
}: NewOrderModalProps) {
  // Search state
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Shopping Cart state
  const [cart, setCart] = useState<Record<string, number>>({}); // productId -> quantity
  
  // Selected Customer or New Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  // Shipping & Payment state
  const [customAddress, setCustomAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Tarjeta' | 'Transferencia' | 'Efectivo'>('Tarjeta');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Filtered lists
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  // Cart helper functions
  const addToCart = (prodId: string) => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    
    const currentQty = cart[prodId] || 0;
    if (currentQty < product.stock) {
      setCart({ ...cart, [prodId]: currentQty + 1 });
    }
  };

  const removeFromCart = (prodId: string) => {
    const currentQty = cart[prodId] || 0;
    if (currentQty <= 1) {
      const newCart = { ...cart };
      delete newCart[prodId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [prodId]: currentQty - 1 });
    }
  };

  const deleteFromCart = (prodId: string) => {
    const newCart = { ...cart };
    delete newCart[prodId];
    setCart(newCart);
  };

  // Computations
  const cartItemsList = useMemo(() => {
    return Object.entries(cart).map(([prodId, qty]) => {
      const product = products.find(p => p.id === prodId)!;
      return {
        product,
        quantity: qty,
        lineTotal: product.price * qty
      };
    });
  }, [cart, products]);

  const subtotal = cartItemsList.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = subtotal * 0.21; // 21% IVA
  const discount = Math.min(discountAmount, subtotal + tax);
  const total = Math.max(subtotal + tax - discount, 0);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let customerIdToUse = selectedCustomerId;
    let customerNameToUse = activeCustomer?.name || '';
    let customerEmailToUse = activeCustomer?.email || '';
    let addressToUse = customAddress || activeCustomer?.address || '';

    // Create client if fast creation is active
    if (isCreatingNewCustomer) {
      if (!newCustomerForm.name || !newCustomerForm.email || !newCustomerForm.address || !newCustomerForm.city) {
        alert('Por favor complete todos los datos obligatorios del cliente.');
        return;
      }
      const createdCustomer = onAddCustomer(newCustomerForm);
      customerIdToUse = createdCustomer.id;
      customerNameToUse = createdCustomer.name;
      customerEmailToUse = createdCustomer.email;
      addressToUse = customAddress || `${createdCustomer.address}, ${createdCustomer.city}`;
    }

    if (!customerIdToUse) {
      alert('Por favor seleccione o cree un cliente.');
      return;
    }

    if (cartItemsList.length === 0) {
      alert('El carrito debe contener al menos un producto.');
      return;
    }

    const orderItems: OrderItem[] = cartItemsList.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));

    onCreateOrder({
      customerId: customerIdToUse,
      customerName: customerNameToUse,
      customerEmail: customerEmailToUse,
      items: orderItems,
      subtotal,
      tax,
      discount,
      total,
      status: 'Pendiente',
      paymentMethod,
      shippingAddress: addressToUse,
    });

    // Reset Form
    setCart({});
    setSelectedCustomerId('');
    setIsCreatingNewCustomer(false);
    setNewCustomerForm({ name: '', email: '', phone: '', address: '', city: '' });
    setCustomAddress('');
    setDiscountAmount(0);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="xl" className="max-w-6xl">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-bold text-white">Registrar Nuevo Pedido</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ModalBody className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* LEFT PANEL: PRODUCT SEARCH & ADD (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-surface-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o categoría..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-950/40 border border-surface-800 rounded-xl text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Product Grid Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredProducts.map((prod) => {
                const qtyInCart = cart[prod.id] || 0;
                const isOutOfStock = prod.stock <= 0;
                const isLimitReached = qtyInCart >= prod.stock;

                return (
                  <div 
                    key={prod.id} 
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      qtyInCart > 0 
                        ? 'bg-primary-500/5 border-primary-500/40 shadow-primary-500/5' 
                        : 'bg-surface-950/20 border-surface-850 hover:border-surface-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold text-surface-500 font-mono tracking-wider uppercase">{prod.category}</span>
                        <span className={`text-[10px] font-semibold font-mono ${prod.stock <= prod.minStock ? 'text-secondary-400' : 'text-surface-400'}`}>
                          Stock: {prod.stock}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{prod.name}</h4>
                      <p className="text-[10px] text-surface-400 font-semibold font-mono mt-0.5">SKU: {prod.sku}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm font-bold text-primary-400">
                        {prod.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock || isLimitReached}
                        onClick={() => addToCart(prod.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          isOutOfStock 
                            ? 'bg-surface-800 text-surface-600 cursor-not-allowed' 
                            : isLimitReached
                            ? 'bg-surface-850 text-surface-400'
                            : 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/10'
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Añadir {qtyInCart > 0 ? `(${qtyInCart})` : ''}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Items Summary */}
            <div className="border border-surface-850 rounded-xl overflow-hidden flex flex-col flex-1 bg-surface-950/20">
              <div className="px-4 py-3 bg-surface-950/40 border-b border-surface-850 flex items-center justify-between">
                <h4 className="text-xs font-bold text-surface-300 uppercase tracking-wider">Productos Seleccionados</h4>
                <span className="text-xs font-bold text-surface-500 font-mono">{cartItemsList.length} items</span>
              </div>

              <div className="flex-1 max-h-[200px] overflow-y-auto divide-y divide-surface-850/60 p-1">
                {cartItemsList.length > 0 ? (
                  cartItemsList.map(({ product, quantity, lineTotal }) => (
                    <div key={product.id} className="flex items-center justify-between p-3 hover:bg-surface-850/25 transition-colors">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                        <p className="text-[10px] text-surface-500 font-mono">
                          {product.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-4.5">
                        <div className="flex items-center bg-surface-900 border border-surface-800 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="p-1 rounded text-surface-400 hover:text-white hover:bg-surface-800"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-xs font-mono font-bold text-white">{quantity}</span>
                          <button
                            type="button"
                            disabled={quantity >= product.stock}
                            onClick={() => addToCart(product.id)}
                            className="p-1 rounded text-surface-400 hover:text-white hover:bg-surface-800 disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-xs font-bold font-mono text-surface-300 min-w-[70px] text-right">
                          {lineTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteFromCart(product.id)}
                          className="p-1 text-surface-500 hover:text-secondary-400 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-surface-500 text-xs font-medium">
                    El carrito está vacío. Añada productos arriba.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: CUSTOMER & LOGISTICS (5 cols) */}
          <div className="lg:col-span-5 bg-surface-950/40 border border-surface-850 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            
            {/* Customer Picker Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-400 uppercase tracking-wider">Cliente del Pedido</label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewCustomer(!isCreatingNewCustomer)}
                  className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{isCreatingNewCustomer ? 'Seleccionar existente' : 'Nuevo cliente'}</span>
                </button>
              </div>

              {!isCreatingNewCustomer ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-500" />
                    <input
                      type="text"
                      placeholder="Filtrar clientes..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-surface-900 border border-surface-800 rounded-lg text-xs text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-surface-900 border border-surface-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">-- Seleccionar Cliente --</option>
                    {filteredCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name} ({cust.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Quick customer creation forms */
                <div className="space-y-2.5 p-3.5 bg-surface-900 border border-surface-850 rounded-xl">
                  <div>
                    <label className="text-[10px] font-bold text-surface-500 uppercase">Nombre Completo *</label>
                    <input
                      type="text"
                      required={isCreatingNewCustomer}
                      placeholder="Ej: Sofia Varela"
                      value={newCustomerForm.name}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                      className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-surface-500 uppercase">Email *</label>
                      <input
                        type="email"
                        required={isCreatingNewCustomer}
                        placeholder="sofia@email.com"
                        value={newCustomerForm.email}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                        className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-surface-500 uppercase">Teléfono</label>
                      <input
                        type="text"
                        placeholder="+34..."
                        value={newCustomerForm.phone}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                        className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-surface-500 uppercase">Dirección *</label>
                      <input
                        type="text"
                        required={isCreatingNewCustomer}
                        placeholder="Calle, Número, Piso"
                        value={newCustomerForm.address}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                        className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-surface-500 uppercase">Ciudad *</label>
                      <input
                        type="text"
                        required={isCreatingNewCustomer}
                        placeholder="Madrid"
                        value={newCustomerForm.city}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                        className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping logistics and payment */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Dirección de Envío (Dejar vacío para usar predeterminada)
                </label>
                <input
                  type="text"
                  placeholder={
                    activeCustomer
                      ? `Usa: ${activeCustomer.address}, ${activeCustomer.city}`
                      : 'Dirección de entrega'
                  }
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="w-full bg-surface-900 border border-surface-800 rounded-lg p-2.5 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'Tarjeta' | 'Transferencia' | 'Efectivo')}
                    className="w-full bg-surface-900 border border-surface-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary-500 mt-1.5"
                  >
                    <option value="Tarjeta">Tarjeta de Crédito</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Efectivo">Efectivo / Reembolso</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                    Descuento (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(parseFloat(e.target.value) || 0, 0))}
                    className="w-full bg-surface-900 border border-surface-800 rounded-lg p-2.5 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 mt-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Calculations and Checkout */}
            <div className="border-t border-surface-805 pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-surface-500">Subtotal:</span>
                <span className="font-mono text-surface-300">{subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">IVA (21%):</span>
                <span className="font-mono text-surface-300">{tax.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-secondary-400">
                  <span>Descuento:</span>
                  <span className="font-mono">-{discount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-surface-800 pt-2 text-white">
                <span>Total Pedido:</span>
                <span className="font-mono text-primary-400">{total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>

              {/* Submit Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={cartItemsList.length === 0 || (!selectedCustomerId && !isCreatingNewCustomer)}
                >
                  Crear Pedido
                </Button>
              </div>
            </div>

          </div>

        </ModalBody>
      </form>
    </Modal>
  );
}
