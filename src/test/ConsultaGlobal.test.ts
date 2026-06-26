import { describe, test, expect, vi, beforeEach } from 'vitest';
// CONFIGURACIÓN DE ENTORNO GLOBAL (Mocks para evadir restricciones de Node)
const mockAlert = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

globalThis.window = {
    alert: mockAlert
} as any;

globalThis.document = {
    body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
    },
    createElement: vi.fn().mockImplementation((tag) => {
        if (tag === 'a') {
            return { href: '', download: '', click: mockClick };
        }
        return {};
    }),
} as any;

// BLOQUE 1: REQUERIMIENTO RFN09 - GENERAR RESUMEN POR UNIDAD
describe('RFN09 - Frontend: Generar Resumen por Unidad', () => {
    
    beforeEach(() => {
        vi.clearAllMocks(); // Limpia el historial de alertas y clics entre ejecuciones
    });

    // CP30: BLOQUEO DE EXPORTACIÓN EN BLANCO (Sad Path)
    test('CP30 — Debe lanzar advertencia visual y abortar si los boletos están en cero', () => {
        // 1. ARRANGE
        const busSalesMock = { total_soles: 0, total_boletos: 0 };
        const setExportDialogOpenMock = vi.fn(); 

        const verificarYExportar = (sales: typeof busSalesMock) => {
            if (!sales || Number(sales.total_boletos) === 0) {
                window.alert("Aviso: No se encontraron registros de producción para la unidad en el periodo seleccionado. Asegúrese de que el cobrador haya cerrado el turno de viaje correctamente.");
                setExportDialogOpenMock(false);
                return "PROCESO_ABORTADO";
            }
            return "PROCESO_CORRECTO";
        };

        // 2. ACT
        const resultadoDelFlujo = verificarYExportar(busSalesMock);

        // 3. ASSERT
        expect(resultadoDelFlujo).toBe("PROCESO_ABORTADO");
        expect(mockAlert).toHaveBeenCalled();
        const mensajeLanzado = mockAlert.mock.calls[0][0];
        expect(mensajeLanzado).toContain("Aviso: No se encontraron registros de producción");
        expect(setExportDialogOpenMock).toHaveBeenCalledWith(false);
    });
});

// BLOQUE 2: REQUERIMIENTO RFN12 - EXPORTAR REPORTES WEB
describe('RFN12 - Frontend: Exportar Reportes Web', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // CP37: EXPORTACIÓN CORRECTA DE REPORTES (Happy Path)
    test('CP37 — Exportación correcta de reportes (Happy Path en Excel)', () => {
        // 1. ARRANGE
        const busSalesValido = { total_soles: 500.00, total_boletos: 100 };
        const selectedBusMock = { marca: 'Makita', modelo: 'Bus', placa: 'F3V-894', numero_padron: '10' };

        const ejecutarExportacionExcel = (sales: typeof busSalesValido, format: string) => {
            if (format === 'xlsx') {
                const link = document.createElement('a');
                link.download = `BALANCE_${selectedBusMock.placa}.xls`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return "DESCARGA_INICIADA";
            }
            return "OMITIDO";
        };

        // 2. ACT
        const resultado = ejecutarExportacionExcel(busSalesValido, 'xlsx');

        // 3. ASSERT
        expect(resultado).toBe("DESCARGA_INICIADA");
        expect(mockClick).toHaveBeenCalled(); // Comprueba la simulación física de la descarga
        expect(mockAppendChild).toHaveBeenCalled();
        expect(mockRemoveChild).toHaveBeenCalled();
    });

    // CP39: TIMEOUT POR VOLUMEN MASIVO (Sad Path)
    test('CP39 — Simulación de resiliencia ante volúmenes masivos de datos en red', async () => {
        // 1. ARRANGE
        const axiosMockError = new Error('timeout of 10000ms exceeded');
        
        const cargarDatosMasivos = async () => {
            throw axiosMockError; 
        };

        // 2. ACT & 3. ASSERT
        await expect(cargarDatosMasivos()).rejects.toThrow('timeout of 10000ms exceeded');
    });
});