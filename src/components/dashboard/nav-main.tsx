// src/components/dashboard/nav-main.tsx
"use client"

import React from "react"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Interface ampliada para capturar el estado reactivo del semáforo de vistas
interface NavMainProps {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
  activeView: string
  setActiveView: (view: string) => void
}

export function NavMain({ items, activeView, setActiveView }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        
        {/* Acciones Rápidas del Sistema */}
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Listado Dinámico de Módulos Autorizados */}
        <SidebarMenu>
          {items.map((item) => {
            const isSelected = activeView === item.url
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title}
                  onClick={(e) => {
                    e.preventDefault() // Detiene la recarga de página o el hash '#'
                    setActiveView(item.url) // Altera el estado maestro en caliente
                  }}
                  className={`rounded-xl transition-all duration-150 ${
                    isSelected 
                      ? "bg-slate-100 font-bold text-[#1E3A8A]" 
                      : "text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-50/80"
                  }`}
                >
                  {item.icon && (
                    <item.icon className={`size-4 shrink-0 ${isSelected ? "text-[#1E3A8A]" : "text-slate-400"}`} />
                  )}
                  <span className="text-sm font-medium">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>

      </SidebarGroupContent>
    </SidebarGroup>
  )
}