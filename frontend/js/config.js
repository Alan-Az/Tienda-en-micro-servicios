// Configuración de puertos y endpoints de los 6 microservicios
export const CONFIG = {
  SERVICES: {
    AUTH_PHP: 'http://localhost:8000/api',                  // Laravel 11 (PostgreSQL)
    INVENTORY_CSHARP: 'http://localhost:5084/api',          // ASP.NET Core .NET 10 (SQL Server)
    PAYMENTS_JAVA: 'http://localhost:8081/ws/pagos',        // Java 21 JAX-WS SOAP
    INVOICE_VBNET: 'http://localhost/FacturacionService.svc',// VB.NET WCF SOAP
    NOTIFICATIONS_NODE: 'http://localhost:3000/api',        // Node.js 20 Express
    ANALYTICS_PYTHON: 'http://localhost:8001/api'           // Python 3.12 FastAPI (MongoDB)
  },
  STORAGE_KEYS: {
    TOKEN: 'erp_jwt_token',
    USER: 'erp_user_data',
    CART: 'erp_shopping_cart'
  }
};
