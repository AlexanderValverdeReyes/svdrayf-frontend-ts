// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { TooltipProvider } from "@radix-ui/react-tooltip";


// Componentes Estructurales de la Plantilla de Shadcn UI
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SiteHeader } from "@/components/dashboard/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

//  IMPORTACIÓN CRÍTICA: Ladrillo de contexto de Shadcn UI para silenciar el Uncaught Error

//  CAPA DE VISTAS - ACTOR 1: ADMINISTRADOR TÉCNICO
import AdminDashboard from "@/components/admin/AdminDashboard"
import PermisosView from "@/components/admin/PermisosView"
import FlotaView from "@/components/admin/FlotaView"
import TarifariosView from "@/components/admin/TarifariosView"

//  CAPA DE VISTAS - ACTOR 2: GERENTE GENERAL
import GerenteDashboard from "@/components/gerente/GerenteDashboard" 
import BusquedaGlobal from "@/components/gerente/BusquedaGlobal";
import AuditoriaView from "@/components/gerente/AuditoriaView"
import TicketConfigView from "@/components/gerente/TicketConfigView"
import ConsultaGlobal from "@/components/gerente/ConsultaGlobal"


//  CAPA DE VISTAS - ACTOR 3: SOCIO COPROPIETARIO
import SocioDashboard from "@/components/Socio/SocioDashboard"
import UnidadesView from "@/components/Socio/UnidadesView"
import SocioReportes from "@/components/Socio/SocioReportes"
import MantenimientoPassView from "@/components/admin/MantenimientoPassView";

interface SessionUser {
  id_usuario: number
  dni: string
  nombres: string
  correo: string
  id_rol: number 
  requiere_cambio: boolean
}

export default function DashboardPage(): React.JSX.Element | null {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeView, setActiveView] = useState<string>(
  () => localStorage.getItem("svdrayf_activeView") || "dashboard"
);

  useEffect(() => {
    const token = localStorage.getItem("svdrayf_token")
    const rawUser = localStorage.getItem("svdrayf_user")

    if (!token || !rawUser) {
      localStorage.clear()
      navigate("/")
      return
    }

    try {
      const parsedUser = JSON.parse(rawUser) as SessionUser
      setSession(parsedUser)
      
      // Solo asigna vista por defecto si no hay nada almacenado
      const vistaGuardada = localStorage.getItem("svdrayf_activeView")
      if (!vistaGuardada) {
        if (parsedUser.id_rol === 1) setActiveView("admin-dash")
        else if (parsedUser.id_rol === 2) setActiveView("gerente-dash")
        else if (parsedUser.id_rol === 3) setActiveView("socio-dash")
      }
    } catch (error) {
      localStorage.clear()
      navigate("/")
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const handleLogout = (): void => {
    localStorage.removeItem("svdrayf_activeView");
    localStorage.clear()
    navigate("/")
  }
const changeView = (view: string) => {
    setActiveView(view);
    localStorage.setItem("svdrayf_activeView", view);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-sm font-bold text-[#1E3A8A] animate-pulse">
          Validando firmas digitales con Neon DB...
        </p>
      </div>
    )
  }

  if (!session) return null

  return (
    //  ENVOLTORIO GLOBAL MÁGICO: Provee el contexto requerido por Radix UI para habilitar los tooltips
    <TooltipProvider delayDuration={0}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar 
          user={session} 
          activeView={activeView} 
          setActiveView={changeView} 
        />
        
        <SidebarInset>
          <SiteHeader user={session} onLogout={handleLogout} />
          
          <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-var(--header-height))] overflow-y-auto p-6">
            <div className="@container/main flex flex-1 flex-col gap-2">
              
              {activeView === "admin-dash" && <AdminDashboard />}
              {activeView === "permisos" && <PermisosView />}
              {activeView === "flota" && <FlotaView />}
              {activeView === "tarifas" && <TarifariosView />}
              {activeView === "mantenimiento-pass" && <MantenimientoPassView />}
              
            {activeView === "gerente-dash" && <GerenteDashboard setActiveView={changeView} />}
              {activeView === "BusquedaGlobal" && <BusquedaGlobal />}
              {activeView === "auditoria" && <AuditoriaView />}
              {activeView === "ticket-print" && <TicketConfigView />}
            {activeView === "buscador" && <BusquedaGlobal />}
              {activeView === "consulta-global" && <ConsultaGlobal />}

              {activeView === "socio-dash" && <SocioDashboard setActiveView={changeView} />}
              {activeView === "mis-buses" && <UnidadesView />}
              {activeView === "socio-reports" && <SocioReportes />}

            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}