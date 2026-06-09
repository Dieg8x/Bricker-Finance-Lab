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
import { PayoffTable } from "./components/PayoffTable";
import { FormulaFinder } from "./components/FormulaFinder";
import { HistoryPanel, saveToHistory } from "./components/HistoryPanel";
import { ComparativeAdvantageChart } from "./components/ComparativeAdvantageChart";
import { OptionsGuide } from "./components/OptionsGuide";
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
  const [searchQuery, setSearchQuery] = useState("");

  const groupedTopics = useMemo(() => {
    const filtered = searchQuery.length > 0
      ? topics.filter((t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      : topics;
    return filtered.reduce<Record<string, TopicDefinition[]>>((groups, topic) => {
      groups[topic.category] = groups[topic.category] ?? [];
      groups[topic.category].push(topic);
      return groups;
    }, {});
  }, [searchQuery]);

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
    saveToHistory(selectedTopic.title, selectedTopic.id, "Calculado exitosamente");
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
          <header className="mb-10 text-center mt-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 mb-6 text-sm font-semibold text-brand ring-1 ring-inset ring-brand/20">
              <span>🚀 Herramienta Premium</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-ink md:text-6xl mb-4">
              Bricker Finance <span className="text-brand">Lab</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Laboratorio de derivados financieros y valuación avanzada. Calcula y analiza futuros, opciones, swaps y estrategias combinadas.
            </p>
            <div className="mt-8 flex justify-center items-center gap-4 no-print flex-wrap">
              <BanxicoPanel onRatesFetched={setActiveRates} />
              <label className="flex items-center gap-3 rounded-xl border border-slate-200/60 glass-panel px-5 py-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand" checked={examMode} onChange={(event) => setExamMode(event.target.checked)} />
                <span className="text-sm font-bold text-ink">Modo examen simulación</span>
              </label>
            </div>
          </header>

          <div className="grid gap-6 mb-8">
            <FormulaFinder onSelect={(id) => {
              const topic = topics.find((t) => t.id === id);
              if (topic) selectTopic(topic);
            }} />
            <HistoryPanel onRestore={(id) => {
              const topic = topics.find((t) => t.id === id);
              if (topic) selectTopic(topic);
            }} />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
              <input
                type="text"
                placeholder="Buscar calculadora... (ej. swap, opciones, futuro)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 pl-9 pr-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

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
            {Object.keys(groupedTopics).length === 0 && searchQuery && (
              <div className="text-center py-10 text-slate-500">
                <p className="text-2xl mb-2">🔎</p>
                <p className="text-sm font-medium">No se encontraron resultados para "<span className="text-brand">{searchQuery}</span>"</p>
              </div>
            )}
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
        <header className="no-print mb-8 flex flex-col gap-5 rounded-2xl glass-panel p-6 shadow-glass md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <button type="button" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-dark transition-colors" onClick={() => setSelectedTopic(null)}>
              <span>←</span> Volver al menú
            </button>
            <h1 className="text-3xl font-black text-ink tracking-tight">{selectedTopic.title}</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">Hoja de referencia: <span className="text-slate-700">{selectedTopic.sheet}</span></p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl bg-white/50 border border-slate-200/60 px-4 py-2.5 text-sm font-bold shadow-sm cursor-pointer hover:bg-white/80 transition-colors">
              <input type="checkbox" className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand" checked={examMode} onChange={(event) => setExamMode(event.target.checked)} />
              Modo examen
            </label>
            <button type="button" className="rounded-xl bg-white/50 border border-slate-200/60 px-5 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-white/80 transition-colors" onClick={resetCurrent}>
              Limpiar
            </button>
            <button type="button" className="rounded-xl bg-white/50 border border-slate-200/60 px-5 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-white/80 transition-colors" onClick={() => window.print()}>
              Exportar
            </button>
            <button
              type="button"
              className="rounded-xl bg-brand hover:bg-brand-dark transition-colors px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={copyResult}
              disabled={!result}
            >
              {copied ? "¡Copiado!" : "Copiar resultado"}
            </button>
            <BanxicoPanel onRatesFetched={setActiveRates} />
          </div>
        </header>

        {selectedTopic.id === "options_visual_guide" ? (
          <OptionsGuide />
        ) : selectedTopic.inputs.length === 0 ? (
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
                
                {(selectedTopic.id.startsWith("payoff_") || selectedTopic.id === "option_strategies") && (
                  <PayoffChart topicId={selectedTopic.id} values={values} />
                )}

                {(selectedTopic.id === "ipc_coverage" || selectedTopic.id === "stock_future_coverage" || selectedTopic.id === "commodity_coverage" || selectedTopic.id === "stock_future") && (
                  <PayoffTable topicId={selectedTopic.id} values={values} result={result} />
                )}

                {selectedTopic.id === "comparative_advantage" && (
                  <ComparativeAdvantageChart result={result} />
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
