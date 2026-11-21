# Propuesta: cinco artículos nuevos para el blog

Solo es una propuesta de estructura. **Anny escribe los textos.** Los 17 artículos
actuales (2013–2021, montaña y fe) se quedan como están.

## Por qué

Hoy el blog no habla de nada de lo que Anny atiende en consulta. Cuando alguien
le pregunta a ChatGPT, Gemini o Google «qué hago con los ataques de pánico» o
«mi hijo tiene rabietas», el sitio no tiene una página que responda, así que no
aparece. Cada artículo de esta propuesta responde **una** pregunta concreta que
la gente hace, con la voz de Anny, y lleva al servicio que corresponde.

## Dónde van

- **URL:** `/blog/<slug>/`, igual que los artículos actuales. Así
  `herramientas/sitemap.mjs` los recoge solos.
- **Sección nueva en `/blog/`:** un grupo más en la página del blog, igual que
  «La montaña como maestra» o «Fe», encima de los escritos personales. Nombre
  propuesto: **«Para entender lo que te pasa»** (alternativas: «Psicología en
  palabras sencillas», «Preguntas de consulta»).
- **Texto de entrada del blog:** hoy dice que son escritos personales y no
  artículos clínicos. Con la sección nueva habría que matizarlo; la redacción
  la decide Anny.
- **Enlaces de vuelta:** cada página de servicio puede enlazar a su artículo
  (por ejemplo, Terapia individual → ataques de pánico y duelo).

## Plantilla

`herramientas/plantilla-articulo.html`: el mismo diseño de un artículo actual,
con la estructura marcada. Para usarla:

1. Copiarla a `blog/<slug>/index.html`.
2. Reemplazar todo lo que está en MAYÚSCULAS o con «…», incluido el JSON-LD.
3. Cambiar `noindex` por `index, follow, max-image-preview:large`.
4. Añadir la tarjeta del artículo en `blog/index.html` y en el bloque `Blog`
   (`blogPost`) del JSON-LD de esa misma página.
5. Correr `node herramientas/sitemap.mjs` y `node herramientas/revisa.mjs`.

Estructura de cada artículo:

| Parte | Para qué |
|---|---|
| Título en forma de pregunta o de búsqueda real | Es lo que la gente escribe o le pregunta a un asistente |
| Respuesta corta (2–3 frases) | Lo que un buscador o un asistente de IA cita |
| Qué es | Explicado como en la primera sesión |
| Cómo saber si te está pasando | Señales concretas, en lista |
| Qué puedes hacer mientras tanto | Dos o tres cosas útiles sin terapia |
| Cuándo pedir ayuda | Mismo tono que los recuadros de los servicios |
| Cómo lo trabajamos en consulta | Enlace al servicio |
| Preguntas (opcional) | Mismo componente `<details>` de la portada, con su FAQPage |
| Sobre quien escribe + aviso de urgencias (911) | Autoría y seguridad |

Extensión orientativa: 700–1.200 palabras. Fecha visible y `dateModified` al día
cada vez que se revise.

## Los cinco artículos

### 1. Ataques de pánico
- **Título:** Ataque de pánico: qué es, cómo reconocerlo y qué hacer cuando llega
- **Slug:** `/blog/ataques-de-panico/`
- **Servicio:** Terapia individual (ansiedad)
- **Preguntas que debería responder:** ¿cómo sé si es un ataque de pánico y no
  un problema del corazón? ¿Cuánto dura? ¿Qué hago en el momento? ¿Se puede
  curar? ¿Cuándo ir a emergencias?

### 2. Duelo
- **Título:** El duelo no tiene plazo: cómo saber si necesitas ayuda para atravesarlo
- **Slug:** `/blog/duelo/`
- **Servicio:** Terapia individual (duelo)
- **Preguntas:** ¿es normal seguir así después de meses? ¿Hay etapas? ¿Cuándo
  el duelo se estanca? ¿Cómo acompañar a alguien en duelo?

### 3. Rabietas en niños
- **Título:** Berrinches y rabietas en niños: qué hay detrás y cómo acompañarlos en casa
  (lleva las dos palabras porque en Ecuador se dice «berrinche» y en buscadores se escribe mucho «rabieta»)
- **Slug:** `/blog/berrinches-y-rabietas/`
- **Servicio:** Psicología infantil
- **Preguntas:** ¿a qué edad son normales? ¿Qué hago en plena rabieta? ¿Cuándo
  dejan de ser normales? ¿Qué papel tiene la familia?

### 4. Autoestima
- **Título:** Autoestima: cuando tu valor depende de lo que opinen los demás
- **Slug:** `/blog/autoestima/`
- **Servicio:** Terapia individual (autoestima); también Habilidades sociales
- **Preguntas:** ¿cómo sé si tengo baja autoestima? ¿De dónde viene? ¿Se puede
  trabajar de adulto? ¿Qué tiene que ver con poner límites?

### 5. Orientación vocacional
- **Título:** No sé qué estudiar: cómo elegir carrera con criterio propio
- **Slug:** `/blog/no-se-que-estudiar/`
- **Servicio:** Orientación vocacional
- **Preguntas:** ¿sirven los tests vocacionales? ¿Qué hago si mi familia quiere
  otra carrera? ¿Y si ya empecé y no me gusta? ¿Es tarde para cambiar a los treinta?

## Cuidado con

- No prometer resultados ni plazos; el sitio ya evita hacerlo.
- No dar pautas que sustituyan una consulta; cerrar siempre con «cuándo pedir ayuda».
- Si se nombra un enfoque (por ejemplo TCC), que sea el que Anny confirme
  (sigue pendiente en las páginas de servicio).
