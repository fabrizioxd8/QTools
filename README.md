# QTools - Sistema Profesional de Gestión de Pañol de Herramientas

<p align="center">
  <img src="public/logo.png" alt="QTools Logo" width="150"/>
</p>

<p align="center">
  <strong>Optimiza las operaciones de herramientas con seguimiento en tiempo real, flujos de trabajo automatizados y reportes completos.</strong>
</p>

---

## Resumen Ejecutivo

QTools es un **sistema de gestión de inventario de herramientas listo para producción**, diseñado para eliminar la pérdida de herramientas, reducir el tiempo de inactividad y mejorar la eficiencia operativa en entornos industriales. Construido con tecnologías web modernas, proporciona visibilidad en tiempo real de la ubicación de las herramientas, patrones de uso y calendarios de mantenimiento.

### Valor para el Negocio
- **Reduce la Pérdida de Herramientas:** Rastrea cada herramienta desde su salida hasta su devolución.
- **Minimiza el Tiempo de Inactividad:** Visibilidad instantánea de la disponibilidad y ubicación de las herramientas.
- **Decisiones Basadas en Datos:** Reportes y análisis completos.
- **Flujos de Trabajo Optimizados:** Procesos automatizados de salida y entrada.
- **Acceso Multi-dispositivo:** Funciona en celulares, tabletas y computadoras.
- **Seguro y Confiable:** Despliegue en red local con encriptación HTTPS.

---

## Características Principales

### **Panel de Control en Tiempo Real**
- Vista general instantánea del estado del inventario de herramientas.
- Alertas de calibración y recordatorios de mantenimiento.
- Métricas clave de rendimiento y tendencias.
- Acceso rápido a operaciones críticas.

### **Gestión Completa de Herramientas**
- Catálogo digital de herramientas con fotos y especificaciones.
- **Opciones de Vista Flexibles:** Cambia entre vista de cuadrícula y lista con densidad de columnas personalizable (2, 3 o 4 columnas).
- **Ordenamiento Avanzado:** Haz clic en los encabezados de las tablas para ordenar por nombre, categoría o estado con retroalimentación visual.
- Atributos personalizados para un seguimiento detallado (números de serie, fechas de compra, etc.).
- Seguimiento de estado (Disponible, En Uso, Dañado, Perdido, Requiere Calibración).
- Programación de mantenimiento y calibración.

### **Integración de Personal y Proyectos**
- Perfiles de trabajador con historial de asignaciones e íconos de usuario genéricos para consistencia visual.
- Asignación de herramientas por proyecto con íconos de carpeta para fácil identificación.
- **Ordenamiento Intuitivo de Tablas:** Haz clic en los encabezados de las columnas para ordenar trabajadores y proyectos.
- Seguimiento del rendimiento y responsabilidades.
- Análisis de la distribución de la carga de trabajo.

### **Sistema de Despacho Inteligente**
- Proceso de despacho guiado en 4 pasos.
- Listo para códigos de barras/QR (mejora futura).
- Actualizaciones automáticas de estado.
- Prevención de errores y validación.

### **Reportes Avanzados**
- Registros de actividad y auditorías.
- Estado del inventario por categoría.
- Patrones y tendencias de uso.
- Capacidades de exportación para análisis externo.
- Reportes de calibración y mantenimiento.

### **Arquitectura Lista para la Red**
- Acceso desde cualquier dispositivo en tu red.
- Sincronización en tiempo real entre todos los usuarios.
- Comunicación segura con HTTPS.
- Capacidad de funcionar sin conexión con sincronización automática.

---

## Guía de Inicio Rápido

### Para Personal de TI/Instalación

