// src/components/admin/FlotaView.tsx
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
import { ArrowUpDown, MoreHorizontal, Bus, Shield, Wifi, WifiOff, RefreshCw, UserCheck } from "lucide-react"
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
// ENTIDADES Y TIPADOS ESTRICTOS CORRELACIONADOS CON BD
// ========================================================
interface BusUnidad {
  id_bus: number
  placa: string
  numero_padron: string
  marca: string
  modelo: string
  anio_modelo: number
  chasis_numero: string
  kilometraje_inicial: number
  tipo_combustible: string
  capacidad_pasajeros: number
  id_socio: number | null
  socio_nombres?: string // Inyectado mediante el JOIN del Backend
  estado: boolean
}

interface SocioOption {
  id_usuario: number
  nombres: string
  dni: string
}

interface ApiResponse<T> {
  status: string
  data?: T
  message?: string
  error?: string
}

export default function FlotaView(): React.JSX.Element {
  // Estados de datos vivos de Neon DB
  const [data, setData] = useState<BusUnidad[]>([])
  const [socios, setSocios] = useState<SocioOption[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  // Estados de control para TanStack Table
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Variables del Entorno
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  // ========================================================
  // ESTADOS FORMULARIO INTEGRAL (CAMPOS OBLIGATORIOS POSTGRES)
  // ========================================================
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formPlaca, setFormPlaca] = useState<string>("")
  const [formPadron, setFormPadron] = useState<string>("")
  const [formMarca, setFormMarca] = useState<string>("")
  const [formModelo, setFormModelo] = useState<string>("")
  const [formAnio, setFormAnio] = useState<number>(new Date().getFullYear())
  const [formChasis, setFormChasis] = useState<string>("")
  const [formKilometraje, setFormKilometraje] = useState<number>(0)
  const [formCombustible, setFormCombustible] = useState<string>("Diesel")
  const [formCapacidad, setFormCapacidad] = useState<number>(45)
  const [formIdSocio, setFormIdSocio] = useState<string>("") // ID del socio dueño de la unidad

  // Sincronizar listados maestros desde el servidor Express
  const loadFlotaData = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const headers = { Authorization: `Bearer ${token}` }

      // Llamadas concurrentes asíncronas
      const [busesRes, sociosRes] = await Promise.all([
        axios.get<ApiResponse<BusUnidad[]>>(`${API_URL}/api/admin/buses`, { headers }),
        axios.get<ApiResponse<SocioOption[]>>(`${API_URL}/api/admin/socios-list`, { headers })
      ])

      if (busesRes.data.status === "OK" && busesRes.data.data) {
        setData(busesRes.data.data)
      }
      if (sociosRes.data.status === "OK" && sociosRes.data.data) {
        setSocios(sociosRes.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Fallo de enlace con el clúster transaccional.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlotaData()
  }, [])

  // Disparador Modo Alta Completa (CUS-03)
  const handleOpenAddMode = () => {
    setModalMode('add')
    setSelectedId(null)
    setFormPlaca("")
    setFormPadron("")
    setFormMarca("Mercedes-Benz")
    setFormModelo("")
    setFormAnio(new Date().getFullYear())
    setFormChasis("")
    setFormKilometraje(0)
    setFormCombustible("Diesel")
    setFormCapacidad(45)
    setFormIdSocio("")
    setIsModalOpen(true)
  }

  // Disparador Modo Edición Restringida a Parámetros de Operación
  const handleOpenEditMode = (bus: BusUnidad) => {
    setModalMode('edit')
    setSelectedId(bus.id_bus)
    setFormPlaca(bus.placa)
    setFormPadron(bus.numero_padron)
    setFormMarca(bus.marca)
    setFormModelo(bus.modelo)
    setFormAnio(bus.anio_modelo)
    setFormChasis(bus.chasis_numero)
    setFormKilometraje(bus.kilometraje_inicial)
    setFormCombustible(bus.tipo_combustible)
    setFormCapacidad(bus.capacidad_pasajeros)
    setFormIdSocio(bus.id_socio ? bus.id_socio.toString() : "")
    setIsModalOpen(true)
  }

  // Deshabilitar unidad (Baja lógica del bus en ruta)
  const handleBajaBus = async (id: number) => {
    if (!window.confirm("¿Confirmar la revocación y baja operativa de esta unidad vehicular en la ruta?")) return
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.delete(`${API_URL}/api/admin/buses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === "OK") loadFlotaData()
    } catch (err: any) {
      alert("Error al procesar la baja de la unidad.")
    }
  }

  // Procesador síncrono del Formulario conectado a la API REST
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const token = localStorage.getItem("svdrayf_token")
    const headers = { Authorization: `Bearer ${token}` }

    const payload = {
      placa: formPlaca,
      numero_padron: formPadron,
      marca: formMarca,
      modelo: formModelo,
      anio_modelo: formAnio,
      chasis_numero: formChasis,
      kilometraje_inicial: formKilometraje,
      tipo_combustible: formCombustible,
      capacidad_pasajeros: formCapacidad,
      id_socio: formIdSocio ? parseInt(formIdSocio, 10) : null
    }

    try {
      if (modalMode === 'add') {
        const res = await axios.post(`${API_URL}/api/admin/buses`, payload, { headers })
        if (res.data.status === "OK") {
          loadFlotaData()
          setIsModalOpen(false)
        }
      } else if (modalMode === 'edit' && selectedId !== null) {
        const res = await axios.put(`${API_URL}/api/admin/buses/${selectedId}`, payload, { headers })
        if (res.data.status === "OK") {
          loadFlotaData()
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Violación de restricciones UNIQUE. Verifique placa, chasis o padrón.")
    } finally {
      setLoading(false)
    }
  }

  // ========================================================
  // CONFIGURACIÓN DE COLUMNAS DE TANSTACK TABLE
  // ========================================================
  const columns: ColumnDef<BusUnidad>[] = [
    {
      accessorKey: "numero_padron",
      header: "Padrón",
      cell: ({ row }) => <span className="font-mono text-xs font-bold text-slate-400">#{row.getValue("numero_padron")}</span>,
    },
    {
      accessorKey: "placa",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent text-[#1E3A8A] font-bold">
          Placa Oficial
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-black tracking-wider text-slate-800">{row.getValue("placa")}</span>,
    },
    {
      accessorKey: "marca",
      header: "Fabricante / Modelo",
      cell: ({ row }) => {
        const bus = row.original
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700 text-sm">{bus.marca}</span>
            <span className="text-[11px] text-slate-400 font-medium">{bus.modelo} ({bus.anio_modelo})</span>
          </div>
        )
      },
    },
    {
      accessorKey: "socio_nombres",
      header: "Socio Copropietario",
      cell: ({ row }) => (
        <span className="font-medium text-slate-600 text-xs flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          {row.getValue("socio_nombres") || "Sin Asignar (Empresa)"}
        </span>
      ),
    },
    {
      accessorKey: "capacidad_pasajeros",
      header: "Capacidad",
      cell: ({ row }) => <span className="font-bold text-slate-700">{row.getValue("capacidad_pasajeros")} Asientos</span>,
    },
    {
      accessorKey: "estado",
      header: "Estado Flota",
      cell: ({ row }) => {
        const estadoActivo = row.getValue("estado") as boolean
        return (
          <Badge className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm border ${
            estadoActivo 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {estadoActivo ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {estadoActivo ? "ACTIVO EN RUTA" : "DE BAJA"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const bus = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-xl bg-white">
                <DropdownMenuLabel>Acciones de Fila</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(bus.placa)}>
                  Copiar Número Placa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleOpenEditMode(bus)} className="text-[#1E3A8A] font-medium">
                  Editar Parámetros Bus
                </DropdownMenuItem>
                {bus.estado && (
                  <DropdownMenuItem onClick={() => handleBajaBus(bus.id_bus)} className="text-red-600 font-medium">
                    Dar de Baja Vehicular
                  </DropdownMenuItem>
                )}
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
      
      {/* SECCIÓN 1: CABECERA CON GATILLO DEL MODAL DE ALTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2">
            <Bus className="w-6 h-6 text-[#1E3A8A]" /> Gestión de Flota Vehicular
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Mapeo analítico y registro operativo de unidades autorizadas en el tramo Mala-Lima.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadFlotaData} disabled={loading} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button 
            onClick={handleOpenAddMode}
            className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            + REGISTRAR AUTOBÚS
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-[#C5221F] text-xs font-bold rounded-xl border-l-4 border-[#C5221F]">
          ⚠️ Error de persistencia: {error}
        </div>
      )}

      {/* SECCIÓN 2: INPUT DE FILTRADO DINÁMICO */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-xl">
        <CardContent className="pt-4 pb-4">
          <Input
            placeholder="Filtrar flota por número de placa..."
            value={(table.getColumn("placa")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("placa")?.setFilterValue(e.target.value)}
            className="max-w-sm rounded-xl border-slate-200 focus-visible:ring-[#1E3A8A]"
          />
        </CardContent>
      </Card>

      {/* SECCIÓN 3: TABLA DE INSTANCIAS VIVAS */}
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
                    Sincronizando inventario vehicular con Neon DB...
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
                    No se detectaron unidades bajo ese criterio de búsqueda.
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
          🎛️ MODAL DIALOG COMPACTO ADAPTADO AL ESQUEMA POSTGRES
         ======================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md border-none p-6 bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1E3A8A] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              {modalMode === 'add' ? 'Registrar Nueva Unidad' : 'Modificar Parámetros Vehiculares'}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Todos los campos marcados se validarán con los índices de unicidad relacionales de tu DDL.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            
            <div className="grid grid-cols-2 gap-3">
              {/* Placa de Rodaje */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Placa de Rodaje</label>
                <Input 
                  placeholder="Ej: F3V-721" 
                  value={formPlaca} 
                  maxLength={7}
                  onChange={(e) => setFormPlaca(e.target.value)} 
                  required 
                  disabled={modalMode === 'edit'} // Bloqueado en edición por índice único
                  className="rounded-xl border-slate-200 uppercase font-mono"
                />
              </div>

              {/* Número de Padrón Interno */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">N° Padrón Bus</label>
                <Input 
                  placeholder="Ej: P-045" 
                  value={formPadron} 
                  onChange={(e) => setFormPadron(e.target.value)} 
                  required 
                  disabled={modalMode === 'edit'} // Bloqueado en edición por consistencia
                  className="rounded-xl border-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Fabricante / Marca */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Marca</label>
                <select 
                  value={formMarca} 
                  onChange={(e) => setFormMarca(e.target.value)}
                  required
                  disabled={modalMode === 'edit'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none"
                >
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Volvo">Volvo</option>
                  <option value="Scania">Scania</option>
                  <option value="Hyundai">Hyundai</option>
                </select>
              </div>

              {/* Modelo Vehicular */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Modelo</label>
                <Input 
                  placeholder="Ej: OF-1721" 
                  value={formModelo} 
                  onChange={(e) => setFormModelo(e.target.value)} 
                  required 
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Año Modelo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Año Fábrica</label>
                <Input 
                  type="number"
                  value={formAnio} 
                  onChange={(e) => setFormAnio(parseInt(e.target.value, 10))} 
                  required 
                  className="rounded-xl border-slate-200"
                />
              </div>

              {/* Aforo / Capacidad Pasajeros */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">N° Asientos</label>
                <Input 
                  type="number" 
                  value={formCapacidad} 
                  onChange={(e) => setFormCapacidad(parseInt(e.target.value, 10))} 
                  required 
                  min={10} 
                  max={90}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Número de Chasis Estricto */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Número de Chasis (Vin)</label>
              <Input 
                placeholder="Ej: 9BM34012HX9812A" 
                value={formChasis} 
                onChange={(e) => setFormChasis(e.target.value)} 
                required 
                disabled={modalMode === 'edit'} // Protegido por integridad criptográfica
                className="rounded-xl border-slate-200 font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Kilometraje Inicial */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Km Inicial</label>
                <Input 
                  type="number"
                  value={formKilometraje} 
                  onChange={(e) => setFormKilometraje(parseInt(e.target.value, 10))} 
                  required 
                  disabled={modalMode === 'edit'}
                  className="rounded-xl border-slate-200"
                />
              </div>

              {/* Tipo Combustible */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Combustible</label>
                <select 
                  value={formCombustible} 
                  onChange={(e) => setFormCombustible(e.target.value)}
                  disabled={modalMode === 'edit'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option value="Diesel">Diesel B5</option>
                  <option value="GNV">GNV Alternativo</option>
                  <option value="Gasolina">Gasolina</option>
                </select>
              </div>
            </div>

            {/* 🚀 AUTOCOMPLETADO DE SOCIO DUEÑO (FILTRADO DE ROL 3 DESDE LA BD) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Socio Propietario / Dueño de Unidad</label>
              <select 
                value={formIdSocio} 
                onChange={(e) => setFormIdSocio(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-[#1E3A8A]"
              >
                <option value="">Seleccionar dueño de la unidad...</option>
                {socios.map((socio) => (
                  <option key={socio.id_usuario} value={socio.id_usuario}>
                    {socio.nombres} (DNI: {socio.dni})
                  </option>
                ))}
              </select>
            </div>

            {/* Acciones Footer Dialog */}
            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white font-bold rounded-xl px-5">
                {modalMode === 'add' ? 'GUARDAR ALTA' : 'ACTUALIZAR VEHÍCULO'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}