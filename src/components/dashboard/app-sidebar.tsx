"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/dashboard/nav-documents"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavSecondary } from "@/components/dashboard/nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Interface estricta para el tipado seguro del payload de sesión (RBAC)
interface SessionUser {
  id_usuario: number
  dni: string
  nombres: string
  correo: string
  id_rol: number // 1: Admin, 2: Gerente, 3: Socio
  requiere_cambio: boolean
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: SessionUser
  activeView: string
  setActiveView: (view: string) => void
}

export function AppSidebar({ user, activeView, setActiveView, ...props }: AppSidebarProps) {
  
  // ========================================================
  // CONFIGURACIÓN DE MENÚS INDEPENDIENTES POR ROL
  // ========================================================

  //  CONFIGURACIÓN ACTOR 1: ADMINISTRADOR TÉCNICO
  const navMainAdmin = [
    { title: "Resumen Sistema", url: "admin-dash", icon: IconDashboard },
    { title: "Gestion y Registro de Personal", url: "permisos", icon: IconUsers },
    { title: "Maestro de Flota", url: "flota", icon: IconFolder },
    { title: "Matriz Tarifarios", url: "tarifas", icon: IconDatabase },
  ]
  const documentsAdmin = [
    { name: "Soporte Accesos", url: "mantenimiento-pass", icon: IconListDetails },
  ]

  // CONFIGURACIÓN ACTOR 2: GERENTE GENERAL
  const navMainGerente = [
    { title: "Dashboard Ejecutivo", url: "gerente-dash", icon: IconChartBar },

    { title: "Auditoría de Boletos", url: "auditoria", icon: IconFileAi },
     { title: "Balances Financieros", url: "consulta-global", icon: IconReport }
  ]
  const documentsGerente = [
    { name: "Configurar Ticket", url: "ticket-print", icon: IconSettings },
    { name: "Búsqueda Global", url: "buscador", icon: IconSearch },
  ]

  //  CONFIGURACIÓN ACTOR 3: SOCIO COPROPIETARIO
  const navMainSocio = [
    { title: "Mis Ingresos", url: "socio-dash", icon: IconChartBar },
    { title: "Mis Unidades", url: "mis-buses", icon: IconFolder },
  ]
  const documentsSocio = [
    { name: "Reportes Filtrados", url: "socio-reports", icon: IconFileWord },
  ]


  // ========================================================
  //  CONMUTADOR DINÁMICO DE CONTEXTOS (RBAC)
  // ========================================================
  let currentNavMain = navMainSocio
  let currentDocuments = documentsSocio
  let etiquetaEmpresa = "SVDRAYF Socio"

  if (user.id_rol === 1) {
    currentNavMain = navMainAdmin
    currentDocuments = documentsAdmin
    etiquetaEmpresa = "SVDRAYF Admin"
  } else if (user.id_rol === 2) {
    currentNavMain = navMainGerente
    currentDocuments = documentsGerente
    etiquetaEmpresa = "SVDRAYF Gerencia"
  }

  // Estructura adaptada para inyectar en los subcomponentes de Shadcn
  const userData = {
    name: user.nombres,
    email: user.correo,
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#" onClick={(e) => e.preventDefault()}>
                <IconInnerShadowTop className="size-5! text-[#1E3A8A]" />
                <span className="text-base font-black tracking-tight text-[#1E3A8A]">
                  {etiquetaEmpresa}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain 
          items={currentNavMain} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <NavDocuments 
          items={currentDocuments} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}