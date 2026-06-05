# Bricker Finance Lab

Aplicación web profesional basada en `Formulario Bricker - Examen Completo Simple.xlsx`.

La app no depende del Excel para calcular en tiempo real. El Excel se usa como referencia para extraer hojas, fórmulas, posibles entradas y resultados mediante `scripts/analyzeExcel.py`. La lógica se implementa en TypeScript dentro de `src/lib/calculators`.

## Comandos

```bash
npm install
npm run analyze:excel
npm run validate:calculators
npm run lint
npm run build
npm run dev
```

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `bricker-finance-lab`.
2. Sube este proyecto a la rama `main`.
3. En GitHub ve a `Settings > Pages`.
4. En `Build and deployment`, selecciona `GitHub Actions`.
5. Haz push a `main`; el workflow `.github/workflows/deploy-pages.yml` construye y publica la app.

La app usa `base: "./"` en Vite para funcionar correctamente en GitHub Pages aunque el repo esté publicado como subcarpeta.

## Temas Soportados

- Swap de tasas simple
- Formulario general de swap
- Precio teórico futuro / FRA básico
- Perfil de pagos sin prima
- Perfil de pagos con prima
- Precio futuro de acción
- Precio futuro de commodity
- Forward de divisas
- Forward de tasas de interés
- Tasas alambradas
- Calculadora FRA
- Opciones y griegas
- Swaps / ventaja comparativa
- Derivados sintéticos

## Estructura

```text
src/
  components/
  data/
    topics.ts
    excelMap.ts
    excelExtract.json
  lib/
    calculators/
    validation.ts
    formatters.ts
scripts/
  analyzeExcel.py
  validateCalculators.ts
```

## Cómo Agregar Más Temas

1. Agrega el tema en `src/data/excelMap.ts` con `id`, campos de entrada y outputs.
2. Crea o extiende una función en `src/lib/calculators/`.
3. Registra la función en `src/lib/calculators/index.ts` usando el mismo `id`.
4. Agrega un caso de prueba a `scripts/validateCalculators.ts`.

## Notas de Revisión Manual

- La extracción del Excel identifica fórmulas y celdas amarillas/verdes, pero algunas hojas originales no marcan inputs con color consistente. Por eso el mapa final combina extracción automática con lectura manual de fórmulas principales.
- La calculadora FRA implementa la liquidación estándar de FRA. La hoja `Calculadora FRA` del Excel incluye una curva TIIE más extensa; si se requiere replicar cada periodo exacto de esa hoja, hay que agregar un módulo de curva completo.
- Black-Scholes usa aproximación numérica de la normal estándar acumulada, suficiente para examen y validación educativa.
