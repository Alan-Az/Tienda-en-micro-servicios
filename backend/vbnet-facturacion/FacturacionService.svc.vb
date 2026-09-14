Imports System
Imports FacturacionWcf.Models

Namespace FacturacionWcf

    Public Class FacturacionService
        Implements IFacturacion

        Public Function Timbrar(request As GenerarFacturaRequest) As GenerarFacturaResponse Implements IFacturacion.Timbrar
            Dim response As New GenerarFacturaResponse()

            If request Is Nothing OrElse String.IsNullOrWhiteSpace(request.RfcReceptor) Then
                response.Exitoso = False
                response.MensajeError = "El RFC del receptor es obligatorio para timbrar la factura."
                Return response
            End If

            Dim uuid As String = Guid.NewGuid().ToString()
            Dim fecha As DateTime = DateTime.UtcNow
            Dim selloSimulado As String = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("SELLO_SAT_" & uuid & "_" & fecha.ToString("o")))

            ' Construir el XML timbrado del CFDI simulado
            Dim xml As String = "<?xml version=""1.0"" encoding=""UTF-8""?>" &
                "<cfdi:Comprobante xmlns:cfdi=""http://www.sat.gob.mx/cfd/4"" Version=""4.0"" " &
                "Folio=""" & uuid.Substring(0, 8) & """ Fecha=""" & fecha.ToString("s") & """ " &
                "SubTotal=""" & request.Subtotal.ToString("F2") & """ Total=""" & request.MontoTotal.ToString("F2") & """ " &
                "Sello=""" & selloSimulado & """>" &
                "<cfdi:Receptor Rfc=""" & request.RfcReceptor & """ Nombre=""" & request.RazonSocial & """/>" &
                "<cfdi:Conceptos>"

            If request.Conceptos IsNot Nothing Then
                For Each c In request.Conceptos
                    xml &= "<cfdi:Concepto ClaveProdServ=""43211503"" Cantidad=""" & c.Cantidad & """ Descripcion=""" & c.Descripcion & """ ValorUnitario=""" & c.PrecioUnitario.ToString("F2") & """/>"
                Next
            End If

            xml &= "</cfdi:Conceptos>" &
                "<cfdi:Complemento>" &
                "<tfd:TimbreFiscalDigital xmlns:tfd=""http://www.sat.gob.mx/TimbreFiscalDigital"" UUID=""" & uuid & """ SelloSAT=""" & selloSimulado & """/>" &
                "</cfdi:Complemento>" &
                "</cfdi:Comprobante>"

            response.Exitoso = True
            response.UuidFolioFiscal = uuid
            response.SelloDigitalSAT = selloSimulado
            response.XmlComprobante = xml
            response.FechaTimbrado = fecha
            response.MensajeError = "Comprobante timbrado con éxito."

            Return response
        End Function

    End Class

End Namespace
