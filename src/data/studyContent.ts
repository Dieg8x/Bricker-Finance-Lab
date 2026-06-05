import type { ExamQuestion } from "../lib/types";

export const glossary = [
  { term: "Subyacente", definition: "Activo del que depende el valor del derivado: divisa, acción, commodity, tasa, índice o bono." },
  { term: "Strike", definition: "Precio pactado de ejercicio o referencia del contrato." },
  { term: "Prima", definition: "Precio que paga el comprador de una opción para tener el derecho de ejercerla." },
  { term: "OTC", definition: "Mercado extrabursátil privado, flexible y negociado entre contrapartes." },
  { term: "Cámara de compensación", definition: "Entidad que reduce riesgo de contraparte en mercados estandarizados y asegura liquidación." },
  { term: "Margen inicial", definition: "Garantía mínima requerida para abrir una posición en futuros." },
  { term: "Margin call", definition: "Llamada para aportar recursos cuando la garantía cae por pérdidas o variación del mercado." },
  { term: "Posición larga", definition: "Compra o exposición que se beneficia si sube el subyacente." },
  { term: "Posición corta", definition: "Venta o exposición que se beneficia si baja el subyacente." },
  { term: "In the money", definition: "Contrato con valor económico favorable si se ejerce." },
  { term: "Out of the money", definition: "Contrato sin valor económico favorable al ejercicio." },
  { term: "VPN", definition: "Valor presente neto de flujos descontados." },
];

export const coverageGuide = [
  {
    exposure: "Tengo posición corta en el subyacente y temo que suba el precio.",
    hedge: "Tomar posición larga en futuro/forward o comprar call.",
    reason: "Si el precio sube, la cobertura gana y compensa la pérdida del subyacente.",
  },
  {
    exposure: "Tengo posición larga en el subyacente y temo que baje el precio.",
    hedge: "Tomar posición corta en futuro/forward o comprar put.",
    reason: "Si el precio baja, la cobertura gana y compensa la pérdida del activo.",
  },
  {
    exposure: "Necesito comprar dólares en el futuro.",
    hedge: "Comprar forward de divisas o usar call sobre dólar.",
    reason: "Fija o limita el tipo de cambio de compra.",
  },
  {
    exposure: "Recibiré dólares y temo que bajen.",
    hedge: "Vender forward de divisas o comprar put sobre dólar.",
    reason: "Protege el valor en moneda local de los dólares por recibir.",
  },
];

export const globalQuestions: ExamQuestion[] = [
  {
    question: "¿Cuál es la diferencia central entre forward y futuro?",
    answer: "El forward es privado y flexible en mercado OTC; el futuro es estandarizado, bursátil y compensado por cámara.",
    explanation: "Ambos fijan precio futuro, pero difieren en estandarización, liquidez, riesgo de contraparte y liquidación.",
  },
  {
    question: "¿Qué derivado cubre a una empresa que quiere comprar un subyacente y teme que suba?",
    answer: "Una posición larga en futuro/forward o una opción call comprada.",
    explanation: "La cobertura gana cuando el subyacente sube, compensando el mayor costo de compra.",
  },
  {
    question: "¿Qué mide Delta en opciones?",
    answer: "El cambio esperado en la prima ante un cambio de una unidad en el subyacente.",
    explanation: "Delta aproxima sensibilidad directa al precio del activo subyacente.",
  },
  {
    question: "¿Qué mide Vega?",
    answer: "El cambio de la prima ante cambios en volatilidad.",
    explanation: "Si aumenta la volatilidad, usualmente sube el valor de opciones compradas.",
  },
  {
    question: "¿Para qué sirve un swap de tasa fija por variable?",
    answer: "Para intercambiar flujos de interés y transformar exposición de tasa fija a variable o viceversa.",
    explanation: "Se usa como cobertura a la medida, especialmente en financiamientos.",
  },
  {
    question: "¿Qué significa +A = +C - P?",
    answer: "Un largo en subyacente sintético se replica comprando call y vendiendo put.",
    explanation: "Es una identidad de derivados sintéticos derivada de la paridad put-call.",
  },
];