1. **Install Prerequisites:**
   - Download and install [Node.js](https://nodejs.org/) (v18 or later)

2. **Setup Application:**
2. **Configurar la Aplicación:**
   ```bash
   # Clonar y configurar
   git clone <url-del-repositorio>
   cd QTools
   npm install
   
   # Configurar certificados SSL (una sola vez)
   npm run setup-certs # En Windows, puede que necesites ejecutar esto como administrador
   
   # Iniciar el sistema
   npm start
   ```

3. **Acceso en la Red:**
   - **Localmente:** `https://localhost:8082`
   - **En la red:** `https://[ip-del-servidor]:8082`
   - Comparte la URL de la red con todos los usuarios.

### Para Usuarios Finales
- Simplemente navega a la URL proporcionada en cualquier dispositivo.
- No se requiere instalación, funciona en cualquier navegador web moderno.
- Acepta el certificado de seguridad cuando se te solicite (una sola vez).

---

## Soporte Multi-dispositivo

QTools funciona sin problemas en todos los dispositivos:

- **Computadoras de Escritorio:** Acceso a todas las funciones con optimización para pantallas grandes.
- **Celulares:** Interfaz optimizada para uso en campo.
- **Tabletas:** Perfectas para quioscos en el pañol y estaciones de trabajo móviles.
- **Laptops:** Ideales para supervisores y gerentes.

---

## Seguridad y Confiabilidad

- **Encriptación HTTPS:** Toda la transmisión de datos está encriptada.
- **Solo Red Local:** No se requiere conexión a internet.
- **Copias de Seguridad Automáticas:** La base de datos guarda todos los cambios automáticamente.
- **Sincronización en Tiempo Real:** Todos los dispositivos ven las actualizaciones de inmediato.
- **Registro de Auditoría:** Historial completo de todas las acciones.

---

## Hoja de Ruta

### **Fase 1: Sistema Central (Actual)**
- Gestión de inventario de herramientas.
- Seguimiento de trabajadores y proyectos.
- Flujo básico de despacho y devolución.
- Reportes y análisis.
- Acceso multi-dispositivo.

### **Fase 2: Funcionalidades Mejoradas (Planeado)**
- Autenticación de usuarios y permisos basados en roles.
- Escaneo de códigos de barras/QR.
- Reportes y paneles de control avanzados.
- Desarrollo de aplicación móvil.
- Integración con sistemas existentes.

### **Fase 3: Funcionalidades Empresariales (Futuro)**
- Opciones de despliegue en la nube.
- Integraciones vía API.
- Análisis avanzado e insights con IA.
- Automatización de la programación de mantenimiento.
- Integración con la cadena de suministro.

---

## ¿Por qué QTools?

### **Desafíos Actuales que Resuelve:**
-  **Pérdida de Herramientas:** "¿Dónde está ese torquímetro tan caro?"
-  **Tiempo de Inactividad:** "¿Quién tiene el multímetro que necesito?"
-  **Papeleo:** Registros manuales y hojas de cálculo.
-  **Rendición de Cuentas:** "¿Quién fue la última persona en usar esto?"
-  **Mantenimiento:** Fechas de calibración vencidas.

### **Soluciones de QTools:**
- **Seguimiento en Tiempo Real:** Sabe exactamente dónde está cada herramienta.
- **Disponibilidad Instantánea:** Ve qué está disponible antes de ir al pañol.
- **Registros Digitales:** Registro e historial automáticos.
- **Responsabilidad Total:** Registro de auditoría completo de todas las actividades.
- **Mantenimiento Proactivo:** Recordatorios automáticos de calibración.

---

## Soporte y Capacitación

- **Guía de Flujo de Trabajo:** Guía de Flujo de Trabajo del Usuario para movimientos paso a paso en la UX.
- **Guía de Usuario:** Guía completa para operaciones diarias.
- **Materiales de Capacitación:** Tutoriales paso a paso (próximamente).
- **Soporte Técnico:** Guía de despliegue y solución de problemas para TI.
- **Mejores Prácticas:** Flujos de trabajo y procedimientos recomendados.

---

## Próximos Pasos

1. **Revisar el sistema** con tu equipo.
2. **Programar una demostración** para los interesados clave.
3. **Planificar el cronograma** de despliegue.
4. **Identificar usuarios piloto** para el lanzamiento inicial.
5. **Preparar materiales de capacitación** para tus flujos de trabajo específicos.

---

**QTools transforma tu almacén de herramientas de un centro de costos a un activo estratégico, proporcionando la visibilidad y el control necesarios para las operaciones industriales modernas.**