'use strict';

const { pool } = require('../config/db');
const { round2 } = require('../utils/money');

const n = (v) => Number(v || 0);
const ymd = (d) =>
  typeof d === 'string' ? d.slice(0, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Reporte mensual de ventas (pantalla "Reportes" de Figma).
 * Ventas = pedidos no cancelados del mes. Conversión = clientes con al menos
 * un pedido en el mes / clientes activos (roles user y company).
 */
async function monthly(month) {
  const from = `${month}-01`;
  const range = `created_at >= ? AND created_at < (? + INTERVAL 1 MONTH)`;
  const [[sales]] = await pool.query(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS total, COUNT(DISTINCT user_id) AS buyers,
            COALESCE(SUM(status = 'completed'), 0) AS completed
     FROM orders WHERE status <> 'cancelled' AND ${range}`,
    [from, from],
  );
  const [[users]] = await pool.query(`SELECT COUNT(*) AS n FROM users WHERE role IN ('user','company') AND ${range}`, [from, from]);
  const [[customers]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role IN ('user','company') AND is_active = 1");
  const [byCategory] = await pool.query(
    `SELECT oi.category_name AS category, SUM(oi.line_total * (1 - o.discount_percent / 100)) AS total, SUM(oi.quantity) AS units
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.status <> 'cancelled' AND o.created_at >= ? AND o.created_at < (? + INTERVAL 1 MONTH)
     GROUP BY oi.category_name ORDER BY total DESC`,
    [from, from],
  );
  const [byDay] = await pool.query(
    `SELECT DATE(created_at) AS day, SUM(total) AS total, COUNT(*) AS orders
     FROM orders WHERE status <> 'cancelled' AND ${range} GROUP BY DATE(created_at) ORDER BY day`,
    [from, from],
  );
  const orders = n(sales.orders);
  return {
    data: {
      month,
      totalSales: round2(n(sales.total)),
      orders,
      completedOrders: n(sales.completed),
      newUsers: n(users.n),
      conversionRate: customers.n ? round2((n(sales.buyers) / n(customers.n)) * 100) : 0,
      averageTicket: orders ? round2(n(sales.total) / orders) : 0,
      salesByCategory: byCategory.map((r) => ({ category: r.category, total: round2(n(r.total)), units: n(r.units) })),
      salesByDay: byDay.map((r) => ({ day: ymd(r.day), total: round2(n(r.total)), orders: n(r.orders) })),
    },
  };
}

/** CSV (compatible con Excel) del reporte y sus pedidos. */
async function csv(month) {
  const { data } = await monthly(month);
  const from = `${month}-01`;
  const [rows] = await pool.query(
    `SELECT o.code, o.created_at, u.full_name, co.name AS company, o.status, o.item_count, o.subtotal, o.discount, o.total, o.payment_label
     FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN companies co ON co.id = o.company_id
     WHERE o.created_at >= ? AND o.created_at < (? + INTERVAL 1 MONTH) ORDER BY o.created_at`,
    [from, from],
  );
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    `Reporte de ventas Zertica;${month}`,
    `Ventas totales;${data.totalSales}`,
    `Pedidos;${data.orders}`,
    `Pedidos completados;${data.completedOrders}`,
    `Nuevos usuarios;${data.newUsers}`,
    `Tasa de conversión (%);${data.conversionRate}`,
    `Ticket promedio;${data.averageTicket}`,
    '',
    'Categoría;Ventas;Unidades',
    ...data.salesByCategory.map((c) => `${q(c.category)};${c.total};${c.units}`),
    '',
    'Pedido;Fecha;Cliente;Empresa;Estado;Unidades;Subtotal;Descuento;Total;Pago',
    ...rows.map((r) =>
      [q(r.code), q(new Date(r.created_at).toISOString().slice(0, 10)), q(r.full_name), q(r.company), q(r.status), r.item_count, r.subtotal, r.discount, r.total, q(r.payment_label)].join(';'),
    ),
  ];
  return `﻿${lines.join('\r\n')}\r\n`;
}

module.exports = { monthly, csv };
