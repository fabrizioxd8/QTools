# Guía de Flujo de Trabajo y Experiencia de Usuario de QTools

Este documento detalla los movimientos paso a paso de la experiencia de usuario (UX) para las operaciones principales dentro de QTools. Sirve como un manual para los usuarios que interactúan con el sistema.

---

## 1. Despacho de Herramientas (Asistente de Despacho)

**Escenario:** Un trabajador necesita retirar herramientas para un proyecto específico.

**Movimientos de UX:**
1.  **Navegar a Despacho:** Haz clic en el enlace **"Despacho"** en la barra lateral izquierda o en la acción rápida "Despachar Herramientas" en el Inicio.
2.  **Paso 1: Seleccionar Herramientas**
    *   *Acción:* Usa la barra de búsqueda (Ctrl+F) para encontrar herramientas por nombre o categoría.
    *   *Acción:* Haz clic en las tarjetas de las herramientas para seleccionarlas. La tarjeta se resaltará con un borde de color primario.
    *   *Acción:* Para ítems a granel, usa los botones `+` y `-` que aparecen en la tarjeta para ajustar la cantidad requerida.
    *   *Acción:* Haz clic en **Siguiente**.
3.  **Paso 2: Seleccionar Trabajador**
    *   *Acción:* Busca al trabajador por nombre o N° de Empleado.
    *   *Acción:* Haz clic en el botón de radio o en la tarjeta del trabajador para asignarle las herramientas.
    *   *Acción:* Haz clic en **Siguiente**.
4.  **Paso 3: Seleccionar Proyecto**
    *   *Acción:* Busca el proyecto de destino.
    *   *Acción:* Selecciona la tarjeta del proyecto.
    *   *Acción:* Haz clic en **Siguiente**.
5.  **Paso 4: Revisar y Confirmar**
    *   *Acción:* Revisa el resumen de las herramientas seleccionadas, el trabajador y el proyecto.
    *   *Acción:* (Opcional) Ajusta la fecha y hora de despacho si estás registrando un evento pasado.
    *   *Acción:* (Opcional) Ingresa un "Número de guía" y cualquier nota de despacho relevante.
    *   *Acción:* Haz clic en **Confirmar Despacho**.
6.  **Resultado:** Aparece una notificación de éxito y eres redirigido automáticamente a la página de Asignaciones Activas.

---

## 2. Devolución de Herramientas

**Escenario:** Un trabajador está devolviendo herramientas que retiró previamente.

**Movimientos de UX:**
1.  **Navegar a Asignaciones:** Haz clic en **"Asignaciones"** en la barra lateral izquierda.
2.  **Localizar Asignación:** Encuentra la asignación activa en la lista. Puedes identificar rápidamente las asignaciones vencidas por sus insignias de advertencia rojas.
3.  **Iniciar Devolución:** Haz clic en el botón **"Registrar Devolución"** en la tarjeta de la asignación específica.
4.  **Revisar Condiciones de Herramientas (Diálogo Modal):**
    *   *Acción:* Para cada herramienta, verás campos de entrada para cantidades en cuatro categorías: **Bueno**, **Faltante**, **Dañado** y **Perdido**.
    *   *Acción:* Por defecto, todas las herramientas están marcadas como "Bueno". Si una herramienta se devuelve dañada o falta, ajusta los números correspondientemente (p. ej., cambia Bueno a 0 y Dañado a 1).
    *   *Validación:* El sistema se asegura de que las cantidades totales coincidan con el número original despachado. Mostrará una advertencia si los números no cuadran.
5.  **Finalizar Detalles:**
    *   *Acción:* Confirma la Fecha y Hora de Devolución.
    *   *Acción:* Agrega cualquier Nota de Devolución (p. ej., "La batería del taladro no retiene la carga").
6.  **Enviar:** Haz clic en **Confirmar Devolución**.
7.  **Resultado:** Aparece una notificación de éxito. La asignación se mueve a la pestaña "Completadas" y los estados de las herramientas se actualizan en el inventario (p. ej., "Disponible", "Dañado" o "Perdido").

---

## 3. Creación y Gestión de Herramientas

