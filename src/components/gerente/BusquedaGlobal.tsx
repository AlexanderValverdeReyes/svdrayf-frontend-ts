// src/components/gerente/BusquedaGlobal.tsx
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
  ArrowUpDown, Search, Printer, RefreshCw, XCircle, CheckCircle, QrCode, User, Calendar,
  Bus, DollarSign, MapPin, Hash, ArrowLeft
} from "lucide-react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"

interface BoletoDetalle {
  id_boleto: string
  hash_qr: string
  estado_boleto: string
  monto_pagado_centavos: number
  fecha_emision: string
  modalidad_pago: string
  cobrador: string
  placa: string
  numero_padron: string
  ruta: string
  origen: string
  destino: string
}

export default function BusquedaGlobal(): React.JSX.Element {
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  const [query, setQuery] = useState<string>("")
  const [tipoBusqueda, setTipoBusqueda] = useState<"hash" | "cobrador">("hash")
  const [boletos, setBoletos] = useState<BoletoDetalle[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [selectedBoleto, setSelectedBoleto] = useState<BoletoDetalle | null>(null)

  // Estados de tabla
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Buscar boletos según tipo
  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError("")
    setBoletos([])
    setSelectedBoleto(null)
    try {
      const token = localStorage.getItem("svdrayf_token")
      const headers = { Authorization: `Bearer ${token}` }
      const params: any = {}
      if (tipoBusqueda === "hash") params.hash = query.trim()
      else params.cobrador = query.trim()

      const res = await axios.get(`${API_URL}/api/admin/buscar-boletos`, { headers, params })
      if (res.data.status === "OK") {
        setBoletos(res.data.data)
      } else {
        setBoletos([])
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al buscar boletos.")
    } finally {
      setLoading(false)
    }
  }

  // Columnas de la tabla de resultados
  const columns: ColumnDef<BoletoDetalle>[] = [
    {
      accessorKey: "estado_boleto",
      header: "Estado",
      cell: ({ row }) => (
        <Badge className={`text-xs font-bold ${row.getValue("estado_boleto") === "VALIDO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {row.getValue("estado_boleto") === "VALIDO" ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
          {row.getValue("estado_boleto")}
        </Badge>
      ),
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
      accessorKey: "cobrador",
      header: "Cobrador",
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("cobrador")}</span>,
    },
    {
  accessorKey: "hash_qr",
  header: "Hash QR",
  cell: ({ row }) => {
    const hash = row.getValue("hash_qr") as string;
    return (
      <span className="font-mono text-xs text-slate-500 break-all">
        {hash.substring(0, 12)}...
      </span>
    );
  },
},
    {
      accessorKey: "placa",
      header: "Bus",
      cell: ({ row }) => <span className="font-bold">{row.getValue("placa")}</span>,
    },
    {
      accessorKey: "monto_pagado_centavos",
      header: () => <span className="text-right block">Monto</span>,
      cell: ({ row }) => (
        <span className="font-mono text-right block">S/. {(Number(row.getValue("monto_pagado_centavos")) / 100).toFixed(2)}</span>
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

  // Imprimir tarjeta virtual del boleto seleccionado
  const handlePrintTicket = () => {
    if (!selectedBoleto) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Permite ventanas emergentes para imprimir el ticket.")
      return
    }

    const b = selectedBoleto
    printWindow.document.write(`
      <html>
        <head>
          <title>Reimpresión Boleto - SVDRAYF</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f8fafc;
              margin: 0;
            }
            .ticket {
              width: 380px;
              background: white;
              border: 1px dashed #000;
              padding: 20px;
              font-size: 13px;
              box-shadow: 2px 2px 12px rgba(0,0,0,0.1);
            }
            .ticket h2 { font-size: 18px; margin: 0 0 10px; font-weight: bold; text-align: center; }
            .ticket p { margin: 6px 0; }
            .ticket .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .ticket .footer { font-size: 10px; color: #555; text-align: center; }
            .ticket .valor { font-weight: bold; }
            .ticket .estado { font-size: 12px; font-weight: bold; text-align: center; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h2>Boleto de Viaje</h2>
            <p class="estado">Estado: ${b.estado_boleto}</p>
            <div class="divider"></div>
            <p><span class="valor">Ruta:</span> ${b.ruta} (${b.origen} → ${b.destino})</p>
            <p><span class="valor">Bus:</span> ${b.placa} (#${b.numero_padron})</p>
            <p><span class="valor">Cobrador:</span> ${b.cobrador}</p>
            <p><span class="valor">Fecha:</span> ${new Date(b.fecha_emision).toLocaleString()}</p>
            <p><span class="valor">Monto:</span> S/. ${(Number(b.monto_pagado_centavos) / 100).toFixed(2)}</p>
            <p><span class="valor">Modalidad de pago:</span> ${b.modalidad_pago}</p>
            <div class="divider"></div>
            <p><span class="valor">Hash QR:</span></p>
            <p style="font-size: 9px; word-break: break-all;">${b.hash_qr}</p>
            <div class="divider"></div>
            <p class="footer">Este ticket es una reimpresión oficial del sistema SVDRAYF.</p>
          </div>
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2">
            <Search className="w-6 h-6 text-[#1E3A8A]" /> Búsqueda Global de Boletos
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Encuentre cualquier boleto por hash QR o por nombre del cobrador.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm font-semibold rounded-xl">{error}</div>
      )}

      {/* Panel de búsqueda */}
      <Card className="border-none shadow-sm rounded-xl bg-white">
        <CardContent className="flex flex-wrap gap-4 py-4 items-end">
          <div className="flex flex-col gap-1.5 w-64">
            <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Buscar por</Label>
            <select
              value={tipoBusqueda}
              onChange={(e) => setTipoBusqueda(e.target.value as "hash" | "cobrador")}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            >
              <option value="hash">Hash QR</option>
              <option value="cobrador">Cobrador</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Término de búsqueda</Label>
            <div className="flex gap-2">
              <Input
                placeholder={tipoBusqueda === "hash" ? "Ingrese el hash QR..." : "Nombre del cobrador..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="rounded-xl border-slate-200"
              />
              <Button onClick={handleSearch} disabled={loading} className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white rounded-xl font-bold">
                <Search className="w-4 h-4 mr-1" /> Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Si hay un boleto seleccionado, mostramos su tarjeta virtual */}
      {selectedBoleto && (
        <Card className="border-none shadow-xl rounded-2xl bg-white border border-slate-100 animate-in slide-in-from-right-4 duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-black text-[#1E3A8A] flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 cursor-pointer" onClick={() => setSelectedBoleto(null)} />
                Ticket Digital - {selectedBoleto.estado_boleto}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Reimpresión oficial. Puede imprimir esta copia para el pasajero.
              </CardDescription>
            </div>
            <Button onClick={handlePrintTicket} className="gap-2 rounded-xl font-bold" variant="outline">
              <Printer className="w-4 h-4" /> Imprimir Copia
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /><span className="text-sm">Ruta: <b>{selectedBoleto.ruta}</b> ({selectedBoleto.origen} → {selectedBoleto.destino})</span></div>
              <div className="flex items-center gap-2"><Bus className="w-4 h-4 text-slate-400" /><span className="text-sm">Bus: <b>{selectedBoleto.placa}</b> (#{selectedBoleto.numero_padron})</span></div>
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /><span className="text-sm">Cobrador: <b>{selectedBoleto.cobrador}</b></span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><span className="text-sm">Fecha: <b>{new Date(selectedBoleto.fecha_emision).toLocaleString()}</b></span></div>
              <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /><span className="text-sm">Monto: <b>S/. {(Number(selectedBoleto.monto_pagado_centavos) / 100).toFixed(2)}</b></span></div>
              <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-slate-400" /><span className="text-sm font-mono text-xs break-all">Hash: {selectedBoleto.hash_qr}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de resultados */}
      {!selectedBoleto && (
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
                      Buscando boletos...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer border-b transition-colors hover:bg-slate-50/50"
                      onClick={() => setSelectedBoleto(row.original)}
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
                      {query ? "No se encontraron boletos con esos criterios." : "Ingrese un término de búsqueda y presione buscar."}
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
      )}
    </div>
  )
}