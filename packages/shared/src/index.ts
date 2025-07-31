export const greet = (name: string) => `Hello, ${name}!`;

export interface FlowConfig {
  name: string;
  steps: FlowStep[];
}

export interface FlowStep {
  name: string;
  type: string;
}
