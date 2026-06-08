// src/components/admin/TarifariosView.tsx
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
import { ArrowUpDown, MoreHorizontal, Receipt, Shield, RefreshCw, MapPin, Users, CalendarDays, Coins } from "lucide-react"
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

// Interfaces estrictas correlacionadas con el esquema Postgres corregido
interface TarifarioItem {
  id_tarifario: number
  id_ruta_modalidad: number
  id_paradero_origen: number
  id_paradero_destino: number
  id_tipo_pasajero: number
  precio_normal_centavos: number
  precio_dom_fer_centavos: number
  origen_nombre?: string
  destino_nombre?: string
  pasajero_tipo_nombre?: string
  modalidad_nombre?: string
}

interface DropdownDependencies {
  paraderos: { id_paradero: number; nombre_paradero: string }[]
  tipos_pasajero: { id_tipo_pasajero: number; nombre_tipo: string }[]
  modalidades: { id_ruta_modalidad: number; nombre_modalidad: string }[]
}

export default function TarifariosView(): React.JSX.Element {
  const [data, setData] = useState<TarifarioItem[]>([])
  const [dependencies, setDependencies] = useState<DropdownDependencies>({ paraderos: [], tipos_pasajero: [], modalidades: [] })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  //  REQUERIMIENTO FIGMA: Selector dinámico de contexto de precios en la tabla
  const [activeTabPrice, setActiveTabPrice] = useState<'normal' | 'dom_fer'>('normal')

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  // Estados del Formulario Unificado
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formRuta, setFormRuta] = useState<string>("")
  const [formOrigen, setFormOrigen] = useState<string>("")
  const [formDestino, setFormDestino] = useState<string>("")
  const [formTipoPasajero, setFormTipoPasajero] = useState<string>("")
  const [formPrecioNormal, setFormPrecioNormal] = useState<number>(0)
  const [formPrecioDomFer, setFormPrecioDomFer] = useState<number>(0)

  const loadTarifariosData = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const headers = { Authorization: `Bearer ${token}` }

      const [tarifasRes, depRes] = await Promise.all([
        axios.get<{ status: string; data: TarifarioItem[] }>(`${API_URL}/api/admin/tarifarios`, { headers }),
        axios.get<{ status: string; data: DropdownDependencies }>(`${API_URL}/api/admin/tarifarios-dependencies`, { headers })
      ])

      if (tarifasRes.data.status === "OK") setData(tarifasRes.data.data)
      if (depRes.data.status === "OK") setDependencies(depRes.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error || "Fallo de conexión con la matriz de Neon DB.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTarifariosData()
  }, [])

  const handleOpenAddMode = () => {
    setModalMode('add')
    setSelectedId(null)
    setFormRuta(dependencies.modalidades[0]?.id_ruta_modalidad.toString() || "")
    setFormOrigen("")
    setFormDestino("")
    setFormTipoPasajero(dependencies.tipos_pasajero[0]?.id_tipo_pasajero.toString() || "")
    setFormPrecioNormal(0)
    setFormPrecioDomFer(0)
    setIsModalOpen(true)
  }

  const handleOpenEditMode = (item: TarifarioItem) => {
    setModalMode('edit')
    setSelectedId(item.id_tarifario)
    setFormRuta(item.id_ruta_modalidad.toString())
    setFormOrigen(item.id_paradero_origen.toString())
    setFormDestino(item.id_paradero_destino.toString())
    setFormTipoPasajero(item.id_tipo_pasajero.toString())
    setFormPrecioNormal(item.precio_normal_centavos / 100)
    setFormPrecioDomFer(item.precio_dom_fer_centavos / 100)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const token = localStorage.getItem("svdrayf_token")
    const headers = { Authorization: `Bearer ${token}` }

    try {
      if (modalMode === 'add') {
        const res = await axios.post(`${API_URL}/api/admin/tarifarios`, {
          id_ruta_modalidad: parseInt(formRuta, 10),
          id_paradero_origen: parseInt(formOrigen, 10),
          id_paradero_destino: parseInt(formDestino, 10),
          id_tipo_pasajero: parseInt(formTipoPasajero, 10),
          precio_normal: formPrecioNormal,
          precio_dom_fer: formPrecioDomFer
        }, { headers })
        if (res.data.status === "OK") { loadTarifariosData(); setIsModalOpen(false) }
      } else if (modalMode === 'edit' && selectedId !== null) {
        const res = await axios.put(`${API_URL}/api/admin/tarifarios/${selectedId}`, {
          precio_normal: formPrecioNormal,
          precio_dom_fer: formPrecioDomFer
        }, { headers })
        if (res.data.status === "OK") { loadTarifariosData(); setIsModalOpen(false) }
      }
    } catch (err: any) {
      alert("Error transaccional al modificar tarifas.")
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<TarifarioItem>[] = [
    {
      accessorKey: "id_tarifario",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400">#{row.getValue("id_tarifario")}</span>,
    },
    {
      accessorKey: "origen_nombre",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent text-[#1E3A8A] font-bold">
          Tramo Recorrido (Origen - Destino)
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col leading-tight">
            <span className="font-black text-slate-800">{item.origen_nombre}</span>
            <span className="text-xs text-slate-400 font-medium">hacia {item.destino_nombre}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "pasajero_tipo_nombre",
      header: "Tipo Pasajero",
      cell: ({ row }) => <span className="font-semibold text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{row.getValue("pasajero_tipo_nombre")}</span>,
    },
    {
      accessorKey: "precio_normal_centavos",
      header: "Precio Regular (L-S)",
      cell: ({ row }) => {
        const normal = row.getValue("precio_normal_centavos") as number
        return (
          <span className={`font-mono font-bold text-sm ${activeTabPrice === 'normal' ? 'text-emerald-600 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100' : 'text-slate-500'}`}>
            S/. {(normal / 100).toFixed(2)}
          </span>
        )
      },
    },
    {
      accessorKey: "precio_dom_fer_centavos",
      header: "Domingos y Feriados",
      cell: ({ row }) => {
        const domFer = row.getValue("precio_dom_fer_centavos") as number
        return (
          <span className={`font-mono font-bold text-sm ${activeTabPrice === 'dom_fer' ? 'text-blue-600 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100' : 'text-slate-500'}`}>
            S/. {(domFer / 100).toFixed(2)}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-xl bg-white">
              <DropdownMenuLabel>Ajustes de Precio</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenEditMode(row.original)} className="text-[#1E3A8A] font-medium">
                Actualizar Tarifas (Monto)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
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
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#1E3A8A]" /> Carga de Tarifarios Estáticos
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Definición de precios fijos de la ruta Mala-Lima segmentados por tipo de jornada (CUS-04).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadTarifariosData} disabled={loading} className="rounded-xl border-slate-200">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleOpenAddMode} className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white font-bold rounded-xl shadow-md">
            + NUEVA TARIFA TRAMO
          </Button>
        </div>
      </div>

      {error && <div className="p-3.5 bg-red-50 text-[#C5221F] text-xs font-bold rounded-xl border-l-4 border-[#C5221F]">{error}</div>}

      {/*  BOTONES DE SELECCIÓN DE VISTA DE FIGMA (DÍAS NORMALES VS DOMINGOS Y FERIADOS) */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-md border border-slate-200/60 shadow-inner">
        <Button 
          variant={activeTabPrice === 'normal' ? 'default' : 'ghost'}
          onClick={() => setActiveTabPrice('normal')}
          className={`flex-1 rounded-xl font-bold text-xs gap-1.5 transition-all ${activeTabPrice === 'normal' ? 'bg-white text-[#1E3A8A] shadow-md hover:bg-white' : 'text-slate-500'}`}
        >
          <CalendarDays className="w-4 h-4" /> Días Normales de Semana (L-S)
        </Button>
        <Button 
          variant={activeTabPrice === 'dom_fer' ? 'default' : 'ghost'}
          onClick={() => setActiveTabPrice('dom_fer')}
          className={`flex-1 rounded-xl font-bold text-xs gap-1.5 transition-all ${activeTabPrice === 'dom_fer' ? 'bg-white text-[#1E3A8A] shadow-md hover:bg-white' : 'text-slate-500'}`}
        >
          <Coins className="w-4 h-4" /> Domingos y Feriados
        </Button>
      </div>

      {/* INPUT FILTRADO POR ORIGEN */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-xl">
        <CardContent className="pt-4 pb-4">
          <Input
            placeholder="Buscar tarifas por nombre del paradero de origen..."
            value={(table.getColumn("origen_nombre")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("origen_nombre")?.setFilterValue(e.target.value)}
            className="max-w-sm rounded-xl border-slate-200 focus-visible:ring-[#1E3A8A]"
          />
        </CardContent>
      </Card>

      {/* TABLA PRINCIPAL DE PRECIOS */}
      <Card className="border-none shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-slate-100 hover:bg-transparent">
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
                  <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400 animate-pulse font-semibold">
                    Sincronizando grilla tarifaria con Neon DB...
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
                  <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400 font-semibold">
                    No existen tarifas configuradas para este tramo interprovincial.
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
           MODAL DIALOG COMPACTO CON GESTIÓN DUAL DE JORNADAS
         ======================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md border-none p-6 bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1E3A8A] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              {modalMode === 'add' ? 'Registrar Tramo de Tarifario' : 'Modificar Valores de Combustible'}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              {modalMode === 'add' ? 'Indexe un nuevo cruce geográfico y defina sus dos categorías de precios.' : 'Modifique las tarifas. Los cambios impactarán en los aplicativos móviles al iniciar turnos.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            
            {modalMode === 'add' && (
              <>
                {/* Selector Modalidad de Ruta */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Modalidad del Recorrido</label>
                  <select value={formRuta} onChange={(e) => setFormRuta(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    <option value="">Seleccione modalidad...</option>
                    {dependencies.modalidades.map((m) => <option key={m.id_ruta_modalidad} value={m.id_ruta_modalidad}>{m.nombre_modalidad}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
  {/* Selector Paradero Origen */}
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-0.5">
      <MapPin className="w-3 h-3"/> Origen
    </label>
    <select 
      value={formOrigen} 
      onChange={(e) => setFormOrigen(e.target.value)} 
      disabled={formDestino === "99"} // Bloqueo reactivo si es Ruta Corta
      required 
      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
    >
      <option value="">Seleccione origen...</option>
      {dependencies.paraderos.map((p) => <option key={p.id_paradero} value={p.id_paradero}>{p.nombre_paradero}</option>)}
    </select>
  </div>

  {/* Selector Paradero Destino */}
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-0.5">
      <MapPin className="w-3 h-3"/> Destino
    </label>
    <select 
      value={formDestino} 
      onChange={(e) => {
        const val = e.target.value;
        setFormDestino(val);
        // 🛠️ REGLA REACTIVA: Si se selecciona Ruta Corta (ID 99), auto-asigna el origen dummy (ID 98)
        if (val === "99") {
          setFormOrigen("98");
        }
      }} 
      required 
      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
    >
      <option value="">Seleccione destino...</option>
      {dependencies.paraderos.map((p) => <option key={p.id_paradero} value={p.id_paradero}>{p.nombre_paradero}</option>)}
    </select>
  </div>
</div>

                {/* Selector Tipo de Pasajero */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Categoría de Pasajero</label>
                  <select value={formTipoPasajero} onChange={(e) => setFormTipoPasajero(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    {dependencies.tipos_pasajero.map((t) => <option key={t.id_tipo_pasajero} value={t.id_tipo_pasajero}>{t.nombre_tipo}</option>)}
                  </select>
                </div>
              </>
            )}

            {modalMode === 'edit' && (
              <div className="p-3 bg-blue-50 text-blue-800 border border-blue-100 rounded-xl text-xs font-semibold">
                 Las llaves geográficas (tramo y pasajero) están protegidas. Solo se autoriza la mutación de montos por reajustes económicos o de combustible.
              </div>
            )}

            {/* ENTRADA EXPLICITA DE AMBAS TARIFAS SIMULTÁNEAS */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-[#1E3A8A]">Precio Normal (S/.)</label>
                <Input 
                  type="number" 
                  step="0.10" 
                  value={formPrecioNormal} 
                  onChange={(e) => setFormPrecioNormal(parseFloat(e.target.value) || 0)} 
                  required 
                  className="rounded-xl border-slate-200 bg-white font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-blue-700">Dom y Feriados (S/.)</label>
                <Input 
                  type="number" 
                  step="0.10" 
                  value={formPrecioDomFer} 
                  onChange={(e) => setFormPrecioDomFer(parseFloat(e.target.value) || 0)} 
                  required 
                  className="rounded-xl border-slate-200 bg-white font-mono font-bold"
                />
              </div>
            </div>

            {/* ACCIONES DIALOG FOOTER */}
            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white font-bold rounded-xl px-5">
                {modalMode === 'add' ? 'GUARDAR TARIFARIO' : 'ACTUALIZAR MATRIZ'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}