"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Home,
  LayoutDashboard,
  Menu,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { type PerformanceRange, useDashboardData } from "@/hooks/useDashboardData";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { Property } from "@/types/models";
import styles from "./ReferenceDashboard.module.css";

const navigation = [
  { label: "Inicio", href: "/", icon: LayoutDashboard },
  { label: "Propiedades", href: "/properties", icon: Building2 },
  { label: "Ingresos", href: "/income", icon: WalletCards },
  { label: "Gastos", href: "/expenses", icon: ReceiptText },
  { label: "Calendario", href: "/calendar", icon: CalendarDays },
  { label: "Reportes", href: "/reports", icon: BarChart3 },
];

const rangeOptions: { label: string; value: PerformanceRange }[] = [
  { label: "1 mes", value: "1M" },
  { label: "3 meses", value: "3M" },
  { label: "6 meses", value: "6M" },
  { label: "1 año", value: "1A" },
];

const propertyPalettes = ["violet", "blue", "amber", "rose"] as const;

function money(value: number | null | undefined, currency = "USD") {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function propertyInitials(property: Property) {
  return property.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function PropertyCard({ property, index }: { property: Property; index: number }) {
  const palette = propertyPalettes[index % propertyPalettes.length];

  return (
    <Link href={`/properties/${property.id}`} className={styles.propertyCard}>
      <div className={`${styles.propertyVisual} ${styles[palette]}`}>
        <div className={styles.propertyGlow} />
        <span>{propertyInitials(property)}</span>
        <Building2 aria-hidden="true" />
      </div>
      <div className={styles.propertyInfo}>
        <div>
          <h3>{property.name}</h3>
          <p>{property.address || "Ubicación por definir"}</p>
        </div>
        <span className={styles.propertyCurrency}>{property.currency}</span>
      </div>
      <div className={styles.propertyFooter}>
        <span><TrendingUp aria-hidden="true" /> Seguimiento activo</span>
        <span>Ver detalle</span>
      </div>
    </Link>
  );
}

export function ReferenceDashboard() {
  const { user, logout } = useAuth();
  const [range, setRange] = useState<PerformanceRange>("6M");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { properties, summary, chartData, isLoading, propertySummaries } = useDashboardData(range);

  const firstName = user?.full_name?.split(" ")[0] || "Usuario";
  const selectedCurrency = properties[0]?.currency || "USD";
  const visibleProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return properties.slice(0, 4);
    return properties
      .filter((property) => `${property.name} ${property.address}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 4);
  }, [properties, query]);

  const chartValues = chartData.length > 0
    ? chartData
    : [
        { name: "Lun", Ingresos: 0, Gastos: 0 },
        { name: "Mar", Ingresos: 0, Gastos: 0 },
        { name: "Mié", Ingresos: 0, Gastos: 0 },
        { name: "Jue", Ingresos: 0, Gastos: 0 },
        { name: "Vie", Ingresos: 0, Gastos: 0 },
        { name: "Sáb", Ingresos: 0, Gastos: 0 },
        { name: "Dom", Ingresos: 0, Gastos: 0 },
      ];

  const occupancy = summary?.occupancy_rate == null ? null : summary.occupancy_rate * 100;
  const metricCards = [
    {
      label: "Ingresos totales",
      value: money(summary?.gross_income, selectedCurrency),
      caption: `Portafolio en ${selectedCurrency}`,
      icon: CircleDollarSign,
      tone: "mint",
    },
    {
      label: "Tasa de ocupación",
      value: occupancy == null ? "—" : `${occupancy.toFixed(0)}%`,
      caption: "Promedio de propiedades",
      icon: Home,
      tone: "purple",
    },
    {
      label: "Ganancia neta",
      value: money(summary?.net_profit, selectedCurrency),
      caption: "Después de gastos",
      icon: TrendingUp,
      tone: "blue",
    },
    {
      label: "Propiedades activas",
      value: String(properties.filter((property) => property.is_active !== false).length),
      caption: "En tu portafolio",
      icon: Building2,
      tone: "orange",
    },
  ];

  return (
    <ProtectedRoute>
      <div className={styles.dashboard}>
        <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.brand}>
            <div className={styles.brandMark}><Sparkles aria-hidden="true" /></div>
            <span>Nomora</span>
            <button className={styles.mobileClose} onClick={() => setMobileNavOpen(false)} aria-label="Cerrar menú">
              <X />
            </button>
          </div>

          <nav className={styles.navigation} aria-label="Navegación principal">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href} className={href === "/" ? styles.activeLink : styles.navLink} onClick={() => setMobileNavOpen(false)}>
                <Icon aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <Link href="/settings" className={styles.navLink}><Settings aria-hidden="true" /> Ajustes</Link>
            <button onClick={() => void logout()} className={styles.profile} aria-label="Cerrar sesión">
              <span>{firstName.slice(0, 1).toUpperCase()}</span>
              <div><strong>{user?.full_name || "Tu cuenta"}</strong><small>{user?.email || "Sesión activa"}</small></div>
              <ChevronDown aria-hidden="true" />
            </button>
          </div>
        </aside>

        {mobileNavOpen && <button className={styles.backdrop} onClick={() => setMobileNavOpen(false)} aria-label="Cerrar menú" />}

        <main className={styles.main}>
          <header className={styles.topbar}>
            <button className={styles.menuButton} onClick={() => setMobileNavOpen(true)} aria-label="Abrir menú"><Menu /></button>
            <div className={styles.desktopSpacer} />
            <div className={styles.actions}>
              <div className={`${styles.searchBox} ${searchOpen ? styles.searchBoxOpen : ""}`}>
                <Search aria-hidden="true" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar propiedades" aria-label="Buscar propiedades" />
                <button onClick={() => setSearchOpen((open) => !open)} aria-label="Mostrar búsqueda"><Search /></button>
              </div>
              <button className={styles.iconButton} aria-label="Notificaciones"><Bell /></button>
              <div className={styles.dateBadge}><CalendarDays aria-hidden="true" /><span>Vista general</span></div>
            </div>
          </header>

          <section className={styles.content}>
            <div className={styles.welcomeRow}>
              <div>
                <p className={styles.eyebrow}>Panel de control</p>
                <h1>Hola, {firstName}<span> 👋</span></h1>
                <p className={styles.subtitle}>Aquí tienes una mirada rápida al rendimiento de tu negocio.</p>
              </div>
              <Link href="/properties" className={styles.primaryButton}><Plus aria-hidden="true" /> Nueva propiedad</Link>
            </div>

            <div className={styles.metricsGrid}>
              {metricCards.map(({ label, value, caption, icon: Icon, tone }) => (
                <article key={label} className={styles.metricCard}>
                  <div className={`${styles.metricIcon} ${styles[tone]}`}><Icon aria-hidden="true" /></div>
                  <p>{label}</p>
                  <strong>{isLoading ? "…" : value}</strong>
                  <small>{caption}</small>
                </article>
              ))}
            </div>

            {propertySummaries.length > 0 && <div className={styles.portfolioNote}>
              <span>{propertySummaries.length} propiedades analizadas</span>
              <span>{summary?.reservation_count ?? 0} reservas del período</span>
              <span>{summary?.expense_count ?? 0} gastos registrados</span>
            </div>}

            <div className={styles.analyticsGrid}>
              <section className={styles.cardPanel}>
                <div className={styles.panelHeading}>
                  <div><h2>Rendimiento financiero</h2><p>Ingresos y gastos de tu portafolio</p></div>
                  <select value={range} onChange={(event) => setRange(event.target.value as PerformanceRange)} aria-label="Periodo de rendimiento">
                    {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className={styles.chartLegend}><span><i className={styles.legendIncome} />Ingresos</span><span><i className={styles.legendExpense} />Gastos</span></div>
                <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartValues} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="nomora-income-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#6d45ec" stopOpacity={0.25} /><stop offset="95%" stopColor="#6d45ec" stopOpacity={0} /></linearGradient>
                        <linearGradient id="nomora-expense-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#f7a95a" stopOpacity={0.15} /><stop offset="95%" stopColor="#f7a95a" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#eef0f5" strokeDasharray="3 4" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#8d91a1", fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#8d91a1", fontSize: 11 }} width={42} tickFormatter={(value) => value === 0 ? "0" : `${Math.round(value / 1000)}k`} />
                      <Tooltip formatter={(value) => money(Number(value ?? 0), selectedCurrency)} labelStyle={{ color: "#252532" }} contentStyle={{ border: "1px solid #ebedf3", borderRadius: 12, boxShadow: "0 12px 28px rgba(32, 33, 52, .12)" }} />
                      <Area type="monotone" dataKey="Ingresos" stroke="#6d45ec" strokeWidth={2.5} fill="url(#nomora-income-fill)" />
                      <Area type="monotone" dataKey="Gastos" stroke="#f7a95a" strokeWidth={2} fill="url(#nomora-expense-fill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className={`${styles.cardPanel} ${styles.quickPanel}`}>
                <div className={styles.panelHeading}><div><h2>Acciones rápidas</h2><p>Gestiona tu operación diaria</p></div></div>
                <div className={styles.quickActions}>
                  <Link href="/income"><span className={styles.quickIcon}><CircleDollarSign /></span><div><strong>Registrar ingreso</strong><small>Actualiza tus cobros</small></div><Plus /></Link>
                  <Link href="/expenses"><span className={`${styles.quickIcon} ${styles.quickOrange}`}><CreditCard /></span><div><strong>Agregar gasto</strong><small>Mantén tus cuentas al día</small></div><Plus /></Link>
                  <Link href="/reports"><span className={`${styles.quickIcon} ${styles.quickBlue}`}><BarChart3 /></span><div><strong>Ver reportes</strong><small>Explora tendencias</small></div><ChevronDown /></Link>
                </div>
                <div className={styles.tip}><Sparkles aria-hidden="true" /><p><strong>Consejo inteligente</strong> Registra tus movimientos con frecuencia para obtener análisis más útiles.</p></div>
              </section>
            </div>

            <section className={styles.propertiesSection}>
              <div className={styles.sectionHeading}><div><h2>Tus propiedades</h2><p>Accede a los detalles de cada activo</p></div><Link href="/properties">Ver todas <ChevronDown aria-hidden="true" /></Link></div>
              {visibleProperties.length > 0 ? (
                <div className={styles.propertiesGrid}>{visibleProperties.map((property, index) => <PropertyCard key={property.id} property={property} index={index} />)}</div>
              ) : (
                <div className={styles.emptyProperties}><div><Building2 /><Star /></div><h3>{query ? "No encontramos esa propiedad" : "Tu portafolio empieza aquí"}</h3><p>{query ? "Prueba con otro nombre o ubicación." : "Añade tu primera propiedad para empezar a seguir tus ingresos y gastos."}</p>{!query && <Link href="/properties" className={styles.secondaryButton}><Plus /> Añadir propiedad</Link>}</div>
              )}
            </section>

            <footer className={styles.footer}><span><Clock3 aria-hidden="true" /> Datos actualizados al cargar esta vista</span><span>Nomora · Gestión inmobiliaria inteligente</span></footer>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
