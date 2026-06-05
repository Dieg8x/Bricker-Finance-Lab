interface Props {
  steps: string[];
}

export function StepByStep({ steps }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-base font-bold text-ink">Procedimiento paso a paso</h3>
      <ol className="mt-4 grid gap-3">
        {steps.map((step, index) => (
          <li key={`${step}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
