import type { FlowConfig } from '@llm-workflow-tool/shared';

export const runFlow = async (config: FlowConfig) => {
  console.log(`Running flow: ${config.name}`);
  return { status: 'completed', config };
};
