import { useMemo, useState } from "react";
import { DynamicForm } from "./components/DynamicForm";
import { ExamModeExplanation } from "./components/ExamModeExplanation";
import { FormulaBox } from "./components/FormulaBox";
import { GlossaryPanel } from "./components/GlossaryPanel";
import { ResultCard } from "./components/ResultCard";
import { StepByStep } from "./components/StepByStep";
import { StudyPanel } from "./components/StudyPanel";
import { TopicCard } from "./components/TopicCard";
import { BanxicoPanel } from "./components/BanxicoPanel";
import { PayoffChart } from "./components/PayoffChart";
import { topics } from "./data/topics";
import { calculators } from "./lib/calculators";
import type { CalculationInput, CalculationResult, TopicDefinition } from "./lib/types";
import type { ActiveRates } from "./lib/banxico";

function defaultsFor(topic: TopicDefinition): CalculationInput {
  return Object.fromEntries(topic.inputs.map((input) => [input.key, input.defaultValue]));
}

function resultText(topic: TopicDefinition, result: CalculationResult | null): string {
  if (!result) return "";
  return [
    `Tema: ${topic.title}`,
    `Fórmula: ${result.formula}`,
    `Interpretación: ${result.interpretation}`,
    `Explicación: ${result.examExplanation}`,
  ].join("\n");
}

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState<TopicDefinition | null>(null);
  const [values, setValues] = useState<CalculationInput>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [examMode, setExamMode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeRates, setActiveRates] = useState<ActiveRates | null>(null);

  const groupedTopics = useMemo(() => {
    return topics.reduce<Record<string, TopicDefinition[]>>((groups, topic) => {
      groups[topic.category] = groups[topic.category] ?? [];
      groups[topic.category].push(topic);
      return groups;
    }, {});
  }, []);

  function selectTopic(topic: TopicDefinition) {
    setSelectedTopic(topic);
    setValues(defaultsFor(topic));
    setResult(null);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function calculate() {
    if (!selectedTopic) return;
    const calculator = calculators[selectedTopic.id];
    if (!calculator) return;
    setResult(calculator(values));
    setCopied(false);
  }

  async function copyResult() {
    if (!selectedTopic || !result) return;
    await navigator.clipboard.writeText(resultText(selectedTopic, result));
    setCopied(true);
  }

  function resetCurrent() {
    if (!selectedTopic) return;
    setValues(defaultsFor(selectedTopic));
    setResult(null);
    setCopied(false);
  }

  if (!selectedTopic) {
    return (
      <main className="min-h-screen px-5 py-8 md:px-8">
        <section className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand">Bricker Finance Lab</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-ink md:text-5xl">Elige el tema que quieres resolver</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                App basada en el Excel Formulario Bricker. Cada módulo pide solo los datos necesarios, calcula el resultado y explica el procedimiento como estudiante.
              </p>
            </div>
            <div className="flex items-center gap-4 no-print">
              <BanxicoPanel onRatesFetched={setActiveRates} />
              <label className="flex w-fit items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <input type="checkbox" checked={examMode} onChange={(event) => setExamMode(event.target.checked)} />
                <span className="text-sm font-bold text-ink">Modo examen</span>
              </label>
            </div>
          </header>

          <div className="grid gap-8">
            {Object.entries(groupedTopics).map(([category, categoryTopics]) => (
              <section key={category}>
                <h2 className="mb-3 text-xl font-bold text-ink">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {categoryTopics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} onSelect={selectTopic} />
                  ))}
                </div>
              </section>
            ))}
            <GlossaryPanel />
          </div>
        </section>
      </main>
    );
  }

  const formulaHidden = examMode && !result;

  return (
    <main className="min-h-screen px-5 py-6 md:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="no-print mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <button type="button" className="mb-3 text-sm font-bold text-brand" onClick={() => setSelectedTopic(null)}>
              ← Volver al menú
            </button>
            <h1 className="text-3xl font-black text-ink">{selectedTopic.title}</h1>
            <p className="mt-1 text-sm text-slate-600">Hoja de referencia: {selectedTopic.sheet}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold">
              <input type="checkbox" checked={examMode} onChange={(event) => setExamMode(event.target.checked)} />
              Modo examen
            </label>
            <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-ink" onClick={resetCurrent}>
              Limpiar
            </button>
            <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-ink" onClick={() => window.print()}>
              Exportar / imprimir
            </button>
            <button
              type="button"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white"
              onClick={copyResult}
              disabled={!result}
            >
              {copied ? "Copiado" : "Copiar resultado"}
            </button>
            <BanxicoPanel onRatesFetched={setActiveRates} />
          </div>
        </header>

        {selectedTopic.inputs.length === 0 ? (
          <StudyPanel topic={selectedTopic} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(340px,440px),1fr]">
            <DynamicForm
              topic={selectedTopic}
              values={values}
              activeRates={activeRates}
              onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
              onSubmit={calculate}
              onReset={resetCurrent}
            />

            <section className="grid gap-5">
            {!result ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
                <p className="text-sm font-bold uppercase tracking-wide text-brand">Esperando datos</p>
                <h2 className="mt-2 text-2xl font-bold text-ink">Captura los campos y presiona Calcular</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {examMode
                    ? "La fórmula se mantiene oculta hasta calcular para simular práctica de examen."
                    : "La fórmula está visible abajo para estudiar antes de calcular."}
                </p>
              </div>
            ) : (
              <>
                {result.warnings.length ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <h3 className="font-bold text-rose-800">Revisa estos datos</h3>
                    <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-rose-800">
                      {result.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {result.metrics.map((metric) => (
                    <ResultCard key={metric.key} metric={metric} />
                  ))}
                </section>
                
                {selectedTopic.id.startsWith("payoff_") && (
                  <PayoffChart topicId={selectedTopic.id} values={values} />
                )}

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h3 className="text-base font-bold text-ink">Interpretación</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{result.interpretation}</p>
                </section>
              </>
            )}

            <FormulaBox formula={result?.formula ?? selectedTopic.outputs[0]?.formula ?? ""} hidden={formulaHidden} />
            {result ? <StepByStep steps={result.steps} /> : null}
            {result ? <ExamModeExplanation explanation={result.examExplanation} /> : null}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
