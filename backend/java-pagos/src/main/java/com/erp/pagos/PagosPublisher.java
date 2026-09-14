package com.erp.pagos;

import jakarta.xml.ws.Endpoint;

public class PagosPublisher {
    public static void main(String[] args) {
        String url = "http://0.0.0.0:8081/ws/pagos";
        System.out.println("Iniciando servicio SOAP de Pagos (Java JAX-WS)...");
        System.out.println("Publicando endpoint en: " + url);
        System.out.println("WSDL disponible en: " + url + "?wsdl");

        Endpoint.publish(url, new PagosWebServiceImpl());

        System.out.println("Servicio SOAP activo y en escucha en el puerto 8081.");
    }
}
