# FLOKAM Dermarket

Sitio independiente para iniciar un marketplace de productos FLOKAM.

Páginas incluidas:

- `index.html`: formulario de datos de entrega y pago.
- `catalogo-q24.html`: productos FLOKAM y catálogos externos en una sola pestaña.
- `producto.html`: redirección a la pestaña unificada de productos.
- `guia-capilar.html`: referencias y detalles por producto.
- `carrito.html`: carrito local con pedido por WhatsApp.
- `contacto.html`: datos de contacto, ubicación y mapa.

Datos privados:

- Los costos internos no se cargan en la página pública.
- La copia local de costos Q24 queda fuera del sitio, en `C:\flokam-dermarket-private\q24-costos-internos.json`.
- Los datos del comprador se guardan en `localStorage` del navegador y se adjuntan automáticamente al mensaje de WhatsApp.
- Si el carrito intenta enviarse sin datos completos, el flujo redirige a `index.html#datos-comprador` y vuelve a permitir el envío al completar el formulario.
