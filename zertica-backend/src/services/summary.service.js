'use strict';

const { pool } = require('../config/db');
const userModel = require('../models/user.model');

const n = (v) => Number(v || 0);

/**
 * Resumen del panel administrativo (pantalla "Dashboard" del diseño).
 * Solo cuenta registros de las 5 tablas: no hay ventas ni pedidos en el MVP.
 */
async function getSummary() {
  const [[products]] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(is_active = 1), 0) AS active, COALESCE(SUM(is_active = 0), 0) AS inactive,
            COALESCE(SUM(image_url IS NULL), 0) AS without_image
     FROM products`,
  );
  const [[categories]] = await pool.query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(is_active = 1), 0) AS active, COALESCE(SUM(is_active = 0), 0) AS inactive FROM categories',
  );
  const [[brands]] = await pool.query('SELECT COUNT(*) AS total FROM brands');
  const users = await userModel.summary();
  // v2: ventas y pedidos para el "Dashboard" de Figma.
  const [[today]] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total END), 0) AS today,
            COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN total END), 0) AS yesterday,
            COALESCE(SUM(DATE(created_at) = CURDATE()), 0) AS orders_today
     FROM orders WHERE status <> 'cancelled' AND created_at >= CURDATE() - INTERVAL 1 DAY`,
  );
  const [[active]] = await pool.query("SELECT COUNT(*) AS n FROM orders WHERE status IN ('pending','processing','shipped')");
  const [week] = await pool.query(
    `SELECT DATE(created_at) AS day, SUM(total) AS total FROM orders
     WHERE status <> 'cancelled' AND created_at >= CURDATE() - INTERVAL 6 DAY GROUP BY DATE(created_at)`,
  );
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekMap = new Map(week.map((w) => [typeof w.day === 'string' ? w.day : ymd(w.day), n(w.total)]));
  const weekSales = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    weekSales.push({ day: ymd(d), weekday: d.getDay(), total: weekMap.get(ymd(d)) || 0 });
  }
  const [latest] = await pool.query(
    `SELECT o.id, o.code, o.status, o.total, o.created_at, u.full_name, co.name AS company
     FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN companies co ON co.id = o.company_id
     ORDER BY o.created_at DESC, o.id DESC LIMIT 3`,
  );
  const [top] = await pool.query(
    `SELECT oi.product_id, oi.product_name, SUM(oi.quantity) AS units, SUM(oi.line_total) AS total
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.status <> 'cancelled' AND o.created_at >= CURDATE() - INTERVAL 30 DAY
     GROUP BY oi.product_id, oi.product_name ORDER BY units DESC LIMIT 3`,
  );
  const change = n(today.yesterday) ? Math.round(((n(today.today) - n(today.yesterday)) / n(today.yesterday)) * 100) : null;
  return {
    data: {
      sales: { today: n(today.today), yesterday: n(today.yesterday), changePercent: change, ordersToday: n(today.orders_today) },
      orders: { active: n(active.n) },
      weekSales,
      latestOrders: latest.map((o) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        total: n(o.total),
        createdAt: o.created_at,
        customer: o.company || o.full_name,
      })),
      topProducts: top.map((t) => ({ productId: t.product_id, name: t.product_name, units: n(t.units), total: n(t.total) })),
      products: { total: n(products.total), active: n(products.active), inactive: n(products.inactive), withoutImage: n(products.without_image) },
      categories: { total: n(categories.total), active: n(categories.active), inactive: n(categories.inactive) },
      brands: { total: n(brands.total) },
      users: { total: n(users.total), active: n(users.active), inactive: n(users.inactive), admins: n(users.admins) },
    },
  };
}

module.exports = { getSummary };
