export type Difficulty = "Básico" | "Medio" | "Avanzado";

export type InputType = "number" | "select";

export interface FieldOption {
  label: string;
  value: string | number;
}

export interface TopicInput {
  key: string;
  label: string;
  unit?: string;
  defaultValue: number | string;
  helper?: string;
  type?: InputType;
  options?: FieldOption[];
  formulaVar?: string;
  isPercent?: boolean;
}

export interface TopicOutput {
  key: string;
  label: string;
  formula: string;
}

export interface StudySection {
  title: string;
  bullets: string[];
}

export interface ComparisonRow {
  aspect: string;
  left: string;
  right: string;
}

export interface ExamQuestion {
  question: string;
  answer: string;
  explanation: string;
}

export interface TopicDefinition {
  id: string;
  title: string;
  sheet: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  useCase?: string;
  formulaDisplay?: string;
  inputs: TopicInput[];
  outputs: TopicOutput[];
  studySections?: StudySection[];
  comparison?: {
    leftTitle: string;
    rightTitle: string;
    rows: ComparisonRow[];
  };
  cheatSheet?: string[];
  questions?: ExamQuestion[];
}

export interface ResultMetric {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  emphasis?: boolean;
}

export interface CalculationResult {
  results: Record<string, number | string>;
  metrics: ResultMetric[];
  formula: string;
  steps: string[];
  interpretation: string;
  examExplanation: string;
  warnings: string[];
}

export type CalculationInput = Record<string, number | string>;
