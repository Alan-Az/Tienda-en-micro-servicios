package com.erp.pagos;

import com.erp.pagos.model.CargoResponse;
import jakarta.jws.WebService;
import java.time.Instant;
import java.util.UUID;

@WebService(
    endpointInterface = "com.erp.pagos.PagosWebService",
    targetNamespace = "http://pagos.erp.com/",
    serviceName = "PagosService",
    portName = "PagosPort"
)
public class PagosWebServiceImpl implements PagosWebService {

    @Override
    public CargoResponse procesarCargo(String numeroTarjeta, String cvv, double monto, String fechaExpiracion) {
        System.out.println("[SOAP JAX-WS Pagos] Procesando cargo por monto: $" + monto + " para tarjeta terminación: " 
            + (numeroTarjeta != null && numeroTarjeta.length() >= 4 ? numeroTarjeta.substring(numeroTarjeta.length() - 4) : "****"));

        // Validación básica
        if (numeroTarjeta == null || numeroTarjeta.trim().isEmpty() || monto <= 0) {
            return new CargoResponse(
                false, 
                "", 
                "05", 
                "Rechazado: Datos de tarjeta o monto inválidos", 
                Instant.now().toString()
            );
        }

        // Simulación de aprobación bancaria
        String authCode = "AUTH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new CargoResponse(
            true, 
            authCode, 
            "00", 
            "Transacción bancaria aprobada exitosamente", 
            Instant.now().toString()
        );
    }
}
