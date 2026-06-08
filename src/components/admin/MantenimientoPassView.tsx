// src/components/admin/MantenimientoPassView.tsx
"use client"

import React, { useState, useEffect } from "react"
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
import { ArrowUpDown, MoreHorizontal, Key, ShieldAlert, RefreshCw, ClipboardCopy, CheckCircle, Trash2 } from "lucide-react"
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

// Interface estricta mapeada con la tabla token_recuperacion
interface SolicitudRecuperacion {
  id_token: number
  id_usuario: number
  fecha_creacion: string
  fecha_expiracion: string
  usuario_nombres: string
  usuario_correo: string
  usuario_dni: string
  id_rol: number
}

interface ApiResponse<T> {
  status: string
  data?: T
  error?: string
}

export default function MantenimientoPassView(): React.JSX.Element {
  const [data, setData] = useState<SolicitudRecuperacion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  // Estados de control para TanStack Table
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Variables del Entorno
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  // Estados para el Modal de éxito de Credencial Temporal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [generatedPassword, setGeneratedPassword] = useState<string>("")
  const [targetUser, setTargetUser] = useState<string>("")

  // Descargar la cola activa de solicitudes de soporte desde Express
  const loadSolicitudes = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.get<ApiResponse<SolicitudRecuperacion[]>>(`${API_URL}/api/admin/recuperaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === "OK" && res.data.data) {
        setData(res.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al conectar con la cola de credenciales.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSolicitudes()
  }, [])

  // Acción 1: Disparar la generación asíncrona de clave temporal
  const handleGenerarClave = async (solicitud: SolicitudRecuperacion) => {
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.post(`${API_URL}/api/admin/recuperaciones/generar/${solicitud.id_token}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.data.status === "OK" && res.data.clave_temporal) {
        setGeneratedPassword(res.data.clave_temporal)
        setTargetUser(solicitud.usuario_nombres)
        setIsModalOpen(true) // Despliega la credencial en pantalla para el Admin
        loadSolicitudes() // Limpia la grilla
      }
    } catch (err: any) {
      alert("No se pudo procesar la solicitud de reseteo.")
    }
  }

  // Acción 2: Anulación manual por flujo de comunicación humana
  const handleAnularSolicitud = async (id_token: number) => {
    if (!window.confirm("¿El usuario canceló la solicitud? Se archivará la alerta sin modificar sus accesos.")) return
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.post(`${API_URL}/api/admin/recuperaciones/anular/${id_token}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === "OK") loadSolicitudes()
    } catch (err: any) {
      alert("Error al anular la solicitud.")
    }
  }

  // ========================================================
  // CONFIGURACIÓN DE COLUMNAS DE TANSTACK TABLE
  // ========================================================
  const columns: ColumnDef<SolicitudRecuperacion>[] = [
    {
      accessorKey: "usuario_dni",
      header: "DNI Operador",
      cell: ({ row }) => <span className="font-mono text-xs font-bold text-slate-700">{row.getValue("usuario_dni")}</span>,
    },
    {
      accessorKey: "usuario_nombres",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent text-[#1E3A8A] font-bold">
          Usuario Solicitante
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col">
            <span className="font-black text-slate-800 text-sm">{item.usuario_nombres}</span>
            <span className="text-[11px] text-slate-400 font-medium">{item.usuario_correo}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "id_rol",
      header: "Rol de Canal",
      cell: ({ row }) => {
        const rolId = row.getValue("id_rol") as number
        let etiqueta = "Móvil - Cobro"
        let style = "bg-indigo-50 text-indigo-700 border-indigo-200"
        
        if (rolId === 1) { etiqueta = "Web - Admin"; style = "bg-emerald-50 text-emerald-700 border-emerald-200" }
        else if (rolId === 2) { etiqueta = "Web - Gerente"; style = "bg-amber-50 text-amber-700 border-amber-200" }
        else if (rolId === 3) { etiqueta = "Web - Socio"; style = "bg-blue-50 text-blue-700 border-blue-200" }
        else if (rolId === 5) { etiqueta = "Móvil - Fiscal"; style = "bg-purple-50 text-purple-700 border-purple-200" }

        return <Badge className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${style}`}>{etiqueta.toUpperCase()}</Badge>
      }
    },
    {
      accessorKey: "fecha_creacion",
      header: "Fecha Solicitud",
      cell: ({ row }) => {
        const fecha = new Date(row.getValue("fecha_creacion"))
        return <span className="text-xs text-slate-500 font-semibold">{fecha.toLocaleString('es-PE')}</span>
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones de Soporte</div>,
      cell: ({ row }) => {
        const sol = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-xl bg-white w-48">
                <DropdownMenuLabel>Mantenimiento PIN</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Genera la clave temporal de forma síncrona en BD */}
                <DropdownMenuItem onClick={() => handleGenerarClave(sol)} className="text-[#1E3A8A] font-bold flex items-center gap-2 cursor-pointer">
                  <Key className="w-3.5 h-3.5" /> Generar Clave Temporal
                </DropdownMenuItem>
                {/* Anula la solicitud sin cambiar nada (Factor Persona) */}
                <DropdownMenuItem onClick={() => handleAnularSolicitud(sol.id_token)} className="text-red-600 font-medium flex items-center gap-2 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Anular Solicitud
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
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2">
            <Key className="w-6 h-6 text-[#1E3A8A]" /> Soporte de Accesos y Credenciales
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Consola técnica (CUS-05) para la aprobación de restablecimientos y auditoría de tokens de recuperación.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={loadSolicitudes} disabled={loading} className="rounded-xl border-slate-200">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && <div className="p-3.5 bg-red-50 text-[#C5221F] text-xs font-bold rounded-xl border-l-4 border-[#C5221F]">{error}</div>}

      {/* INPUT FILTRADO DINÁMICO POR NOMBRE */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-xl">
        <CardContent className="pt-4 pb-4">
          <Input
            placeholder="Filtrar cola de soporte por apellidos y nombres..."
            value={(table.getColumn("usuario_nombres")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("usuario_nombres")?.setFilterValue(e.target.value)}
            className="max-w-sm rounded-xl border-slate-200 focus-visible:ring-[#1E3A8A]"
          />
        </CardContent>
      </Card>

      {/* TABLA MAESTRA DE TOKEN_RECUPERACION */}
      <Card className="border-none shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-100">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-6 py-4">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-semibold text-slate-400 animate-pulse">
                    Escaneando cola activa de solicitudes en Neon DB...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-bold text-slate-400/80">
                    Consola Limpia: No existen solicitudes de restablecimiento pendientes en la ruta.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* PAGINACIÓN */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-xl">Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-xl">Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================
          🎛️ MODAL DE VISUALIZACIÓN: PRESENTA LA CLAVE AL ADMIN
         ======================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm border-none p-6 bg-white shadow-2xl text-center">
          <DialogHeader className="items-center text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
            <DialogTitle className="text-xl font-black text-[#1E3A8A] pt-2">
              Llave Temporal Generada
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400 leading-normal max-w-[240px]">
              Copie el token alfanumérico y remítaselo a <strong>{targetUser}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Bloque Destacado de Figma para el Token en Claro */}
          <div className="my-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
            <span className="font-mono text-xl font-black tracking-widest text-slate-800 selection:bg-slate-200">
              {generatedPassword}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="rounded-xl size-9 shrink-0 text-[#1E3A8A] border-slate-200"
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword)
                alert("Copiado al portapapeles institucional de forma segura.")
              }}
            >
              <ClipboardCopy className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl text-left border border-amber-100 text-[10px] text-amber-800 font-medium leading-relaxed flex items-start gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>💡 Al iniciar sesión, el sistema forzará de forma mandatoria al operador a sobreescribir este PIN provisional por una contraseña privada definitiva.</p>
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={() => setIsModalOpen(false)} className="w-full bg-[#1E3A8A] hover:bg-[#2c4ea3] font-bold rounded-xl py-2.5">
              ENTENDIDO Y CERRAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}