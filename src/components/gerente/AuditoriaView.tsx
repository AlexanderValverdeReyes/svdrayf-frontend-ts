// src/components/gerente/AuditoriaView.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { 
  ArrowUpDown, Search, CheckCircle, XCircle, AlertTriangle, DollarSign, 
  RefreshCw, FileSearch, Bus, User, Calendar
} from "lucide-react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"  // Asegúrate de tener este componente de shadcn

interface BoletoAnulado {
  id_boleto: string
  fecha_emision: string
  monto_pagado_centavos: number
  modalidad_pago: string
  auditado: boolean
  motivo: string
  cobrador: string
  id_bus: number
  placa: string
  numero_padron: string
}

export default function AuditoriaView(): React.JSX.Element {
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  const [boletos, setBoletos] = useState<BoletoAnulado[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  // Estados de tabla
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Filtros
  const [filtroPlaca, setFiltroPlaca] = useState<string>("")
  const [filtroMotivo, setFiltroMotivo] = useState<string>("")
  const [desde, setDesde] = useState<string>("")
  const [hasta, setHasta] = useState<string>("")

  // Cargar boletos anulados desde el backend
  const loadBoletos = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const headers = { Authorization: `Bearer ${token}` }
      const params: any = {}
      if (desde) params.desde = desde
      if (hasta) params.hasta = hasta
      if (filtroPlaca) params.placa = filtroPlaca
      if (filtroMotivo) params.motivo = filtroMotivo

      const res = await axios.get(`${API_URL}/api/admin/boletos-anulados`, { headers, params })
      if (res.data.status === "OK") {
        setBoletos(res.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar boletos anulados.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoletos()
  }, [desde, hasta, filtroPlaca, filtroMotivo])

  // Marcar un boleto como auditado (revisado)
  const marcarAuditado = async (id_boleto: string) => {
    try {
      const token = localStorage.getItem("svdrayf_token")
      await axios.put(`${API_URL}/api/admin/boletos-anulados/${id_boleto}/auditar`, null, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Actualizar el estado local para reflejar el cambio
      setBoletos(prev => prev.map(b => b.id_boleto === id_boleto ? { ...b, auditado: true } : b))
    } catch (err) {
      console.error(err)
    }
  }

  // KPIs calculados
  const kpis = useMemo(() => {
    const totalAnulados = boletos.length
    const montoTotal = boletos.reduce((acc, b) => acc + Number(b.monto_pagado_centavos), 0) / 100

    // Motivo más común
    const motivos = boletos.reduce((acc: Record<string, number>, b) => {
      const motivo = b.motivo || "Sin motivo"
      acc[motivo] = (acc[motivo] || 0) + 1
      return acc
    }, {})
    const motivoComun = Object.entries(motivos).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

    return { totalAnulados, montoTotal, motivoComun }
  }, [boletos])

  // Columnas de la tabla
  const columns: ColumnDef<BoletoAnulado>[] = [
    {
      id: "auditado",
      header: "Revisado",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.auditado}
          onCheckedChange={() => {
            if (!row.original.auditado) marcarAuditado(row.original.id_boleto)
          }}
          disabled={row.original.auditado}
          className="h-4 w-4"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "fecha_emision",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent font-bold text-[#1E3A8A]">
          Fecha <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-xs">{new Date(row.getValue("fecha_emision")).toLocaleString()}</span>,
    },
    {
      accessorKey: "placa",
      header: "Bus / Placa",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.original.placa}</span>
          <span className="text-xs text-slate-400">Padrón #{row.original.numero_padron}</span>
        </div>
      ),
    },
    {
      accessorKey: "cobrador",
      header: "Cobrador",
      cell: ({ row }) => <span className="text-sm">{row.getValue("cobrador")}</span>,
    },
    {
      accessorKey: "monto_pagado_centavos",
      header: () => <span className="text-right block">Monto</span>,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-right block">
          S/. {(Number(row.getValue("monto_pagado_centavos")) / 100).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "motivo",
      header: "Motivo",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
          {row.getValue("motivo")}
        </Badge>
      ),
    },
  ]

  const table = useReactTable({
    data: boletos,
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
    <div className="space-y-6 p-4 animate-in fade-in duration-150">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Auditoría de Boletos Anulados
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Supervisión de pasajes cancelados y detección de patrones de fraude.
          </p>
        </div>
        <Button variant="outline" onClick={loadBoletos} disabled={loading} className="gap-2 border-slate-200 text-slate-600 rounded-xl font-bold text-xs h-10 hover:bg-slate-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refrescar
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm font-semibold rounded-xl">{error}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Total Anulados</p>
              <p className="text-2xl font-black text-slate-800">{kpis.totalAnulados}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Motivo más común</p>
              <p className="text-lg font-black text-slate-800 truncate max-w-[150px]" title={kpis.motivoComun}>
                {kpis.motivoComun}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Total en Soles (Referencial)</p>
              <p className="text-2xl font-black text-slate-800">S/. {kpis.montoTotal.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 italic">No representa pérdida neta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-none shadow-sm rounded-xl bg-white">
        <CardContent className="flex flex-wrap gap-4 py-4">
          <div className="flex flex-col gap-1.5 w-48">
            <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Placa</Label>
            <Input
              placeholder="F3V-721"
              value={filtroPlaca}
              onChange={(e) => setFiltroPlaca(e.target.value)}
              className="rounded-xl border-slate-200 uppercase font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-48">
            <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Motivo</Label>
            <Input
              placeholder="Error de cobro"
              value={filtroMotivo}
              onChange={(e) => setFiltroMotivo(e.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-40">
            <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Desde</Label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-xl border-slate-200" />
          </div>
          <div className="flex flex-col gap-1.5 w-40">
            <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Hasta</Label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-xl border-slate-200" />
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
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
                    Cargando registros de anulaciones...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`border-b transition-colors ${row.original.auditado ? "bg-green-50/30" : "hover:bg-slate-50/50"}`}
                  >
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
                    No se encontraron boletos anulados con esos filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-xl font-bold text-xs">Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-xl font-bold text-xs">Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}