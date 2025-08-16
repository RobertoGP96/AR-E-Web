from enum import Enum

class OrderStatusEnum(str, Enum):
    ENCARGADO = "Encargado"
    PROCESANDO = "Procesando"
    COMPLETADO = "Completado"
    CANCELADO = "Cancelado"

class PaymentStatusEnum(str, Enum):
    NO_PAGADO = "No pagado"
    PAGADO = "Pagado"
    PARCIAL = "Parcial"
