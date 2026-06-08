'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Package, AlertTriangle, PlusCircle, MinusCircle, X } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../lib/currency';
import { PageHeader, Button, FilterBar, Input, Select, Modal, ModalBody, ModalFooter } from './ui';

interface ProductsViewProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
}

export default function ProductsView({ products, onUpdateStock, onAddProduct }: ProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    category: 'Tecnología',
    price: '',
    stock: '',
    minStock: '',
    imageColor: 'from-primary to-secondary',
  });

  // Extract categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Color options for products
  const colorPresets = [
    { label: 'Turquesa', value: 'from-primary to-primary-600' },
    { label: 'Verde Bosque', value: 'from-secondary to-secondary-600' },
    { label: 'Combinado', value: 'from-primary to-secondary' },
  ];

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const handleStockAdjust = (prodId: string, currentStock: number, amount: number) => {
    const nextStock = Math.max(0, currentStock + amount);
    onUpdateStock(prodId, nextStock);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, sku, category, price, stock, minStock, imageColor } = newProductForm;
    
    if (!name || !sku || !price || !stock || !minStock) {
      alert('Por favor complete todos los datos.');
      return;
    }

    onAddProduct({
      name,
      sku,
      category,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 0,
      imageColor,
    });

    setNewProductForm({
      name: '',
      sku: '',
      category: 'Tecnología',
      price: '',
      stock: '',
      minStock: '',
      imageColor: 'from-primary to-secondary',
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Productos"
        description="Control de inventario, stock y catálogo general."
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Añadir Producto
          </Button>
        }
      />

      <FilterBar columns={3}>
        <Input
          icon={<Search className="h-4 w-4" />}
          className="md:col-span-2"
          placeholder="Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-surface-500 shrink-0" />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'Todas las Categorías' : cat}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      {/* Products Catalog Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((prod) => {
            const isLowStock = prod.stock <= prod.minStock;

            return (
              <div 
                key={prod.id} 
                className="bg-surface-900/60 border border-surface-800 rounded-2xl overflow-hidden flex flex-col justify-between backdrop-blur-md group hover:border-surface-700 transition-all duration-350"
              >
                
                {/* Visual Card Top Block */}
                <div className={`h-24 bg-gradient-to-tr ${prod.imageColor} relative p-4 flex flex-col justify-between`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-surface-950/35 backdrop-blur-md px-2 py-0.5 rounded-full text-white font-bold font-mono tracking-wide uppercase">
                      {prod.category}
                    </span>
                    <span className="text-[10px] bg-surface-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-surface-300 font-bold font-mono border border-surface-800">
                      {prod.sku}
                    </span>
                  </div>
                  
                  {isLowStock && (
                    <div className="absolute -bottom-3.5 right-4 bg-secondary-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-secondary-500/20 border border-surface-950">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Stock Crítico</span>
                    </div>
                  )}
                </div>

                {/* Card Details Block */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-primary-400 transition-colors">
                      {prod.name}
                    </h3>
                  </div>

                  {/* Pricing and Stock count */}
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-surface-500 font-bold uppercase">Precio Unitario</span>
                      <p className="font-mono text-sm font-semibold text-white mt-0.5">
                        {formatCurrency(prod.price)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-[10px] text-surface-500 font-bold uppercase">Stock Disponible</span>
                      <p className={`font-mono text-base font-bold mt-0.5 ${isLowStock ? 'text-secondary-400' : 'text-surface-350'}`}>
                        {prod.stock}
                      </p>
                    </div>
                  </div>

                  {/* Stock adjuster controls */}
                  <div className="pt-3 border-t border-surface-850 flex items-center justify-between">
                    <span className="text-[10px] text-surface-500 font-bold uppercase">Ajustar Stock</span>
                    <div className="flex items-center gap-1 bg-surface-950/40 p-1 border border-surface-850 rounded-lg">
                      <button
                        onClick={() => handleStockAdjust(prod.id, prod.stock, -1)}
                        className="p-1 text-surface-500 hover:text-white rounded hover:bg-surface-900 transition-colors"
                        title="Restar 1 unidad"
                      >
                        <MinusCircle className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-mono font-bold px-2 text-surface-300">
                        {prod.stock}
                      </span>
                      <button
                        onClick={() => handleStockAdjust(prod.id, prod.stock, 5)}
                        className="p-1 text-surface-500 hover:text-white rounded hover:bg-surface-900 transition-colors"
                        title="Sumar 5 unidades"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 text-surface-500 flex flex-col items-center justify-center p-6 bg-surface-900/20 border border-dashed border-surface-800 rounded-2xl">
          <div className="h-12 w-12 rounded-full bg-surface-950 border border-surface-800 flex items-center justify-center mb-3">
            <Package className="h-5 w-5 text-surface-600" />
          </div>
          <p className="font-semibold text-surface-400">No se encontraron productos</p>
          <p className="text-xs text-surface-500 mt-1">Intente ajustar los términos de búsqueda o filtros.</p>
        </div>
      )}

      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="md">
        <form onSubmit={handleAddProductSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
            <h3 className="zenith-section-title flex items-center gap-1.5">
              <Package className="h-4.5 w-4.5 text-primary-400" />
              Añadir Nuevo Producto
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
                <label className="zenith-field-label">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ratón Ergonómico Pro"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="zenith-field-label">SKU / Código Único *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: RAT-ERG-005"
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                  />
                </div>
                <div>
                  <label className="zenith-field-label">Categoría</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary-500 mt-1"
                  >
                    <option value="Tecnología">Tecnología</option>
                    <option value="Audio">Audio</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Hogar">Hogar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="zenith-field-label">Precio (Bs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="49.99"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                  />
                </div>
                <div>
                  <label className="zenith-field-label">Stock Inicial *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                    className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                  />
                </div>
                <div>
                  <label className="zenith-field-label">Stock Mínimo *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="3"
                    value={newProductForm.minStock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, minStock: e.target.value })}
                    className="w-full bg-surface-950 border border-surface-850 rounded-lg p-2.5 text-xs text-white placeholder-surface-600 focus:outline-none focus:border-primary-500 mt-1"
                  />
                </div>
              </div>

              {/* Image Color Gradient selector */}
              <div>
                <label className="zenith-field-label">Preset de Visual (Color)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setNewProductForm({ ...newProductForm, imageColor: preset.value })}
                      className={`p-2 rounded-xl text-2xs font-semibold border flex items-center justify-between text-left cursor-pointer transition-all ${
                        newProductForm.imageColor === preset.value
                          ? 'border-primary-500 bg-primary-500/10 text-white'
                          : 'border-surface-850 bg-surface-950/20 text-surface-400 hover:border-surface-700'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-tr ${preset.value}`}></span>
                    </button>
                  ))}
                </div>
              </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" className="w-full" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full">
              Añadir Producto
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
