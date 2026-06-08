// src/components/dashboard/SiteHeader.tsx
import React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

// 1. Declaramos la estructura estricta del usuario que viene de Neon DB
interface SessionUser {
  id_usuario: number
  dni: string
  nombres: string
  correo: string
  id_rol: number
}

// 2. Definimos la interfaz obligatoria de Props que causaba el error
interface SiteHeaderProps {
  user: SessionUser
  onLogout: () => void
}

export function SiteHeader({ user, onLogout }: SiteHeaderProps): React.JSX.Element {
  
  // Mapeador semántico para mostrar el rol actual en la barra superior
  let etiquetaRol = "Personal Autorizado"
  if (user.id_rol === 1) etiquetaRol = "Administrador del Sistema"
  else if (user.id_rol === 2) etiquetaRol = "Gerente General"
  else if (user.id_rol === 3) etiquetaRol = "Socio Copropietario"

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-6 select-none shadow-sm dark:bg-slate-900 dark:border-slate-800">
      
      {/* Sección Izquierda: Gatillo del Sidebar y Breadcrumbs */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-[#1E3A8A] hover:bg-slate-100" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-slate-200" />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Consola Operativa
          </span>
          <span className="text-sm font-black text-[#1E3A8A]">
            {etiquetaRol}
          </span>
        </div>
      </div>

      {/* Sección Derecha: Información de Cuenta y Botón Atómico de Cierre */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:flex flex-col">
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
            {user.nombres}
          </span>
          <span className="text-xs font-semibold text-[#D4AF37]">
            {user.correo}
          </span>
        </div>

        {/* Iniciales del Avatar Estilo Shadcn */}
        <div className="w-9 h-9 bg-[#1E3A8A] text-white flex items-center justify-center rounded-full font-black text-xs border-2 border-[#D4AF37]">
          {user.nombres.substring(0, 2).toUpperCase()}
        </div>

        <Separator orientation="vertical" className="h-5 bg-slate-200" />

        {/* Botón de Cierre de Sesión Seguro */}
        <Button 
          variant="outline" 
          onClick={onLogout}
          className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 rounded-xl px-3 py-1.5 transition-all"
        >
          SALIR
        </Button>
      </div>

    </header>
  )
}