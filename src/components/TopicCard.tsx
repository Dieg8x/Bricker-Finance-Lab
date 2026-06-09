import type { TopicDefinition } from "../lib/types";

interface Props {
  topic: TopicDefinition;
  onSelect: (topic: TopicDefinition) => void;
}

export function TopicCard({ topic, onSelect }: Props) {
  const levelClass = {
    Básico: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medio: "bg-amber-50 text-amber-700 border-amber-200",
    Avanzado: "bg-rose-50 text-rose-700 border-rose-200",
  }[topic.difficulty];

  return (
    <article className="group relative flex flex-col rounded-2xl border border-slate-200/60 glass-panel p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-glass animate-slide-up">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">{topic.category}</p>
          <h3 className="mt-1.5 text-xl font-bold text-ink group-hover:text-brand transition-colors">{topic.title}</h3>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${levelClass}`}>{topic.difficulty}</span>
      </div>
      <p className="text-sm leading-6 text-slate-600 mb-3">{topic.description}</p>
      {topic.useCase && (
        <p className="mb-3 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-5">
          {topic.useCase}
        </p>
      )}
      {topic.formulaDisplay && (
        <p className="mb-4 rounded-md bg-slate-900 px-3 py-2 font-mono text-[11px] text-emerald-300 break-words">
          {topic.formulaDisplay}
        </p>
      )}
      <p className="mt-auto mb-5 text-xs text-slate-500 font-medium">Hoja: {topic.sheet}</p>
      <button
        type="button"
        className="mt-auto w-full rounded-xl bg-slate-100/80 px-4 py-2.5 text-sm font-bold text-ink transition-all group-hover:bg-brand group-hover:text-white group-hover:shadow-md"
        onClick={() => onSelect(topic)}
      >
        {topic.inputs.length > 0 ? "Resolver Ejercicio" : "Ver Contenido"}
      </button>
    </article>
  );
}
