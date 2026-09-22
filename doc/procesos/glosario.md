# Glosario

Términos del negocio, en el orden en que aparecen en el ciclo de vida. Cada entrada indica la entidad de base de datos que lo representa (modelo Django en `backend/api/models/`, modelo Prisma en `apps/admin-next/prisma/schema.prisma`). Los nombres con errores ortográficos históricos (`ShoppingReceip`, `DeliverReceip`, `delivery_receips`) se mantienen tal cual porque forman parte del esquema y de la API; no se "corrigen".

| Término | Definición | Entidad |
|---|---|---|
| **Cliente** | Persona que encarga productos y recibe entregas. Tiene un agente asignado (`assigned_agent`) y un balance acumulado (`balance`). No usa el panel; solo la app cliente en modo lectura. | `CustomUser` con `role = client` |
| **Gestor / agente** | Miembro del equipo que atiende a un grupo de clientes, crea sus órdenes y cobra una comisión por peso entregado (`agent_profit`, en dinero por libra). En la orden aparece como `sales_manager`. | `CustomUser` con `role = agent` |
| **Logístico** | Miembro del equipo que registra paquetes, llegadas, bolsas y entregas. | `CustomUser` con `role = logistical` |
| **Contador** | Miembro del equipo que registra cobros, aplica saldo, lleva facturas, gastos y balances. | `CustomUser` con `role = accountant` |
| **Administrador** | Acceso total; único rol que compra y que puede deshacer transiciones (reabrir, re-pesar). | `CustomUser` con `role = admin` |
| **Tienda** | Comercio online donde se compra (Shein, Amazon, Temu...). Define la tarifa de tienda por defecto (`taxes`, porcentaje). | `Shop` |
| **Cuenta de compra** | Cuenta de usuario en una tienda con la que se realiza la compra. | `BuyingAccounts` |
| **Categoría** | Tipo de mercancía a efectos de envío. Define el costo por libra que paga el sistema al transportista (`shipping_cost_per_pound`) y lo que se cobra al cliente por libra (`client_shipping_charge`). Cada producto y cada entrega tienen una categoría; es obligatoria para recibir y embolsar (INV-002). | `Category` |
| **Orden** (pedido) | Encargo de un cliente, creado por su agente, que agrupa productos. Tiene estado de proceso (`status`) y estado de pago (`pay_status`), costo total (`total_costs`, suma de los productos), efectivo recibido (`received_value_of_client`) y saldo aplicado (`balance_applied`). | `Order` |
| **Producto** | Línea de una orden: artículo de una tienda con cantidad pedida (`amount_requested`) y costo calculado según RN-001. Lleva contadores derivados de sus hijos: `amount_purchased`, `amount_received`, `amount_delivered`, y un estado derivado (RN-010/RN-011). | `Product` |
| **Compra** (recibo de compra) | Acto de comprar en una tienda con una cuenta de compra. Agrupa productos comprados, registra la fecha, la tarjeta, el costo real pagado (`total_cost_of_purchase`) y su estado de pago. | `ShoppingReceip` |
| **Producto comprado** | Cantidad de un producto incluida en una compra (`amount_buyed`) y, si procede, la cantidad reembolsada (`quantity_refuned`). La cantidad comprada neta del producto es la suma de `amount_buyed` menos `quantity_refuned`. | `ProductBuyed` |
| **Reembolso** | Devolución parcial o total de un producto comprado. Reduce la cantidad comprada neta; no borra el producto comprado. | `ProductBuyed.quantity_refuned`, `is_refunded`, `refund_amount` |
| **Paquete** | Bulto físico que llega al almacén desde una agencia o transportista, con número de seguimiento y agencia. Su estado sigue `ES-paquete`. | `Package` |
| **Recepción** (llegada) | Registro de que cierta cantidad de un producto llegó dentro de un paquete (`amount_received`). Exige que el producto tenga categoría. | `ProductReceived` |
| **Bolsa** | Entrega en preparación: una `DeliverReceip` con `status = Pendiente` y `weight = 0`, sin pagos, que agrupa por cliente y categoría las unidades recibidas todavía no pesadas. Se crea sola al registrar la primera llegada de ese cliente y categoría y se borra sola si queda vacía (INV-003). No existe una tabla propia: la bolsa se deriva de estado + peso. | `DeliverReceip` (`Pendiente`, `weight = 0`) |
| **Entrega** (recibo de entrega) | Conjunto de unidades que se entregan juntas a un cliente. Nace como bolsa; al pesarla deja de ser bolsa y sigue `ES-entrega` hasta `Entregado` o `Fallida`. Tiene costo por peso (`weight_cost`), comisión del gestor (`manager_profit`), estado de pago, efectivo cobrado (`payment_amount`) y saldo aplicado (`balance_applied`). | `DeliverReceip` |
| **Producto entregado** | Cantidad de un producto incluida en una entrega (`amount_delivered`). Existe desde que la unidad entra en la bolsa. | `ProductDelivery` |
| **Pesado** | Acción de registrar el peso real de una bolsa. Fija `weight`, calcula `weight_cost` (RN-002) y `manager_profit` (RN-003) y cierra la bolsa: ya no admite llegadas automáticas. Solo se pesa una vez, salvo re-pesado por un administrador (INV-004). | `DeliverReceip.weight` |
| **Despacho** | Transición de la entrega pesada a `En transito`: la mercancía sale hacia el cliente. | `DeliverReceip.status = En transito` |
| **Entrega final** | Transición a `Entregado`, con fecha (`deliver_date`) y foto opcional (`deliver_picture`). Es el único momento en que las unidades cuentan como entregadas para el estado del producto (RN-011). | `DeliverReceip.status = Entregado` |
| **Cobro** | Registro de dinero recibido del cliente por una orden (`received_value_of_client`) o por una entrega (`payment_amount`). Los cobros son acumulativos: cada cobro suma al anterior. | `Order.add_received_value`, `DeliverReceip.add_payment_amount` |
| **Saldo aplicado** | Parte de una deuda cubierta con saldo a favor del cliente en lugar de efectivo. Cuenta para el estado de pago (RN-020) pero no para el balance (RN-021), porque ese dinero ya se contó cuando entró como sobrepago. | `Order.balance_applied`, `DeliverReceip.balance_applied` |
| **Balance del cliente** | Saldo acumulado: efectivo recibido menos costos de órdenes y entregas (RN-021). Positivo es saldo a favor; negativo es deuda. | `CustomUser.balance` |
| **Estado de pago** | `No pagado`, `Parcial` o `Pagado`, derivado de costo, efectivo y saldo aplicado (RN-020). Aplica a orden, entrega y compra. | `Order.pay_status`, `DeliverReceip.payment_status`, `ShoppingReceip.status_of_shopping` |
| **Factura** | Costo del transportista por un período o embarque; gasto del sistema, no del cliente. | `Invoice` |
| **Gasto** | Salida de dinero del negocio no ligada a una entrega concreta. | `Expense` |
| **Ganancia del sistema en una entrega** | `weight_cost − manager_profit − peso × shipping_cost_per_pound`. Solo informativa; no altera estados ni balances. | Propiedad `DeliverReceip.system_delivery_profit` |
