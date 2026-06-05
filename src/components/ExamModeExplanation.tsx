interface Props {
  explanation: string;
}

export function ExamModeExplanation({ explanation }: Props) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <h3 className="text-base font-bold text-ink">Cómo lo explicaría en examen</h3>
      <p className="mt-3 text-sm leading-6 text-slate-700">{explanation}</p>
    </section>
  );
}
