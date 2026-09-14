package com.erp.pagos;

import com.erp.pagos.model.CargoResponse;
import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.jws.WebResult;
import jakarta.jws.WebService;

@WebService(targetNamespace = "http://pagos.erp.com/")
public interface PagosWebService {

    @WebMethod(operationName = "ProcesarCargo")
    @WebResult(name = "ResultadoPago")
    CargoResponse procesarCargo(
        @WebParam(name = "NumeroTarjeta") String numeroTarjeta,
        @WebParam(name = "CVV") String cvv,
        @WebParam(name = "Monto") double monto,
        @WebParam(name = "FechaExpiracion") String fechaExpiracion
    );
}
