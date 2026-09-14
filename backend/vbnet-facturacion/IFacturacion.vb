Imports System.ServiceModel
Imports FacturacionWcf.Models

Namespace FacturacionWcf

    <ServiceContract(Namespace:="http://erp.retail.com/facturacion")>
    Public Interface IFacturacion

        <OperationContract>
        Function Timbrar(request As GenerarFacturaRequest) As GenerarFacturaResponse

    End Interface

End Namespace
