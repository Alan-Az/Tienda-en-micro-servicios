package com.erp.pagos.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "ResultadoPago")
@XmlAccessorType(XmlAccessType.FIELD)
public class CargoResponse {

    @XmlElement(name = "Aprobado")
    private boolean aprobado;

    @XmlElement(name = "NumeroAutorizacion")
    private String numeroAutorizacion;

    @XmlElement(name = "CodigoRespuesta")
    private String codigoRespuesta;

    @XmlElement(name = "Mensaje")
    private String mensaje;

    @XmlElement(name = "FechaTransaccion")
    private String fechaTransaccion;

    public CargoResponse() {}

    public CargoResponse(boolean aprobado, String numeroAutorizacion, String codigoRespuesta, String mensaje, String fechaTransaccion) {
        this.aprobado = aprobado;
        this.numeroAutorizacion = numeroAutorizacion;
        this.codigoRespuesta = codigoRespuesta;
        this.mensaje = mensaje;
        this.fechaTransaccion = fechaTransaccion;
    }

    public boolean isAprobado() { return aprobado; }
    public void setAprobado(boolean aprobado) { this.aprobado = aprobado; }

    public String getNumeroAutorizacion() { return numeroAutorizacion; }
    public void setNumeroAutorizacion(String numeroAutorizacion) { this.numeroAutorizacion = numeroAutorizacion; }

    public String getCodigoRespuesta() { return codigoRespuesta; }
    public void setCodigoRespuesta(String codigoRespuesta) { this.codigoRespuesta = codigoRespuesta; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public String getFechaTransaccion() { return fechaTransaccion; }
    public void setFechaTransaccion(String fechaTransaccion) { this.fechaTransaccion = fechaTransaccion; }
}
