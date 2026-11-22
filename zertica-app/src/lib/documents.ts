import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { InvoiceDetail, Language, SalesReport } from '@/api/types';
import { money, monthLabel, shortDate } from './format';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

const STYLE = `
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #0F2044; padding: 28px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #F5811E; padding-bottom: 12px; }
  .brand { font-size: 26px; font-weight: 800; } .brand small { display: block; font-size: 12px; color: #6B7280; font-weight: 400; }
  h1 { font-size: 20px; margin: 0; } .muted { color: #6B7280; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; }
  th { background: #0F2044; color: #fff; text-align: left; padding: 8px; } td { padding: 8px; border-bottom: 1px solid #E5E7EB; }
  .num { text-align: right; } .total { font-size: 16px; font-weight: 800; color: #F5811E; }
  .box { background: #F3F4F6; border-radius: 8px; padding: 12px; margin-top: 14px; font-size: 12px; }
  .bar { height: 8px; background: #F5811E; border-radius: 4px; }
`;

/** Genera un PDF a partir de HTML y abre el menú para compartir/guardar. */
async function sharePdf(html: string, fileName: string) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const target = new File(Paths.cache, fileName);
  if (target.exists) target.delete();
  new File(uri).move(target);
  await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: fileName });
}

/** "Ver PDF" de una factura (pantalla Facturación). */
export async function shareInvoicePdf(inv: InvoiceDetail, language: Language, labels: Record<string, string>) {
  const rows = inv.order.items
    .map(
      (it) =>
        `<tr><td>${esc(it.reference)}</td><td>${esc(it.name)}</td><td class="num">${it.quantity}</td><td class="num">${money(it.unitPrice, language)}</td><td class="num">${money(it.lineTotal, language)}</td></tr>`,
    )
    .join('');
  const html = `<html><head><meta charset="utf-8"><style>${STYLE}</style></head><body>
    <div class="head"><div class="brand">Zertica<small>Drywall Shop</small></div>
      <div style="text-align:right"><h1>${esc(inv.code)}</h1><div class="muted">${esc(labels.issued)} · ${esc(labels.due)}</div><div class="muted">${esc(labels.status)}</div></div></div>
    <div class="box"><b>${esc(inv.company.legalName)}</b><br>${esc(labels.taxId)}: ${esc(inv.company.taxId)} · ${esc(inv.company.taxRegime)}<br>${esc(inv.company.fiscalAddress)}<br>${esc(labels.order)}: ${esc(inv.order.code)} · ${esc(inv.order.shippingAddress)}</div>
    <table><tr><th>Ref.</th><th>${esc(labels.product)}</th><th class="num">${esc(labels.qty)}</th><th class="num">${esc(labels.price)}</th><th class="num">${esc(labels.amount)}</th></tr>${rows}</table>
    <table>
      <tr><td>${esc(labels.subtotal)}</td><td class="num">${money(inv.order.subtotal, language)}</td></tr>
      ${inv.order.discount ? `<tr><td>${esc(labels.discount)} (${inv.order.discountPercent} %)</td><td class="num">-${money(inv.order.discount, language)}</td></tr>` : ''}
      <tr><td><b>${esc(labels.total)}</b></td><td class="num total">${money(inv.amount, language)}</td></tr>
    </table>
    <p class="muted">${esc(labels.footer)}</p>
  </body></html>`;
  await sharePdf(html, `${inv.code}.pdf`);
}

/** "Exportar PDF" del reporte de ventas. */
export async function shareReportPdf(r: SalesReport, language: Language, labels: Record<string, string>) {
  const max = Math.max(1, ...r.salesByCategory.map((c) => c.total));
  const cats = r.salesByCategory
    .map(
      (c) =>
        `<tr><td>${esc(c.category)}<div class="bar" style="width:${Math.round((c.total / max) * 100)}%"></div></td><td class="num">${c.units}</td><td class="num">${money(c.total, language)}</td></tr>`,
    )
    .join('');
  const html = `<html><head><meta charset="utf-8"><style>${STYLE}</style></head><body>
    <div class="head"><div class="brand">Zertica<small>Drywall Shop</small></div><div style="text-align:right"><h1>${esc(labels.title)}</h1><div class="muted">${monthLabel(r.month, language)}</div></div></div>
    <table>
      <tr><td>${esc(labels.totalSales)}</td><td class="num total">${money(r.totalSales, language)}</td></tr>
      <tr><td>${esc(labels.orders)}</td><td class="num">${r.orders}</td></tr>
      <tr><td>${esc(labels.completed)}</td><td class="num">${r.completedOrders}</td></tr>
      <tr><td>${esc(labels.newUsers)}</td><td class="num">${r.newUsers}</td></tr>
      <tr><td>${esc(labels.conversion)}</td><td class="num">${r.conversionRate} %</td></tr>
      <tr><td>${esc(labels.avgTicket)}</td><td class="num">${money(r.averageTicket, language)}</td></tr>
    </table>
    <table><tr><th>${esc(labels.byCategory)}</th><th class="num">u.</th><th class="num">$</th></tr>${cats}</table>
    <p class="muted">${shortDate(new Date(), language)} · Zertica</p>
  </body></html>`;
  await sharePdf(html, `zertica-reporte-${r.month}.pdf`);
}

/** "Exportar Excel": CSV (separado por ;) que Excel abre directamente. */
export async function shareCsv(csv: string, fileName: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: fileName });
}
