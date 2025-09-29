# TornamesaPrototipo

Este es un Reproductor de Audio Web interactivo que simula una tornamesa física con una interfaz visual y animaciones realistas. 
El proyecto está construido enteramente con HTML, CSS puro, y JavaScript vainilla.

#Características Técnicas Clave:
  Gestión Dinámica de Archivos (UX): Implementa la funcionalidad Drag-and-Drop (arrastrar y soltar), permitiendo a los usuarios cargar archivos de audio locales (MP3, OGG, etc.) de forma dinámica, construyendo la lista de reproducción en tiempo real.
  Visualización de Datos y Animación: Sincroniza las animaciones CSS con el estado de reproducción de JavaScript, incluyendo:
    Disco Realista: El plato rota cuando se activa la reproducción (@keyframes spin), y presenta surcos logrados mediante la técnica avanzada de múltiples box-shadow: inset.
    Brazo Interactiva: El brazo (aguja) se mueve automáticamente para caer sobre el disco y comenzar la reproducción.
    Onda de Audio: Visualización dinámica de la onda y barra de audio, así como una barra de progres para representar el timeline de la pista.
  Diseño Responsivo Complejo: La interfaz completa, incluido el disco y el brazo con sus proporciones críticas, se adapta perfectamente a diferentes tamaños de pantalla (desde escritorio hasta móvil, utilizando múltiples @media queries) manteniendo la estética funcionalidad.

#Propósito del Proyecto:
Demostrar la capacidad de construir una experiencia de usuario inmersiva y visualmente rica utilizando fundamentos web puros, enfocándose en la sincronización precisa de las animaciones con eventos de audio y la gestión de archivos locales.
