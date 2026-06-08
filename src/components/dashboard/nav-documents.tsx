// src/components/dashboard/nav-documents.tsx
"use client"

import React from "react"
import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  type Icon,
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Interface adaptada para heredar la navegación por roles
interface NavDocumentsProps {
  items: {
    name: string
    url: string
    icon: Icon
  }[]
  activeView: string
  setActiveView: (view: string) => void
}

export function NavDocuments({ items, activeView, setActiveView }: NavDocumentsProps) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
        Operaciones Especiales
      </SidebarGroupLabel>
      <SidebarMenu className="mt-1">
        {items.map((item) => {
          const isSelected = activeView === item.url
          
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild
                className={`rounded-xl transition-all duration-150 ${
                  isSelected 
                    ? "bg-slate-100 font-bold text-[#1E3A8A]" 
                    : "text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-50/80"
                }`}
              >
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault() // Cancela el comportamiento de salto web
                    setActiveView(item.url) // Enruta asíncronamente
                  }}
                >
                  <item.icon className={`size-4 shrink-0 ${isSelected ? "text-[#1E3A8A]" : "text-slate-400"}`} />
                  <span className="text-sm font-medium">{item.name}</span>
                </a>
              </SidebarMenuButton>

              {/* Menú Contextual de Auditoría Operativa */}
              
            </SidebarMenuItem>
          )
        })}

        {/* Botón de Cierre de Fila */}
        
      </SidebarMenu>
    </SidebarGroup>
  )
}