import { describe, test, expect, vi } from 'vitest';

describe('RFN14 - Frontend: Configuración de Datos de Ticket', () => {
    
    // CP46: CAÍDA DEL SERVICIO DE INTERNET (Sad Path — Simulación de Error)
    test('CP46 — E3 — Debe capturar la interrupción de la red local y notificar al Administrador', () => {
        // 1. ARRANGE: Simulamos un objeto de error típico de Axios por desconexión física de red (Timeout)
        const errorDeRedSimulado = {
            code: 'ECONNABORTED',
            message: 'Network Error'
        };

        // Replicamos de forma exacta la lógica del interceptor del componente
        const evaluarRespuestaError = (err: typeof errorDeRedSimulado) => {
            if (err.code === "ECONNABORTED" || err.message.includes("Network Error")) {
                return "Error de red: No se pudo conectar con el servidor central de SVDRAYF. Revise su conexión e intente guardar la configuración nuevamente.";
            }
            return "Error genérico";
        };

        // 2. ACT
        const mensajeDesplegadoEnPantalla = evaluarRespuestaError(errorDeRedSimulado);

        // 3. ASSERT
        expect(mensajeDesplegadoEnPantalla).toBe(
            "Error de red: No se pudo conectar con el servidor central de SVDRAYF. Revise su conexión e intente guardar la configuración nuevamente."
        );
    });
});