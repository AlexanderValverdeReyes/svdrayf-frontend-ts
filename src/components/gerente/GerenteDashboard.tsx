// src/components/gerente/GerenteDashboard.tsx
"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  IconTrendingUp, 
  IconBus, 
  IconAlertTriangle, 
  IconRoute, 
  IconChartBar, 
  IconRefresh, 
  IconArrowRight, 
  IconReceipt2,
  IconUsers
} from "@tabler/icons-react"

// Interfaces estrictas para el tipado seguro de la API gerencial
interface ExecutiveData {
  kpis_hoy: {
    ingresos_hoy_soles: number
    boletos_hoy: number
    buses_en_ruta: number
    alertas_mantenimiento: number
  }
  grafico_rutas: {
    ruta: string
    total_soles: number
  }[]
  kpis_historicos: {
    total_recaudado_historico_soles: number
    total_boletos_vendidos: number
    ruta_lider_nombre: string
    ruta_lider_rendimiento: number
  }
}

interface Props {
  setActiveView?: (view: string) => void // Recibe la función del enrutador de DashboardPage.tsx
}

export default function GerenteDashboard({ setActiveView }: Props): React.JSX.Element {
  const [metrics, setMetrics] = useState<ExecutiveData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  const loadGerenteDashboard = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.get<{ status: string; data: ExecutiveData }>(
        `${API_URL}/api/admin/dashboard-exec`, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.status === "OK") {
        setMetrics(res.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al sincronizar indicadores ejecutivos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGerenteDashboard()
  }, [])

  // Buscar el valor máximo de ingresos por ruta para ponderar el ancho relativo de las barras CSS
  const maxRendimiento = metrics?.grafico_rutas.reduce((max, item) => {
  const val = Number(item.total_soles);
  return val > max ? val : max;
}, 0) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 px-4 lg:px-6 py-2">
      
      {/* SECCIÓN 1: CABECERA CORPORATIVA Y ACCIÓN DE CONTROL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A]">
            Dashboard Ejecutivo de Gerencia
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Monitoreo en tiempo real de recaudación perimetral, auditoría de fraude y rendimiento de rutas Mala - Lima.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadGerenteDashboard}
          disabled={loading}
          className="rounded-xl font-bold text-xs gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0 self-start sm:self-center"
        >
          <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refrescar Datos
        </Button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-[#C5221F] text-xs font-bold rounded-xl border-l-4 border-[#C5221F]">
          ⚠️ Alerta Transaccional: {error}
        </div>
      )}

      {/* SECCIÓN 2: TARJETAS KPI EN TIEMPO REAL (HOY) */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* KPI HOY 1: Ingresos de hoy */}
        <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recaudación de Hoy
            </CardTitle>
            <div className="p-1.5 bg-emerald-50 rounded-xl text-emerald-600">
              <IconTrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                S/. {(metrics?.kpis_hoy.ingresos_hoy_soles ?? 0).toFixed(2)}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Pasajes validados en la jornada actual</p>
          </CardContent>
        </Card>

        {/* KPI HOY 2: Unidades en Ruta */}
        <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Flota en Ruta
            </CardTitle>
            <div className="p-1.5 bg-blue-50 rounded-xl text-[#1E3A8A]">
              <IconBus className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                {metrics?.kpis_hoy.buses_en_ruta ?? 0} <span className="text-sm font-medium text-slate-400">Buses</span>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Turnos abiertos de viaje en paralelo</p>
          </CardContent>
        </Card>

        {/* KPI HOY 3: Alertas de Auditoría */}
        <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Alertas de Auditoría
            </CardTitle>
            <div className={`p-1.5 rounded-xl ${(metrics?.kpis_hoy.alertas_mantenimiento ?? 0) > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <IconAlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                {metrics?.kpis_hoy.alertas_mantenimiento ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Boletos anulados o sospechas de fraude QR</p>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 3: GRÁFICO DE BARRAS DE INGRESOS POR RUTA DE SHADCN COMPILADO EN CSS */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* El Gráfico de Barras semántico toma 2 columnas */}
        <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-slate-900 md:col-span-2">
          <CardHeader className="flex flex-col gap-1 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-2 text-[#1E3A8A]">
              <IconChartBar className="h-5 w-5" />
              <CardTitle className="text-base font-black">Rendimiento Financiero por Ruta</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">Distribución agregada de ingresos totales (S/.) por cada tramo registrado en Neon DB.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {loading ? (
              <div className="space-y-3 pt-2">
                <div className="h-8 bg-slate-100 animate-pulse rounded-xl" />
                <div className="h-8 bg-slate-100 animate-pulse rounded-xl" />
                <div className="h-8 bg-slate-100 animate-pulse rounded-xl" />
              </div>
            ) : metrics?.grafico_rutas.length === 0 ? (
                <div className="text-center text-sm font-semibold text-slate-400 py-6">No existen registros de boletaje para ponderar la gráfica.</div>
            ) : (
              metrics?.grafico_rutas.map((item, idx) => {
  const totalSoles = Number(item.total_soles);          // Conversión de string a número
  const porcentaje = (totalSoles / maxRendimiento) * 100;
  return (
    <div key={idx} className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
        <span className="flex items-center gap-1"><IconRoute className="h-3.5 w-3.5 text-slate-400" /> {item.ruta}</span>
        <span className="font-mono text-[#1E3A8A]">S/. {totalSoles.toFixed(2)}</span>
      </div>
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-[#1E3A8A] h-full rounded-full transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
})
            )}
          </CardContent>
        </Card>

        {/* CONTENEDOR LATERAL: ACCESO INMEDIATO A FILTROS AVANZADOS */}
        <Card className="border-none shadow-md rounded-2xl bg-gradient-to-b from-[#1E3A8A] to-[#142862] text-white p-2 flex flex-col justify-between">
          <CardHeader className="pt-4 px-4 pb-2">
            <Badge className="bg-white/10 hover:bg-white/10 text-[#D4AF37] font-black border-none w-fit rounded-full text-[10px]">CUS-07 AUDITORÍA</Badge>
            <CardTitle className="text-lg font-black tracking-tight pt-2 leading-tight">Filtros Avanzados y Consolidación</CardTitle>
            <CardDescription className="text-blue-200 text-xs pt-1 leading-relaxed">
              Acceda a la suite analítica completa para desglosar la recaudación por cobrador, filtrar por rangos de fechas o exportar balances en PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4 pt-0 mt-auto w-full">
            <Button
              onClick={() => {
  if (setActiveView) setActiveView("consulta-global");
}}
              className="w-full bg-white hover:bg-slate-50 text-[#1E3A8A] font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 py-5"
            >
              VER DETALLES DE BALANCE
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* SECCIÓN 4: INDICADORES KPI HISTÓRICOS GLOBALES */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-[#1E3A8A] mb-3">Métricas Acumuladas del Sistema (Histórico Global)</h3>
        <div className="grid gap-4 md:grid-cols-3">
          
          {/* KPI Histórico 1 */}
          <Card className="border-none shadow-sm rounded-2xl bg-slate-50/50 border border-slate-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-white text-emerald-600 rounded-xl border border-slate-100 shadow-xs"><IconReceipt2 className="h-5 w-5"/></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Histórico Recaudado</span>
                <span className="text-lg font-black text-slate-800 font-mono">S/. {(metrics?.kpis_historicos.total_recaudado_historico_soles ?? 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI Histórico 2 */}
          <Card className="border-none shadow-sm rounded-2xl bg-slate-50/50 border border-slate-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-white text-blue-600 rounded-xl border border-slate-100 shadow-xs"><IconUsers className="h-5 w-5"/></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pasajeros Registrados</span>
                <span className="text-lg font-black text-slate-800">{metrics?.kpis_historicos.total_boletos_vendidos ?? 0} <span className="text-xs text-slate-400 font-medium">boletos</span></span>
              </div>
            </CardContent>
          </Card>

          {/* KPI Histórico 3 */}
          <Card className="border-none shadow-sm rounded-2xl bg-slate-50/50 border border-slate-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-white text-amber-500 rounded-xl border border-slate-100 shadow-xs"><IconRoute className="h-5 w-5"/></div>
              <div className="flex flex-col max-w-[180px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ruta Más Rentable</span>
                <span className="text-sm font-black text-slate-800 truncate" title={metrics?.kpis_historicos.ruta_lider_nombre}>{metrics?.kpis_historicos.ruta_lider_nombre}</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

    </div>
  )
}