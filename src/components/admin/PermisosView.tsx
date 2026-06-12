// src/components/admin/PermisosView.tsx
"use client"

import React, { useEffect, useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Users, ShieldCheck, UserPlus, Mail, Fingerprint, RefreshCw } from "lucide-react"
import axios from "axios"

// Componentes Atómicos de Shadcn UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// ========================================================
// ENTIDADES Y TIPADOS ESTRICTOS (CUS-01 / Tabla: usuario)
// ========================================================
interface UsuarioUnidad {
  id_usuario: number
  dni: string
  nombres: string
  correo: string
  nombre_rol: string
  id_rol?: number
}

interface ApiResponse {
  status: string
  data?: UsuarioUnidad[]
  message?: string
  error?: string
}

export default function PermisosView(): React.JSX.Element {
  // Estado maestro conectado a Neon DB
  const [data, setData] = useState<UsuarioUnidad[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  // Estados de control para TanStack Table
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Variables de Entorno del Clúster Backend
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  // ========================================================
  // ESTADOS PARA EL FORMULARIO DE CONTROL DE IDENTIDADES
  // ========================================================
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  
  // Inputs correlacionados con el esquema relacional de PostgreSQL
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formDni, setFormDni] = useState<string>("")
  const [formNombres, setFormNombres] = useState<string>("")
  const [formCorreo, setFormCorreo] = useState<string>("")
  const [formPassword, setFormPassword] = useState<string>("")
  const [formIdRol, setFormIdRol] = useState<number>(5) // Por defecto Cobrador por volumen operativo

  // Función asíncrona para descargar el personal desde Express
  const fetchUsuarios = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.get<ApiResponse>(`${API_URL}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === "OK" && res.data.data) {
        setData(res.data.data)
      } else {
        setError("La base de datos rechazó la consulta de identidades.")
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Fallo transaccional al conectar con Neon DB.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  // Abrir modal en Modo Alta Completa (CUS-01)
  const handleOpenAddMode = () => {
    setModalMode('add')
    setSelectedId(null)
    setFormDni("")
    setFormNombres("")
    setFormCorreo("")
    setFormPassword("")
    setFormIdRol(4) // Reset a Cobrador por defecto
    setIsModalOpen(true)
  }

  // Abrir modal en Modo Corrección Tipográfica (Solo DNI y Nombres Mutables)
  const handleOpenEditMode = (user: UsuarioUnidad) => {
    setModalMode('edit')
    setSelectedId(user.id_usuario)
    setFormDni(user.dni)
    setFormNombres(user.nombres)
    setFormCorreo(user.correo) 
    setFormPassword("")
    setIsModalOpen(true)
  }

  // Procesador del Submit con persistencia hacia el Backend en Node.js
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 1. DEFINICIÓN DE REGLAS DE VALIDACIÓN (REGEX)
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const correoRegex = /^[^\s@]+@(mala\.com|svdrayf\.com)$/;

    // 2. VALIDACIÓN DE NOMBRE (Aplica a ambos modos: add y edit)
    if (!nombreRegex.test(formNombres.trim())) {
      alert("El nombre no es válido: solo se permiten letras y espacios.");
      return; // Detiene la ejecución si el nombre tiene números o caracteres extraños
    }

    // 3. VALIDACIÓN DE CORREO (Solo aplica en modo 'add')
    if (modalMode === 'add') {
      if (!correoRegex.test(formCorreo.trim().toLowerCase())) {
        alert("El correo debe pertenecer al dominio @mala.com o @svdrayf.com");
        return; // Detiene la ejecución si el correo es inválido
      }
    }
    setLoading(true)
    const token = localStorage.getItem("svdrayf_token")

    try {
      if (modalMode === 'add') {
        // Registro de usuario encriptando la contraseña internamente en el Backend
        const res = await axios.post(`${API_URL}/api/auth/register-test`, {
          dni: formDni.trim(),
          nombres: formNombres.trim(),
          correo: formCorreo.trim().toLowerCase(),
          password: formPassword,
          id_rol: formIdRol
        })
        if (res.data.status === "OK") {
          fetchUsuarios() 
          setIsModalOpen(false)
        }
      } else if (modalMode === 'edit' && selectedId !== null) {
        // Enmienda restringida de errores tipográficos para proteger la seguridad corporativa
        const res = await axios.put(`${API_URL}/api/admin/usuarios/${selectedId}`, {
          dni: formDni.trim(),
          nombres: formNombres.trim()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.status === "OK") {
          fetchUsuarios()
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Operación rechazada por la base de datos central.")
    } finally {
      setLoading(false)
    }
  }

  // ========================================================
  // CONFIGURACIÓN DE COLUMNAS DE TANSTACK TABLE
  // ========================================================
  const columns: ColumnDef<UsuarioUnidad>[] = [
    {
      accessorKey: "id_usuario",
      header: "UID",
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400">{row.getValue("id_usuario")}</span>,
    },
    {
      accessorKey: "dni",
      header: "DNI",
      cell: ({ row }) => <span className="font-mono font-bold text-slate-700">{row.getValue("dni")}</span>,
    },
    {
      accessorKey: "nombres",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent text-[#1E3A8A] font-bold">
          Personal de la Organización
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-black text-slate-800">{row.getValue("nombres")}</span>,
    },
    {
      accessorKey: "correo",
      header: "Identificador de Acceso",
      cell: ({ row }) => <span className="text-slate-500 font-medium text-xs">{row.getValue("correo")}</span>,
    },
    {
      accessorKey: "nombre_rol",
      header: "Perfil de Privilegios",
      cell: ({ row }) => {
        const rol = row.getValue("nombre_rol") as string
        
        // Asignación de colores corporativos estáticos según el rol relacional
        let badgeStyle = "bg-blue-50 text-blue-700 border-blue-200" // Socio
        if (rol === "Administrador") badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200"
        else if (rol === "Gerente") badgeStyle = "bg-amber-50 text-amber-700 border-amber-200"
        else if (rol === "Cobrador") badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200"
        else if (rol === "Fiscalizador" || rol === "Inspector") badgeStyle = "bg-purple-50 text-purple-700 border-purple-200"

        return (
          <Badge className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm border ${badgeStyle}`}>
            {rol.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-xl bg-white">
                <DropdownMenuLabel>Control Técnico</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.dni)}>
                  Copiar Documento DNI
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleOpenEditMode(user)} className="text-[#1E3A8A] font-medium">
                  Subsanar Tipeo (DNI/Nombre)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* SECCIÓN 1: CABECERA Y ACCIONES CRÍTICAS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1E3A8A]" /> Gestión y Registro de Usuarios
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Consola de control de identidades (CUS-01) para la matriculación de personal operativo y administrativo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchUsuarios} disabled={loading} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleOpenAddMode} className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white font-bold rounded-xl shadow-md transition-all">
            <UserPlus className="w-4 h-4 mr-2" /> REGISTRAR NUEVO USUARIO
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-[#C5221F] text-xs font-bold rounded-xl border-l-4 border-[#C5221F]">
          ⚠️ Alerta de Sincronización: {error}
        </div>
      )}

      {/* SECCIÓN 2: BUSCADOR DE TANSTACK TABLE */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-xl">
        <CardContent className="pt-4 pb-4">
          <Input
            placeholder="Filtrar base de datos por apellidos y nombres..."
            value={(table.getColumn("nombres")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("nombres")?.setFilterValue(e.target.value)}
            className="max-w-sm rounded-xl border-slate-200 focus-visible:ring-[#1E3A8A]"
          />
        </CardContent>
      </Card>

      {/* SECCIÓN 3: RENDERIZADO DE TABLA SHADCN */}
      <Card className="border-none shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-100">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-6 py-4">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-semibold text-slate-400 animate-pulse">
                    Extrayendo registros vigentes desde el pool de Neon DB...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-semibold text-slate-400">
                    Ningún operador cumple con los filtros ingresados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* COMPONENTE DE PAGINACIÓN */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-xl text-xs font-bold">
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-xl text-xs font-bold">
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================
          DIALOG MODAL DUAL CON TODOS LOS ROLES OPERATIVOS
         ======================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md border-none p-6 bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1E3A8A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              {modalMode === 'add' ? 'Alta de Personal Autorizado' : 'Corregir Datos del Registro'}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              {modalMode === 'add' 
                ? 'El identificador y clave ingresados permitirán el acceso inmediato al sistema web o aplicativo móvil.' 
                : 'Control de Consistencia: Solo se autoriza enmendar errores de digitación en las columnas DNI y Apellidos/Nombres.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            
            {/* Input DNI: Activo en ambos modos */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5" /> Documento Nacional de Identidad (DNI)
              </label>
              <Input 
                placeholder="Ej: 47219854" 
                maxLength={8}
                value={formDni} 
                onChange={(e) => setFormDni(e.target.value.replace(/\D/g, ""))} 
                required 
                className="rounded-xl border-slate-200 font-mono"
              />
            </div>

            {/* Input Nombres: Activo en ambos modos */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Apellidos y Nombres Completos</label>
              <Input 
                placeholder="Ej: Carlos Alberto Mendoza Vega" 
                value={formNombres} 
                onChange={(e) => setFormNombres(e.target.value)} 
                required 
                className="rounded-xl border-slate-200"
              />
            </div>

            {/* BLOQUE EXCLUSIVO PARA ALTA DE USUARIOS (MODO ADD) */}
            {modalMode === 'add' && (
              <>
                {/* Input Correo */}
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Correo Electrónico Corporativo
                  </label>
                  <Input 
                    type="email"
                    placeholder="operador@svdrayf.com" 
                    value={formCorreo} 
                    onChange={(e) => setFormCorreo(e.target.value)} 
                    required 
                    className="rounded-xl border-slate-200"
                  />
                </div>

                {/* Input Password */}
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Llave de Acceso Inicial</label>
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    value={formPassword} 
                    onChange={(e) => setFormPassword(e.target.value)} 
                    required 
                    className="rounded-xl border-slate-200"
                  />
                </div>

                {/* Selector con Todos los Roles de la Arquitectura SVDRAYF */}
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Asignar Perfil Corporativo</label>
                  <select 
                    value={formIdRol} 
                    onChange={(e) => setFormIdRol(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
                  >
                    <option value={1}>Administrador Técnico (Gestión Consola)</option>
                    <option value={2}>Gerente General (Métricas Ejecutivas)</option>
                    <option value={3}>Socio Copropietario (Balances de Flota)</option>
                    <option value={4}>Fiscalizador / Inspector (Aplicativo Móvil - Control Fraude)</option>
                    <option value={5}>Cobrador en Ruta (Aplicativo Móvil - Venta Pasajes)</option>
                    
                  </select>
                </div>
              </>
            )}

            {/* DETALLES DE AUDITORÍA EN EDICIÓN */}
            {modalMode === 'edit' && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-medium text-slate-500 space-y-1">
                <p><strong>Identificador Fijo:</strong> {formCorreo}</p>
                <p><strong>Aviso del Sistema:</strong> El correo corporativo y los privilegios funcionales han sido bloqueados en la interfaz de edición para asegurar la trazabilidad criptográfica y prevenir alteraciones indebidas.</p>
              </div>
            )}

            {/* Acciones de Guardado */}
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white font-bold rounded-xl px-5">
                {modalMode === 'add' ? 'EFECTUAR REGISTRO' : 'CONFIRMAR CAMBIOS'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}