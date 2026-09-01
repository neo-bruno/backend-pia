# PIA Backend

Backend modular para PIA.

## Arquitectura

Cada módulo sigue:

Routes -> Controller -> Service -> Repository

y dispone además de Validation.

Capas transversales:

- config
- database
- middlewares
- utils
- constants
- routes

## Regla importante

La autorización tendrá dos niveles:

1. Rol: middleware de autorización.
2. Contexto/recurso: reglas de negocio dentro de Service.

No se crean módulos separados por rol.
