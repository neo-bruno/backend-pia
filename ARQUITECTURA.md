# Arquitectura inicial PIA

## Módulos por entidad
- rol
- persona
- usuario
- cliente
- negocio
- tipo-profesional
- profesional
- gerente
- gerencia
- profesional-negocio
- horario
- horario-profesional
- slot
- condicion
- servicio
- servicio-condicion
- tipo-promocion
- promocion
- descuento
- reserva
- reprogramacion
- metodo-pago
- membresia
- pago
- archivo
- comprobante
- negocio-archivo
- profesional-archivo
- servicio-archivo
- historial
- segmentacion
- historial-segmentacion
- tipo-calificacion
- calificacion
- ranking
- evaluacion
- ranking-detalle
- reclamo
- notificacion

## Capas por módulo
- routes
- controller
- service
- repository
- validation

## Capas transversales
- config
- database
- middlewares
- utils
- constants
- routes

## Flujo
HTTP -> Route -> Middleware -> Controller -> Service -> Repository -> PostgreSQL

La autorización contextual se resolverá en Service, después de la autorización por rol.
