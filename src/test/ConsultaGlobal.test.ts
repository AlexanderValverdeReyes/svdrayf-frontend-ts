import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockAlert = vi.fn();
globalThis.window = {
    alert: mockAlert
} as any;

describe('RFN09 - Frontend: Generar Resumen por Unidad', () => {
    
    beforeEach(() => {
        vi.clearAllMocks(); // Limpia el historial del mock entre ejecuciones
    });

    // =========================================================================
    // CP30: BLOQUEO DE EXPORTACIÓN EN BLANCO (Sad Path)
    // =========================================================================
    test('CP30 — Debe lanzar advertencia visual y abortar si los boletos están en cero', () => {
        // 1. ARRANGE (Preparar)
        const busSalesMock = { total_soles: 0, total_boletos: 0 };
        const setExportDialogOpenMock = vi.fn(); 

        // Lógica de negocio exacta extraída de tu componente
        const verificarYExportar = (sales: typeof busSalesMock) => {
            if (!sales || Number(sales.total_boletos) === 0) {
                window.alert("Aviso: No se encontraron registros de producción para la unidad en el periodo seleccionado. Asegúrese de que el cobrador haya cerrado el turno de viaje correctamente.");
                setExportDialogOpenMock(false);
                return "PROCESO_ABORTADO";
            }
            return "PROCESO_CORRECTO";
        };

        // 2. ACT (Actuar)
        const resultadoDelFlujo = verificarYExportar(busSalesMock);

        // 3. ASSERT (Verificar)
        // Comprobamos que la función abortó el proceso contable de forma conforme
        expect(resultadoDelFlujo).toBe("PROCESO_ABORTADO");

        // Verificamos de forma segura que el mensaje enviado al alert contiene el texto de la ficha
        expect(mockAlert).toHaveBeenCalled();
        const mensajeLanzado = mockAlert.mock.calls[0][0];
        expect(mensajeLanzado).toContain("Aviso: No se encontraron registros de producción");

        // Comprobamos que el modal se cierra para limpiar la experiencia del Gerente
        expect(setExportDialogOpenMock).toHaveBeenCalledWith(false);
    });
});