// src/components/admin/AdminDashboard.tsx
import React, { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconUsers, IconBus, IconReceipt, IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

// Interfaces de tipado estricto para las métricas de Neon DB
interface DashboardStats {
  total_usuarios: number
  total_buses: number
  total_tarifas: number
}

interface ApiResponse {
  status: string
  data: DashboardStats
  message?: string
}

export default function AdminDashboard(): React.JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  // Función encargada de consumir de forma segura el pool del backend
  const fetchDashboardStats = async () => {
    setLoading(true)
    setError("")
    
    try {
      const token = localStorage.getItem("svdrayf_token")
      
      const res = await axios.get<ApiResponse>(`${API_URL}/api/admin/dashboard-stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.data.status === "OK") {
        setStats(res.data.data)
      } else {
        setError(res.data.message || "No se pudieron procesar los contadores del sistema.")
      }
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.message || 
        "Fallo de comunicación: Verifique que el servicio Express y Neon DB estén activos."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A]">
            Resumen General del Sistema
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Consola analítica e indicadores básicos de control técnico de la plataforma.
          </p>
        </div>
        
        {/* Botón para forzar re-sincronización síncrona */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardStats}
          disabled={loading}
          className="rounded-xl font-bold text-xs gap-2 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <IconRefresh className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Sincronizar Panel
        </Button>
      </div>

      {/* Manejo Elegante de Mensajes de Error de API */}
      {error && (
        <div className="p-3.5 bg-red-50 text-[#C5221F] text-xs font-bold rounded-xl border-l-4 border-[#C5221F] animate-in slide-in-from-top-2 duration-200">
          ⚠️ Error de persistencia: {error}
        </div>
      )}

      {/* Grid de Tarjetas KPI de la Plantilla */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* KPI 1: Personal Registrado (Mapea tabla 'usuario') */}
        <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Personal Registrado
            </CardTitle>
            <IconUsers className="h-5 w-5 text-[#1E3A8A]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 bg-slate-200 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                {stats?.total_usuarios ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Cobradores, Choferes e Inspectores</p>
          </CardContent>
        </Card>

        {/* KPI 2: Unidades de Flota (Mapea tabla 'bus') */}
        <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Unidades de Flota
            </CardTitle>
            <IconBus className="h-5 w-5 text-[#1E3A8A]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 bg-slate-200 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                {stats?.total_buses ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Buses autorizados Mala - Lima</p>
          </CardContent>
        </Card>

        {/* KPI 3: Tarifas Vigentes (Mapea tabla 'tarifario') */}
        <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tarifas Vigentes
            </CardTitle>
            <IconReceipt className="h-5 w-5 text-[#1E3A8A]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 bg-slate-200 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                {stats?.total_tarifas ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Tramos estáticos indexados</p>
          </CardContent>
        </Card>

      </div>

      {/* Alerta Perimetral Informativa */}
      <div className="p-4 bg-blue-50/50 text-[#1E3A8A] text-xs font-semibold rounded-2xl border border-blue-100">
        💡 Administrador, todos los módulos de asignación de roles, auditoría de unidades y carga de matrices SQL se encuentran sincronizados en tiempo real con el clúster transaccional.
      </div>

    </div>
  )
}