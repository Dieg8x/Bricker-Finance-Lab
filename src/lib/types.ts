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
}

export interface TopicOutput {
  key: string;
  label: string;
  formula: string;
}

export interface TopicDefinition {
  id: string;
  title: string;
  sheet: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  inputs: TopicInput[];
  outputs: TopicOutput[];
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
