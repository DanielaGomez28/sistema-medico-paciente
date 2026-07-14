/**
 * @fileoverview Utilidad de frontend export report.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
import { Order, Product } from '../types';

type ExportFormat = 'csv' | 'excel';

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeXml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportRows(orders: Order[], products: Product[]): string[][] {
  const revenueOrders = orders.filter((order) => order.status !== 'Cancelado');
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
  const lowStockProducts = products.filter((product) => product.stock <= product.minStock);
  const generatedAt = new Date().toLocaleString('es-VE');

  const rows: string[][] = [
    ['REPORTE DE AUDITORÍA CONTABLE - ZENITH FARMACIA (ARCHIVO DE PRUEBA)'],
    ['Generado', generatedAt],
    ['Tipo', 'Datos simulados para demostración'],
    [],
    ['RESUMEN'],
    ['Métrica', 'Valor'],
    ['Pedidos registrados', String(orders.length)],
    ['Pedidos con ingreso', String(revenueOrders.length)],
    ['Ventas totales (Bs.)', totalRevenue.toFixed(2)],
    ['Productos en catálogo', String(products.length)],
    ['Alertas de stock bajo', String(lowStockProducts.length)],
    [],
    ['PEDIDOS'],
    ['ID', 'Cliente', 'Estado', 'Total (Bs.)', 'Método de pago', 'Fecha'],
    ...orders.map((order) => [
      order.id,
      order.customerName,
      order.status,
      order.total.toFixed(2),
      order.paymentMethod,
      new Date(order.createdAt).toLocaleDateString('es-VE'),
    ]),
    [],
    ['INVENTARIO CON STOCK BAJO'],
    ['SKU', 'Medicamento', 'Stock', 'Stock mínimo', 'Categoría'],
    ...lowStockProducts.map((product) => [
      product.sku,
      product.name,
      String(product.stock),
      String(product.minStock),
      product.category,
    ]),
  ];

  if (lowStockProducts.length === 0) {
    rows.push(['Sin alertas de inventario en este archivo de prueba.']);
  }

  return rows;
}

/**
 * Construye el contenido de un archivo CSV con el reporte de auditoría.
 *
 * @param {Order[]} orders - Lista de pedidos a incluir en el reporte.
 * @param {Product[]} products - Lista de productos para verificar alertas de stock.
 * @returns {string} El contenido del archivo CSV con BOM (Byte Order Mark) para correcta codificación.
 */
export function buildAuditCsv(orders: Order[], products: Product[]): string {
  const rows = buildReportRows(orders, products);
  const body = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  return `\uFEFF${body}`;
}

/**
 * Construye el contenido de un archivo Excel (XML Spreadsheet 2003) con el reporte de auditoría.
 *
 * @param {Order[]} orders - Lista de pedidos a incluir en el reporte.
 * @param {Product[]} products - Lista de productos para verificar alertas de stock.
 * @returns {string} El contenido XML del archivo Excel.
 */
export function buildAuditExcel(orders: Order[], products: Product[]): string {
  const rows = buildReportRows(orders, products);
  const tableRows = rows
    .map((row) => {
      if (row.length === 0) {
        return '<Row></Row>';
      }

      const cells = row
        .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
        .join('');

      return `<Row>${cells}</Row>`;
    })
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Auditoria">
    <Table>
      ${tableRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

function getExportFilename(format: ExportFormat): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  return format === 'csv'
    ? `auditoria-zenith-prueba-${dateStamp}.csv`
    : `auditoria-zenith-prueba-${dateStamp}.xls`;
}

/**
 * Inicia la descarga en el navegador del reporte de auditoría generado.
 *
 * @param {ExportFormat} format - El formato deseado para la exportación ('csv' o 'excel').
 * @param {Order[]} orders - Lista de pedidos a incluir.
 * @param {Product[]} products - Lista de productos a auditar.
 * @returns {void}
 */
export function downloadAuditReport(
  format: ExportFormat,
  orders: Order[],
  products: Product[]
): void {
  const isCsv = format === 'csv';
  const content = isCsv ? buildAuditCsv(orders, products) : buildAuditExcel(orders, products);
  const mimeType = isCsv
    ? 'text/csv;charset=utf-8;'
    : 'application/vnd.ms-excel';

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = getExportFilename(format);
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
