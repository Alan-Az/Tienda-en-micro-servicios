Imports System
Imports System.Runtime.Serialization

Namespace Models

    <DataContract(Namespace:="http://erp.retail.com/facturacion")>
    Public Class GenerarFacturaResponse
        <DataMember> Public Property Exitoso As Boolean
        <DataMember> Public Property UuidFolioFiscal As String
        <DataMember> Public Property SelloDigitalSAT As String
        <DataMember> Public Property XmlComprobante As String
        <DataMember> Public Property FechaTimbrado As DateTime
        <DataMember> Public Property MensajeError As String
    End Class

End Namespace
