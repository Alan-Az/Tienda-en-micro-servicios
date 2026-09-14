Imports System.Runtime.Serialization
Imports System.Collections.Generic

Namespace Models

    <DataContract(Namespace:="http://erp.retail.com/facturacion")>
    Public Class GenerarFacturaRequest
        <DataMember> Public Property RfcReceptor As String
        <DataMember> Public Property RazonSocial As String
        <DataMember> Public Property MontoTotal As Decimal
        <DataMember> Public Property Subtotal As Decimal
        <DataMember> Public Property Iva As Decimal
        <DataMember> Public Property Conceptos As List(Of ConceptoItem)
    End Class

    <DataContract(Namespace:="http://erp.retail.com/facturacion")>
    Public Class ConceptoItem
        <DataMember> Public Property Descripcion As String
        <DataMember> Public Property Cantidad As Integer
        <DataMember> Public Property PrecioUnitario As Decimal
    End Class

End Namespace
