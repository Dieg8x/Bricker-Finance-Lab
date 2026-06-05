import { coverageGuide, glossary, globalQuestions } from "../data/studyContent";

export function GlossaryPanel() {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Glosario esencial</h2>
        <div className="mt-4 grid gap-3">
          {glossary.map((item) => (
            <div key={item.term} className="rounded-md bg-slate-50 p-3">
              <p className="font-bold text-ink">{item.term}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.definition}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-5">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Selector rápido de cobertura</h2>
          <div className="mt-4 grid gap-3">
            {coverageGuide.map((item) => (
              <div key={item.exposure} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm font-bold text-ink">{item.exposure}</p>
                <p className="mt-2 text-sm text-brand"><strong>Cobertura:</strong> {item.hedge}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.reason}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Preguntas rápidas</h2>
          <ul className="mt-4 grid gap-3">
            {globalQuestions.map((question) => (
              <li key={question.question} className="rounded-md bg-amber-50 p-3 text-sm leading-6">
                <p className="font-bold text-ink">{question.question}</p>
                <p className="mt-1 text-slate-700">{question.answer}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
