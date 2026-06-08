'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  ChevronRight,
  TrendingDown,
  Search,
  FileSpreadsheet,
  Download,
  Activity,
  User,
  Database,
  CheckCircle,
  RefreshCw,
  Award,
  Stethoscope,
  Heart
} from 'lucide-react';
import { Order, Product } from '../types';
import { formatCurrency } from '../lib/currency';
import { downloadAuditReport } from '../lib/exportReport';
import { PageHeader, Button, Badge, StatCard, ListCard } from './ui';

interface DashboardViewProps {
  orders: Order[];
  products: Product[];
  onNavigate: (tab: string) => void;
  onSelectOrder: (order: Order) => void;
}

interface DoctorRecord {
  id: string;
  name: string;
  specialty: string;
  license: string;
  recipesCount: number;
  commissionsEarned: number;
  status: 'Activo' | 'Inactivo';
}

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastRecipeDate: string;
  withdrawalStatus: string;
}

interface StockMovement {
  id: string;
  medication: string;
  type: 'Entrada' | 'Salida';
  quantity: number;
  date: string;
  sourceDest: string;
}

const MOCK_DOCTORS: DoctorRecord[] = [
  { id: 'MED-101', name: 'Dr. Alejandro Ríos', specialty: 'Cardiología', license: 'MPPS 28.490 • CMDC-12.458', recipesCount: 120, commissionsEarned: 1450.80, status: 'Activo' },
  { id: 'MED-102', name: 'Dra. Elena Vargas', specialty: 'Medicina General', license: 'MPPS 49.321 • CMV-08.912', recipesCount: 85, commissionsEarned: 980.50, status: 'Activo' },
  { id: 'MED-103', name: 'Dr. Juan Pérez', specialty: 'Pediatría', license: 'MPPS 10.293 • CMC-05.441', recipesCount: 42, commissionsEarned: 320.00, status: 'Activo' },
  { id: 'MED-104', name: 'Dra. Patricia Gómez', specialty: 'Endocrinología', license: 'MPPS 22.810 • CMDC-09.104', recipesCount: 68, commissionsEarned: 740.20, status: 'Activo' },
  { id: 'MED-105', name: 'Dr. Roberto Sánchez', specialty: 'Dermatología', license: 'MPPS 19.340 • CMM-03.287', recipesCount: 15, commissionsEarned: 110.00, status: 'Inactivo' }
];

const MOCK_PATIENTS: PatientRecord[] = [
  { id: 'PX-992-8849', name: 'Sofía Peralta', age: 28, condition: 'Hipertensión Arterial Leve', lastRecipeDate: '08 Jun, 2026', withdrawalStatus: 'Listo para retirar' },
  { id: 'PX-992-1029', name: 'Carlos Mendoza', age: 45, condition: 'Diabetes Tipo 2 (Controlada)', lastRecipeDate: '05 Jun, 2026', withdrawalStatus: 'Retirado' },
  { id: 'PX-992-0344', name: 'Ana Gómez Román', age: 34, condition: 'Ninguna (Chequeo anual)', lastRecipeDate: '01 Jun, 2026', withdrawalStatus: 'Retirado' },
  { id: 'PX-992-0811', name: 'Luis Rodríguez Silva', age: 52, condition: 'Chequeo de Presión Arterial', lastRecipeDate: '28 May, 2026', withdrawalStatus: 'Pendiente por retirar' },
  { id: 'PX-992-4112', name: 'David Ortiz Alarcón', age: 39, condition: 'Hipotiroidismo Crónico', lastRecipeDate: '15 May, 2026', withdrawalStatus: 'Retirado' }
];

const MOCK_MOVEMENTS: StockMovement[] = [
  { id: 'MOV-104', medication: 'Ramipril 5mg', type: 'Salida', quantity: 30, date: '08 Jun, 2026', sourceDest: 'Farmahumana Caracas' },
  { id: 'MOV-103', medication: 'Metformina 850mg', type: 'Salida', quantity: 60, date: '05 Jun, 2026', sourceDest: 'Clínica Humana Valencia' },
  { id: 'MOV-102', medication: 'Atorvastatina 20mg', type: 'Salida', quantity: 30, date: '01 Jun, 2026', sourceDest: 'Farmahumana Maracaibo' },
  { id: 'MOV-101', medication: 'Ibuprofeno 600mg', type: 'Entrada', quantity: 500, date: '29 May, 2026', sourceDest: 'Laboratorio Proveedor S.A.' },
  { id: 'MOV-100', medication: 'Amoxicilina 875mg', type: 'Entrada', quantity: 200, date: '25 May, 2026', sourceDest: 'Droguería Médica S.A.' }
];

