import { useState } from "react";
import type { TopicDefinition } from "../lib/types";

interface Props {
  topic: TopicDefinition;
}

export function StudyPanel({ topic }: Props) {
  const [openAnswers, setOpenAnswers] = useState<Record<number, boolean>>({});

  return (
    <section className="grid gap-5">
      {topic.studySections?.map((section) => (
        <article key={section.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-ink">{section.title}</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
            {section.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}

      {topic.comparison ? (
        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1fr,1fr,1fr] bg-brand text-sm font-bold text-white">
            <div className="p-3">Aspecto</div>
            <div className="p-3">{topic.comparison.leftTitle}</div>
            <div className="p-3">{topic.comparison.rightTitle}</div>
          </div>
          {topic.comparison.rows.map((row) => (
            <div key={row.aspect} className="grid grid-cols-[1fr,1fr,1fr] border-t border-slate-200 text-sm leading-6">
              <div className="bg-slate-50 p-3 font-bold text-ink">{row.aspect}</div>
              <div className="p-3 text-slate-700">{row.left}</div>
              <div className="p-3 text-slate-700">{row.right}</div>
            </div>
          ))}
        </article>
      ) : null}

      {topic.cheatSheet?.length ? (
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-ink">Chuleta rápida</h3>
          <div className="mt-3 grid gap-2">
            {topic.cheatSheet.map((item) => (
              <div key={item} className="rounded-md bg-slate-50 p-3 font-mono text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {topic.questions?.length ? (
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-ink">Preguntas tipo examen</h3>
          <div className="mt-4 grid gap-3">
            {topic.questions.map((question, index) => (
              <div key={question.question} className="rounded-lg border border-slate-200 p-4">
                <p className="font-bold text-ink">{question.question}</p>
                {openAnswers[index] ? (
                  <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
                    <p><strong>Respuesta:</strong> {question.answer}</p>
                    <p className="mt-1"><strong>Explicación:</strong> {question.explanation}</p>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-ink"
                  onClick={() => setOpenAnswers((current) => ({ ...current, [index]: !current[index] }))}
                >
                  {openAnswers[index] ? "Ocultar respuesta" : "Ver respuesta"}
                </button>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
