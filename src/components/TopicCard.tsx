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
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">{topic.category}</p>
          <h3 className="mt-1 text-lg font-bold text-ink">{topic.title}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${levelClass}`}>{topic.difficulty}</span>
      </div>
      <p className="min-h-12 text-sm leading-6 text-slate-600">{topic.description}</p>
      <p className="mt-3 text-xs text-slate-500">Hoja base: {topic.sheet}</p>
      <button
        type="button"
        className="mt-5 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-[#173d60]"
        onClick={() => onSelect(topic)}
      >
        Resolver ejercicio
      </button>
    </article>
  );
}