**Escenario:** El encargado del pañol recibe una nueva herramienta y necesita agregarla al sistema.

**Movimientos de UX:**
1.  **Navegar a Herramientas:** Haz clic en **"Gestión de Herramientas"** en la barra lateral.
2.  **Iniciar Creación:** Haz clic en el botón **"Agregar Herramienta"** en la esquina superior derecha.
3.  **Información Básica (Diálogo Modal):**
    *   *Acción:* Ingresa el **Nombre de la Herramienta** (p. ej., "Taladro Percutor DeWalt").
    *   *Acción:* Selecciona una **Categoría** del menú desplegable.
    *   *Acción:* Establece el **Estado** (por defecto es Disponible).
    *   *Acción:* Establece la **Cantidad** (si es un ítem a granel).
4.  **Configuración de Calibración:**
    *   *Acción:* Si la herramienta requiere calibración, marca la casilla **"Requiere Calibración"**.
    *   *Acción:* Selecciona la **Fecha de Vencimiento de Calibración** e ingresa el **N° de Certificado**.
5.  **Atributos Personalizados (Opcional):**
    *   *Acción:* Selecciona un tipo de atributo (Marca, Modelo, N° de Serie) o elige "Personalizado".
    *   *Acción:* Ingresa el valor (p. ej., "DCD996B").
    *   *Acción:* Haz clic en el botón **`+`** para agregar el atributo a la lista. Puedes arrastrar y soltar para reordenar estos atributos.
6.  **Subir Imagen:**
    *   *Acción:* En la columna derecha, arrastra y suelta un archivo de imagen, haz clic para buscar o pega una URL de imagen para identificar visualmente la herramienta.
7.  **Enviar:** Haz clic en **Agregar Herramienta**.
8.  **Resultado:** El diálogo se cierra, aparece una notificación de éxito y la nueva herramienta es visible inmediatamente en la vista de cuadrícula/lista.

---

## 4. Gestión de Personal y Proyectos

**Escenario:** Agregar un nuevo empleado al sistema para que pueda retirar herramientas.

**Movimientos de UX:**
1.  **Navegar a Personal y Proyectos:** Haz clic en **"Personal y Proyectos"** en la barra lateral.
2.  **Iniciar Creación:** Asegúrate de estar en la pestaña "Personal", luego haz clic en **"Agregar Personal"**.
3.  **Ingresar Detalles (Diálogo Modal):**
    *   *Acción:* Ingresa el **Nombre del Trabajador**.
    *   *Acción:* Ingresa su **N° de Empleado** único.
4.  **Enviar:** Haz clic en **Agregar Personal**.
5.  **Proyectos:** El proceso es idéntico para los proyectos: cambia a la pestaña "Proyectos", haz clic en "Agregar Proyecto", ingresa el nombre y guarda.

---

## 5. Generación y Exportación de Reportes

**Escenario:** Un supervisor necesita revisar la actividad de las herramientas de los últimos 30 días y compartirla con la gerencia.

**Movimientos de UX:**
1.  **Navegar a Reportes:** Haz clic en **"Reportes"** en la barra lateral.
2.  **Ajustar Filtros:**
    *   *Acción:* Haz clic en **"Filtros Avanzados"** para expandir las opciones de rango de fechas.
    *   *Acción:* Selecciona "Últimos 30 días" del menú desplegable predefinido, o elige fechas de Inicio y Fin personalizadas.
    *   *Resultado:* Los gráficos, las tarjetas de resumen y la tabla de registro de actividad se actualizan instantáneamente para reflejar el período de tiempo elegido.
3.  **Exportar Datos:**
    *   *Acción:* Haz clic en **"Opciones de Exportación"** en la esquina superior derecha.
    *   *Acción:* Selecciona **"Exportar PDF"** para generar un reporte visual formateado para imprimir o enviar por correo electrónico.
    *   *Acción:* Alternativamente, para exportar los datos brutos del inventario a Excel, navega a **Gestión de Herramientas** y haz clic en **"Exportar a Excel"**.

---
*Consejo: Usa el atajo `Ctrl+F` en cualquier parte de la aplicación para enfocar instantáneamente la barra de búsqueda principal de la página en la que te encuentras.*