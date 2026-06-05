interface Props {
  formula: string;
  hidden: boolean;
}

export function FormulaBox({ formula, hidden }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-base font-bold text-ink">Fórmula usada</h3>
      <p className="mt-3 rounded-md bg-white p-3 font-mono text-sm leading-6 text-slate-700">
        {hidden ? "Activa el cálculo para ver la fórmula en modo examen." : formula}
      </p>
    </section>
  );
}