export default function DashboardView({ orders, products, onNavigate, onSelectOrder }: DashboardViewProps) {
  // Navigation active metric tab for sales line chart
  const [activeMetricTab, setActiveMetricTab] = useState<'sales' | 'recipes'>('sales');

  // Database search state
  const [dbSearchTab, setDbSearchTab] = useState<'medicos' | 'pacientes' | 'movimientos'>('medicos');
  const [dbSearchQuery, setDbSearchQuery] = useState('');

  // Export progress simulation state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMsg, setExportMsg] = useState('');
  const [pendingExportType, setPendingExportType] = useState<'Excel' | 'CSV' | null>(null);

  // Calculations for static metrics
  const completedOrders = orders.filter(o => o.status === 'Entregado');
  const activeOrders = orders.filter(o => o.status === 'Pendiente' || o.status === 'En Preparación' || o.status === 'Enviado');
  
  const revenueOrders = orders.filter(o => o.status !== 'Cancelado');
  const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.total, 0);
  
  const pendingOrdersCount = orders.filter(o => o.status === 'Pendiente').length;
  const preparingOrdersCount = orders.filter(o => o.status === 'En Preparación').length;
  
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Dynamic Chart Data mapping based on active tab
  const getSalesChartData = () => [
    { label: 'Lun', value: 240 },
    { label: 'Mar', value: 380 },
    { label: 'Mié', value: 180 },
    { label: 'Jue', value: 510 },
    { label: 'Vie', value: 420 },
    { label: 'Sáb', value: 680 },
    { label: 'Dom', value: 850 },
  ];

  const getRecipesChartData = () => [
    { label: 'Lun', value: 12 },
    { label: 'Mar', value: 18 },
    { label: 'Mié', value: 9 },
    { label: 'Jue', value: 24 },
    { label: 'Vie', value: 21 },
    { label: 'Sáb', value: 35 },
    { label: 'Dom', value: 40 },
  ];

  const chartData = activeMetricTab === 'sales' ? getSalesChartData() : getRecipesChartData();
  const maxVal = Math.max(...chartData.map(d => d.value), 100);
  const chartHeight = 160;
  const chartWidth = 500;
  
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth;
    const y = chartHeight - (d.value / maxVal) * (chartHeight - 20);
    return { x, y };
  });

  const linePath = points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  const handleExport = (type: 'Excel' | 'CSV') => {
    setPendingExportType(type);
    setIsExporting(true);
    setExportProgress(0);
    setExportMsg(`Generando archivo de auditoría contable (.${type === 'Excel' ? 'xls' : 'csv'})...`);
  };

  useEffect(() => {
    if (!isExporting || exportProgress >= 100 || !pendingExportType) {
      return;
    }

    const timer = setInterval(() => {
      setExportProgress((prev) => Math.min(prev + 20, 100));
    }, 200);

    return () => clearInterval(timer);
  }, [isExporting, exportProgress, pendingExportType]);

  useEffect(() => {
    if (!isExporting || exportProgress < 100 || !pendingExportType) {
      return;
    }

    const finishTimer = setTimeout(() => {
      downloadAuditReport(
        pendingExportType === 'Excel' ? 'excel' : 'csv',
        orders,
        products
      );
      setIsExporting(false);
      setExportProgress(0);
      setExportMsg('');
      setPendingExportType(null);
    }, 400);

    return () => clearTimeout(finishTimer);
  }, [isExporting, exportProgress, pendingExportType, orders, products]);

  // Database filtering
  const filteredDoctors = MOCK_DOCTORS.filter(d => 
    d.name.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
    d.specialty.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
    d.license.toLowerCase().includes(dbSearchQuery.toLowerCase())
  );

  const filteredPatients = MOCK_PATIENTS.filter(p => 
    p.name.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
    p.condition.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
    p.withdrawalStatus.toLowerCase().includes(dbSearchQuery.toLowerCase())
  );

  const filteredMovements = MOCK_MOVEMENTS.filter(m => 
    m.medication.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
    m.sourceDest.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
    m.type.toLowerCase().includes(dbSearchQuery.toLowerCase())
  );

  const productCategoryById = new Map(products.map((product) => [product.id, product.category]));

  const categorySales = orders
    .filter((order) => order.status !== 'Cancelado')
    .flatMap((order) => order.items)
    .reduce((acc, item) => {
      const category = productCategoryById.get(item.productId) ?? 'Sin categoría';
      const lineTotal = item.price * item.quantity;
      acc[category] = (acc[category] || 0) + lineTotal;
      return acc;
    }, {} as Record<string, number>);

  const categoryTotals = Object.entries(categorySales)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalCatVal = categoryTotals.reduce((sum, category) => sum + category.value, 0);
  const categoryBarColors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-primary-400',
    'bg-secondary-400',
    'bg-primary-600',
    'bg-secondary-600',
  ];

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Panel Administrativo (Superadmin)"
        description="Auditoría contable, estadísticas de efectividad e inteligencia de negocio."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('Excel')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('CSV')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </>
        }
      />

      {/* Export progress banner */}
      {isExporting && (
        <div className="p-4 bg-surface-900 border border-surface-800 rounded-2xl space-y-2 animate-in fade-in duration-200">
          <div className="flex justify-between items-center text-xs">
            <span className="text-surface-300 font-semibold flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{exportMsg}</span>
            </span>
            <span className="font-mono text-surface-400">{exportProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={DollarSign}
          label="Ventas Totales"
          value={formatCurrency(totalRevenue)}
          hint={
            <>
              <TrendingUp className="h-3 w-3" />
              <span>+12.4% vs. mes anterior</span>
            </>
          }
        />
        <StatCard
          icon={Heart}
          label="Récipes Emitidos"
          value="338"
          accent="primary"
          hint={
            <>
              <Activity className="h-3 w-3" />
              <span>98% firmados electrónicamente</span>
            </>
          }
        />
        <StatCard
          icon={ShoppingBag}
          label="Transacciones de Venta"
          value={orders.length}
          hint={
            <>
              <span>{completedOrders.length} retirados</span>
              <span>•</span>
              <span className="text-primary-450">{pendingOrdersCount} en espera</span>
            </>
          }
        />
        <StatCard
          icon={Award}
          label="Efectividad de Tratamientos"
          value="94.6%"
          accent="primary"
          hint={
            <>
              <CheckCircle className="h-3 w-3" />
              <span>Control exitoso de pacientes activos</span>
            </>
          }
        />
      </div>

      {/* Interactive Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Line Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h4 className="zenith-section-title">Tendencia Operativa Semanal</h4>
              <p className="text-xs text-surface-400">Filtre y visualice las estadísticas clave de rendimiento.</p>
            </div>
            
            {/* Interactive metric selectors */}
            <div className="flex items-center gap-1 text-2xs font-bold bg-surface-950 border border-surface-850 rounded-xl p-1 self-start sm:self-center">
              <button
                onClick={() => setActiveMetricTab('sales')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeMetricTab === 'sales' ? 'bg-white text-surface-950' : 'text-surface-500 hover:text-foreground'}`}
              >
                Ventas
              </button>
              <button
                onClick={() => setActiveMetricTab('recipes')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeMetricTab === 'recipes' ? 'bg-white text-surface-950' : 'text-surface-500 hover:text-foreground'}`}
              >
                Récipes Emitidos
              </button>
            </div>
          </div>

          {/* SVG line graph */}
          <div className="flex-1 w-full flex items-end relative min-h-[160px] pt-4">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="main-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="glow-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.65" />
                </linearGradient>
              </defs>
              
              <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="var(--color-surface-800)" strokeDasharray="3" />
              <line x1="0" y1="70" x2={chartWidth} y2="70" stroke="var(--color-surface-800)" strokeDasharray="3" />
              <line x1="0" y1="120" x2={chartWidth} y2="120" stroke="var(--color-surface-800)" strokeDasharray="3" />
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="var(--color-surface-700)" />

              {areaPath && (
                <path d={areaPath} fill="url(#main-gradient)" className="transition-all duration-300" />
              )}
              {linePath && (
                <path d={linePath} fill="none" stroke="url(#glow-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
              )}

              {points.map((p, idx) => (
                <g key={idx} className="group/dot cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="5.5" fill="var(--color-surface-900)" stroke="var(--color-primary)" strokeWidth="2.5" className="transition-all duration-150 hover:r-7" />
                  <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" className="opacity-0 group-hover/dot:opacity-100 transition-opacity bg-surface-950 font-mono">
                    {activeMetricTab === 'sales' ? formatCurrency(chartData[idx].value) : `${chartData[idx].value} r.`}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex justify-between mt-3 px-1 text-2xs font-bold text-surface-500">
            {chartData.map((d, idx) => (
              <span key={idx} className="w-10 text-center">{d.label}</span>
            ))}
          </div>
        </div>

        {/* Category breakdown (1/3 width) */}
        <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col">
          <div className="mb-4">
            <h4 className="zenith-section-title">Distribución por Categorías</h4>
            <p className="text-xs text-surface-400">Ventas por línea terapéutica en pedidos activos.</p>
          </div>

          <div className="flex-1 space-y-3.5">
            {categoryTotals.length > 0 ? (
              categoryTotals.map((cat, idx) => {
                const percentage = totalCatVal > 0 ? (cat.value / totalCatVal) * 100 : 0;
                const barColor = categoryBarColors[idx % categoryBarColors.length];

                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5">
                      <span
                        className="text-xs font-semibold leading-snug text-surface-200 break-words"
                        title={cat.name}
                      >
                        {cat.name}
                      </span>
                      <span className="text-xs font-semibold text-surface-100 tabular-nums whitespace-nowrap">
                        {formatCurrency(cat.value)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 min-w-0 flex-1 rounded-full bg-surface-850/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${Math.max(percentage, percentage > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-[10px] font-semibold text-surface-500 tabular-nums">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-xs font-medium text-surface-500">
                Sin movimientos financieros para clasificar.
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-surface-850 pt-3.5 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-surface-500">Total categorizado</span>
            <span className="font-semibold text-white tabular-nums">
              {formatCurrency(totalCatVal)}
            </span>
          </div>
        </div>

      </div>

      {/* Advanced Database Search Engine (Buscador Avanzado) */}
      <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
        
        {/* Database header with input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-850 pb-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-surface-400" />
            <div>
              <h4 className="zenith-section-title">Buscador y Consultas de Base de Datos</h4>
              <p className="text-xs text-surface-400">Consulte tablas relacionales sincronizadas con las sucursales de la red.</p>
            </div>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
            <input
              type="text"
              placeholder="Filtro rápido de búsqueda..."
              value={dbSearchQuery}
              onChange={(e) => setDbSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white placeholder-surface-700 focus:outline-none focus:border-secondary-500"
            />
          </div>
        </div>

        {/* Database Search Tabs */}
        <div className="flex items-center gap-1.5 text-2xs font-bold border-b border-surface-850 pb-1 overflow-x-auto flex-nowrap">
          <button
            onClick={() => { setDbSearchTab('medicos'); setDbSearchQuery(''); }}
            className={`pb-2.5 px-4 relative transition-colors cursor-pointer ${dbSearchTab === 'medicos' ? 'text-white border-b-2 border-primary-550' : 'text-surface-500 hover:text-surface-350'}`}
          >
            Médicos Colegiados ({filteredDoctors.length})
          </button>
          <button
            onClick={() => { setDbSearchTab('pacientes'); setDbSearchQuery(''); }}
            className={`pb-2.5 px-4 relative transition-colors cursor-pointer ${dbSearchTab === 'pacientes' ? 'text-white border-b-2 border-primary-550' : 'text-surface-500 hover:text-surface-350'}`}
          >
            Pacientes Afiliados ({filteredPatients.length})
          </button>
          <button
            onClick={() => { setDbSearchTab('movimientos'); setDbSearchQuery(''); }}
            className={`pb-2.5 px-4 relative transition-colors cursor-pointer ${dbSearchTab === 'movimientos' ? 'text-white border-b-2 border-primary-550' : 'text-surface-500 hover:text-surface-350'}`}
          >
            Movimientos de Stock ({filteredMovements.length})
          </button>
        </div>

        {/* Tab content viewer */}
        <div className="min-h-[180px]">
          
          {/* Doctors Table */}
          {dbSearchTab === 'medicos' && (
            <>
            <div className="zenith-table-wrap hidden lg:block">
            <table className="zenith-table text-xs">
              <thead>
                <tr className="border-b border-surface-850 text-surface-500 uppercase font-bold tracking-wider">
                  <th className="py-2.5">ID</th>
                  <th>Médico</th>
                  <th>Especialidad</th>
                  <th>Registro Médico</th>
                  <th>Récipes Emitidos</th>
                  <th>Comisiones</th>
                  <th className="text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/60 text-surface-300">
                {filteredDoctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-surface-950/20">
                    <td className="py-3 font-mono font-bold text-surface-500">{doc.id}</td>
                    <td className="font-semibold text-white flex items-center gap-1.5 py-3">
                      <Stethoscope className="h-3.5 w-3.5 text-surface-500" />
                      <span>{doc.name}</span>
                    </td>
                    <td>{doc.specialty}</td>
                    <td className="font-mono text-surface-450">{doc.license}</td>
                    <td className="font-semibold">{doc.recipesCount} r.</td>
                    <td className="font-mono font-bold text-secondary-400">{formatCurrency(doc.commissionsEarned)}</td>
                    <td className="text-right whitespace-nowrap">
                      <span className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${doc.status === 'Activo' ? 'bg-secondary-500/10 text-secondary-400' : 'bg-surface-800 text-surface-500'}`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="lg:hidden space-y-3">
              {filteredDoctors.map((doc) => (
                <ListCard
                  key={doc.id}
                  title={doc.name}
                  subtitle={doc.specialty}
                  badge={
                    <span className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${doc.status === 'Activo' ? 'bg-secondary-500/10 text-secondary-400' : 'bg-surface-800 text-surface-500'}`}>
                      {doc.status}
                    </span>
                  }
                  fields={[
                    { label: 'ID', value: doc.id },
                    { label: 'Registro', value: doc.license },
                    { label: 'Récipes', value: `${doc.recipesCount} r.` },
                    { label: 'Comisiones', value: formatCurrency(doc.commissionsEarned) },
                  ]}
                />
              ))}
            </div>
            </>
          )}

          {/* Patients Table */}
          {dbSearchTab === 'pacientes' && (
            <>
            <div className="zenith-table-wrap hidden lg:block">
            <table className="zenith-table text-xs">
              <thead>
                <tr className="border-b border-surface-855 text-surface-500 uppercase font-bold tracking-wider">
                  <th className="py-2.5">Cédula</th>
                  <th>Nombre Paciente</th>
                  <th>Edad</th>
                  <th>Diagnóstico Activo</th>
                  <th>Último Récipe</th>
                  <th className="text-right">Estado Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/60 text-surface-300">
                {filteredPatients.map(pat => (
                  <tr key={pat.id} className="hover:bg-surface-950/20">
                    <td className="py-3 font-mono font-bold text-surface-500">{pat.id}</td>
                    <td className="font-semibold text-white py-3">{pat.name}</td>
                    <td className="font-mono">{pat.age} años</td>
                    <td className="italic text-surface-400">{pat.condition}</td>
                    <td>{pat.lastRecipeDate}</td>
                    <td className="text-right whitespace-nowrap">
                      <span className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${
                        pat.withdrawalStatus === 'Retirado' 
                          ? 'bg-secondary-500/10 text-secondary-400' 
                          : pat.withdrawalStatus === 'Listo para retirar' 
                          ? 'bg-primary-500/10 text-primary-400' 
                          : 'bg-primary-500/10 text-primary-400'
                      }`}>
                        {pat.withdrawalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="lg:hidden space-y-3">
              {filteredPatients.map((pat) => (
                <ListCard
                  key={pat.id}
                  title={pat.name}
                  subtitle={pat.id}
                  badge={
                    <span className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${
                      pat.withdrawalStatus === 'Retirado'
                        ? 'bg-secondary-500/10 text-secondary-400'
                        : 'bg-primary-500/10 text-primary-400'
                    }`}>
                      {pat.withdrawalStatus}
                    </span>
                  }
                  fields={[
                    { label: 'Edad', value: `${pat.age} años` },
                    { label: 'Diagnóstico', value: pat.condition },
                    { label: 'Último récipe', value: pat.lastRecipeDate },
                  ]}
                />
              ))}
            </div>
            </>
          )}

          {/* Stock Movements Table */}
          {dbSearchTab === 'movimientos' && (
            <>
            <div className="zenith-table-wrap hidden lg:block">
            <table className="zenith-table text-xs">
              <thead>
                <tr className="border-b border-surface-855 text-surface-500 uppercase font-bold tracking-wider">
                  <th className="py-2.5">Movimiento</th>
                  <th>Medicamento / Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                  <th className="text-right">Origen / Destino</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/60 text-surface-300">
                {filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-surface-950/20">
                    <td className="py-3 font-mono font-bold text-surface-550">{mov.id}</td>
                    <td className="font-semibold text-white py-3">{mov.medication}</td>
                    <td>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${mov.type === 'Entrada' ? 'bg-secondary-500/10 text-secondary-400' : 'bg-secondary-500/10 text-secondary-400'}`}>
                        {mov.type}
                      </span>
                    </td>
                    <td className="font-mono font-bold">{mov.quantity} u.</td>
                    <td>{mov.date}</td>
                    <td className="text-right text-surface-400">{mov.sourceDest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="lg:hidden space-y-3">
              {filteredMovements.map((mov) => (
                <ListCard
                  key={mov.id}
                  title={mov.medication}
                  subtitle={mov.id}
                  badge={
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${mov.type === 'Entrada' ? 'bg-secondary-500/10 text-secondary-400' : 'bg-secondary-500/10 text-secondary-400'}`}>
                      {mov.type}
                    </span>
                  }
                  fields={[
                    { label: 'Cantidad', value: `${mov.quantity} u.` },
                    { label: 'Fecha', value: mov.date },
                    { label: 'Origen/Destino', value: mov.sourceDest },
                  ]}
                />
              ))}
            </div>
            </>
          )}

        </div>

      </div>

      {/* Recent Activity Table (2/3 width) & Stock Warning strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="zenith-section-title">Últimos Pedidos</h4>
              <p className="text-xs text-surface-400">Monitoreo en tiempo real de transacciones.</p>
            </div>
            <button 
              onClick={() => onNavigate('orders')} 
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-0.5 group cursor-pointer"
            >
              Ver todos los pedidos <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="zenith-table-wrap hidden lg:block">
            <table className="zenith-table text-sm">
              <thead>
                <tr className="border-b border-surface-805 text-xs font-bold text-surface-450 uppercase tracking-wider">
                  <th className="pb-3">ID</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/60">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-850/20 transition-colors duration-150">
                    <td className="py-3 font-mono font-bold text-surface-350">{order.id}</td>
                    <td className="py-3 text-white font-medium">{order.customerName}</td>
                    <td className="py-3 font-mono font-bold text-surface-300">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <Badge status={order.status}>{order.status}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="px-2.5 py-1 text-xs font-semibold text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-md border border-surface-700 transition-colors cursor-pointer"
                      >
                        Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden space-y-3">
            {recentOrders.map((order) => (
              <ListCard
                key={order.id}
                title={order.id}
                subtitle={order.customerName}
                badge={<Badge status={order.status}>{order.status}</Badge>}
                fields={[
                  {
                    label: 'Total',
                    value: formatCurrency(order.total),
                  },
                ]}
                actions={
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="px-2.5 py-1 text-xs font-semibold text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-md border border-surface-700 transition-colors cursor-pointer"
                  >
                    Detalles
                  </button>
                }
              />
            ))}
          </div>
        </div>

        {/* Inventory alerts */}
        <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md flex flex-col">
          <div className="mb-4">
            <h4 className="zenith-section-title">Alertas de Inventario</h4>
            <p className="text-xs text-surface-400">Productos cercanos o bajo stock mínimo.</p>
          </div>
          
          <div className="flex-1 space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 3).map((prod) => (
                <div 
                  key={prod.id} 
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-950/40 border border-secondary-500/10"
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/20 text-secondary-450 flex items-center justify-center font-bold text-xs">
                    {prod.stock}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-white truncate">{prod.name}</p>
                    <p className="text-[10px] text-surface-500 font-mono truncate">SKU: {prod.sku} • Min: {prod.minStock}</p>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-bold text-secondary-400 bg-secondary-500/15 border border-secondary-500/20 rounded-md whitespace-nowrap">
                    Bajo stock
                  </span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-surface-950/20 border border-dashed border-surface-800 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-secondary-500/10 text-secondary-450 flex items-center justify-center mb-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-surface-350">Todo en orden</p>
                <p className="text-[10px] text-surface-500 mt-1">No hay alertas de inventario en este momento.</p>
              </div>
            )}
            
            {lowStockProducts.length > 3 && (
              <p className="w-full text-center text-xs text-secondary-400 font-semibold pt-2">
                Y {lowStockProducts.length - 3} alertas más de inventario
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
