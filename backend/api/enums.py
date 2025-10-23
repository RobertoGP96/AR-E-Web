from enum import Enum

class OrderStatusEnum(str, Enum):
    ENCARGADO = "Encargado"
    PROCESANDO = "Procesando"
    COMPLETADO = "Completado"
    CANCELADO = "Cancelado"
    
class ProductStatusEnum(str, Enum):
    ENCARGADO = "Encargado"
    COMPRADO = "Comprado"
    RECIBIDO = "Recibido"
    ENTREGADO = "Entregado"

class PaymentStatusEnum(str, Enum):
    NO_PAGADO = "No pagado"
    PAGADO = "Pagado"
    PARCIAL = "Parcial"

class DeliveryStatusEnum(str, Enum):
    PENDIENTE = "Pendiente"
    EN_TRANSITO = "En transito"
    ENTREGADO = "Entregado"
    FALLIDA = "Fallida"
