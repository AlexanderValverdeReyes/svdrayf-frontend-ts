// src/components/Socio/UnidadesView.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel,
  SortingState, ColumnFiltersState, useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Bus, Search, Download, Calendar, DollarSign, Ticket, RefreshCw, ArrowLeft, Info, CheckCircle2, ShieldCheck, FileText } from "lucide-react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface BusUnidad {
  id_bus: number
  placa: string
  numero_padron: string
  marca: string
  modelo: string
  anio_modelo: number
  capacidad_pasajeros: number
  id_socio: number | null
  socio_nombres?: string
  estado: boolean
  rutas_ejecutadas?: string
}

interface BusSalesSummary {
  total_soles: number
  total_boletos: number
}

export default function UnidadesView(): React.JSX.Element {
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  const [buses, setBuses] = useState<BusUnidad[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [filtroPlaca, setFiltroPlaca] = useState<string>("")

  const [selectedBus, setSelectedBus] = useState<BusUnidad | null>(null)
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [busSales, setBusSales] = useState<BusSalesSummary | null>(null)
  const [salesLoading, setSalesLoading] = useState<boolean>(false)

  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)
  const [reportType, setReportType] = useState<string>("auditoria")
  const [exportFormat, setExportFormat] = useState<string>("pdf")

  const loadBuses = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.get(`${API_URL}/api/socio/buses`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.status === "OK") setBuses(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar sus unidades.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBuses() }, [])

  const fetchBusSales = async () => {
    if (!selectedBus) return
    setSalesLoading(true)
    try {
      const token = localStorage.getItem("svdrayf_token")
      const params: any = {}
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate
      const res = await axios.get(`${API_URL}/api/socio/bus-sales/${selectedBus.id_bus}`, {
        headers: { Authorization: `Bearer ${token}` }, params
      })
      if (res.data.status === "OK") setBusSales(res.data.data)
      else setBusSales(null)
    } catch (err) { console.error(err); setBusSales(null) }
    finally { setSalesLoading(false) }
  }

  useEffect(() => { if (selectedBus) fetchBusSales() }, [selectedBus, fromDate, toDate])

  const filteredData = useMemo(() => buses.filter(bus => filtroPlaca === "" || bus.placa.toLowerCase().includes(filtroPlaca.toLowerCase())), [buses, filtroPlaca])

  const columns: ColumnDef<BusUnidad>[] = [
    { accessorKey: "numero_padron", header: "Padrón", cell: ({ row }) => <span className="font-mono text-xs font-bold text-slate-400">#{row.getValue("numero_padron")}</span> },
    { accessorKey: "placa", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent font-bold text-[#1E3A8A]">Placa <ArrowUpDown className="ml-1 h-3 w-3" /></Button>), cell: ({ row }) => <span className="font-black tracking-wider text-slate-800">{row.getValue("placa")}</span> },
    { accessorKey: "marca", header: "Marca / Modelo", cell: ({ row }) => (<div className="flex flex-col"><span className="text-sm font-semibold">{row.original.marca}</span><span className="text-[11px] text-slate-400">{row.original.modelo} ({row.original.anio_modelo})</span></div>) },
    { accessorKey: "capacidad_pasajeros", header: "Capacidad", cell: ({ row }) => <span className="font-semibold text-xs">{row.getValue("capacidad_pasajeros")} Asientos</span> },
    { accessorKey: "estado", header: "Estado", cell: ({ row }) => (<Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${row.getValue("estado") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{row.getValue("estado") ? "ACTIVO" : "BAJA"}</Badge>) },
  ]

  const table = useReactTable({ data: filteredData, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), onSortingChange: setSorting, getSortedRowModel: getSortedRowModel(), onColumnFiltersChange: setColumnFilters, getFilteredRowModel: getFilteredRowModel(), state: { sorting, columnFilters } })

  const handleOpenExport = () => {
    if (!fromDate && !toDate) setReportType("auditoria")
    else if (fromDate && toDate && fromDate === toDate) setReportType("cierre")
    else setReportType("ventas")
    setExportDialogOpen(true)
  }

  const ejecutarExportacionLote = () => {
    if (!selectedBus) return;
    const totalRecaudado = busSales ? Number(busSales.total_soles).toFixed(2) : "0.00";
    const totalBoletos = busSales ? busSales.total_boletos : 0;
    const desdeTxt = fromDate || "Inicio Registro";
    const hastaTxt = toDate || "Fecha Actual";

    if (exportFormat === "xlsx") {
      const htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><h2>REPORTE DE VENTAS - ${selectedBus.placa}</h2><table border="1"><tr><td>Bus</td><td>${selectedBus.placa} (${selectedBus.marca} ${selectedBus.modelo})</td></tr><tr><td>Período</td><td>${desdeTxt} al ${hastaTxt}</td></tr><tr><td>Total Recaudado</td><td>S/. ${totalRecaudado}</td></tr><tr><td>Boletos Vendidos</td><td>${totalBoletos}</td></tr></table></body></html>`;
      const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `Reporte_${selectedBus.placa}_${reportType}.xls`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } else {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return alert("Permite ventanas emergentes.");
      printWindow.document.write(`<html><head><title>Reporte SVDRAYF</title><style>body { font-family: 'Segoe UI', sans-serif; padding: 40px; } .title { color: #1E3A8A; font-size: 24px; font-weight: 900; } .meta { background: #f8fafc; padding: 20px; margin-top: 20px; border-radius: 12px; } .kpi { font-size: 28px; font-weight: 900; color: #1e293b; }</style></head><body><div class="title">REPORTE DE FLOTA - ${selectedBus.placa}</div><div class="meta"><p><strong>Bus:</strong> ${selectedBus.marca} ${selectedBus.modelo}</p><p><strong>Placa:</strong> ${selectedBus.placa}</p><p><strong>Período:</strong> ${desdeTxt} al ${hastaTxt}</p><div style="display:flex; gap:20px; margin-top:20px;"><div><div class="kpi">S/. ${totalRecaudado}</div><small>Total Recaudado</small></div><div><div class="kpi">${totalBoletos} boletos</div><small>Vendidos</small></div></div></div><script>setTimeout(() => { window.print(); }, 500);</script></body></html>`);
      printWindow.document.close();
    }
    setExportDialogOpen(false);
  };

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-150">
      {!selectedBus ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2"><Bus className="w-6 h-6" /> Mis Unidades</h2>
              <p className="text-sm font-medium text-slate-400">Unidades registradas a su nombre.</p>
            </div>
            <Button variant="outline" onClick={loadBuses} disabled={loading} className="gap-2"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refrescar</Button>
          </div>

          <Card className="border-none shadow-sm rounded-xl bg-white">
            <CardContent className="flex flex-wrap gap-4 py-4">
              <div className="flex flex-col gap-1.5 w-64">
                <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Filtrar por Placa</Label>
                <Input placeholder="Ej: F3V-721" value={filtroPlaca} onChange={(e) => setFiltroPlaca(e.target.value)} className="rounded-xl border-slate-200 uppercase font-mono text-sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id} className="px-6 py-4">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-slate-400 animate-pulse">Cargando unidades...</TableCell></TableRow>
                  ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} className="cursor-pointer border-b transition-colors hover:bg-slate-50/50" onClick={() => setSelectedBus(row.original)}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} className="px-6 py-4 text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-slate-400">No se encontraron unidades.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <span className="text-xs font-bold text-slate-400">Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-xl font-bold text-xs">Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-xl font-bold text-xs">Siguiente</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-none shadow-xl rounded-2xl bg-white animate-in slide-in-from-right-4 duration-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => { setSelectedBus(null); setFromDate(""); setToDate(""); }} className="rounded-xl size-8"><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <CardTitle className="text-xl font-black text-[#1E3A8A]">{selectedBus.marca} [{selectedBus.placa}]</CardTitle>
              <CardDescription className="text-xs text-slate-400">Padrón #{selectedBus.numero_padron}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-3 bg-slate-50/70 p-4 rounded-xl items-end">
              <div className="flex flex-col gap-1.5"><Label className="text-xs font-black uppercase text-[#1E3A8A]">Desde</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl bg-white border-slate-200 h-10 font-mono text-sm" /></div>
              <div className="flex flex-col gap-1.5"><Label className="text-xs font-black uppercase text-[#1E3A8A]">Hasta</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl bg-white border-slate-200 h-10 font-mono text-sm" /></div>
              <Button variant="outline" onClick={() => { setFromDate(""); setToDate(""); }} className="rounded-xl h-10 text-xs font-bold">Restablecer</Button>
            </div>

            {salesLoading ? <div className="text-sm text-slate-400 animate-pulse py-8 text-center">Cargando ventas...</div> :
              busSales ? (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border border-slate-100 shadow-sm p-4 rounded-xl"><div className="flex items-center gap-2 text-emerald-600"><DollarSign className="w-4 h-4" /><span className="text-xs font-bold">Total Recaudado</span></div><p className="text-3xl font-black mt-2 font-mono">S/. {Number(busSales.total_soles).toFixed(2)}</p></Card>
                  <Card className="border border-slate-100 shadow-sm p-4 rounded-xl"><div className="flex items-center gap-2 text-blue-600"><Ticket className="w-4 h-4" /><span className="text-xs font-bold">Boletos Vendidos</span></div><p className="text-3xl font-black mt-2 font-mono">{busSales.total_boletos}</p></Card>
                </div>
              ) : <div className="text-sm text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-1.5"><Info className="w-4 h-4" /> No hay datos para el período seleccionado.</div>
            }

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button onClick={handleOpenExport} className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white gap-2 font-bold rounded-xl px-6 py-5 text-xs shadow-md"><Download className="w-4 h-4" /> CONFIGURAR Y EXPORTAR INFORME</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md border-none p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1E3A8A] flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Configurar Reporte</DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">Seleccione el tipo de informe y el formato de salida.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <Label className="text-xs font-bold uppercase mb-2 block">Tipo de Informe</Label>
              <div className="grid grid-cols-1 gap-2">
                <button type="button" onClick={() => setReportType("auditoria")} className={`p-3 rounded-xl border text-left text-xs flex items-center justify-between ${reportType === "auditoria" ? "border-[#1E3A8A] bg-blue-50/50 font-bold text-[#1E3A8A]" : "border-slate-200 text-slate-600 bg-white"}`}><span>📋 Auditoría de Flota</span>{reportType === "auditoria" && <CheckCircle2 className="w-4 h-4 text-[#1E3A8A]" />}</button>
                <button type="button" onClick={() => setReportType("cierre")} className={`p-3 rounded-xl border text-left text-xs flex items-center justify-between ${reportType === "cierre" ? "border-[#1E3A8A] bg-blue-50/50 font-bold text-[#1E3A8A]" : "border-slate-200 text-slate-600 bg-white"}`}><span>💰 Cierre de Caja Diario</span>{reportType === "cierre" && <CheckCircle2 className="w-4 h-4 text-[#1E3A8A]" />}</button>
                <button type="button" onClick={() => setReportType("ventas")} className={`p-3 rounded-xl border text-left text-xs flex items-center justify-between ${reportType === "ventas" ? "border-[#1E3A8A] bg-blue-50/50 font-bold text-[#1E3A8A]" : "border-slate-200 text-slate-600 bg-white"}`}><span>📈 Reporte de Ventas</span>{reportType === "ventas" && <CheckCircle2 className="w-4 h-4 text-[#1E3A8A]" />}</button>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase mb-2 block">Formato</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setExportFormat("pdf")} className={`p-3 rounded-xl border text-center text-xs flex items-center justify-center gap-1.5 ${exportFormat === "pdf" ? "border-[#1E3A8A] bg-blue-50/50 font-black text-[#1E3A8A]" : "border-slate-200 text-slate-600 font-semibold bg-white"}`}><FileText className="w-4 h-4" /> PDF</button>
                <button type="button" onClick={() => setExportFormat("xlsx")} className={`p-3 rounded-xl border text-center text-xs flex items-center justify-center gap-1.5 ${exportFormat === "xlsx" ? "border-[#1E3A8A] bg-blue-50/50 font-black text-[#1E3A8A]" : "border-slate-200 text-slate-600 font-semibold bg-white"}`}><Download className="w-4 h-4" /> Excel</button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 pt-3">
            <Button variant="outline" onClick={() => setExportDialogOpen(false)} className="rounded-xl font-bold text-xs h-10">Cancelar</Button>
            <Button className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white rounded-xl font-bold text-xs h-10 px-5" onClick={ejecutarExportacionLote}>EFECTUAR COMPILACIÓN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}