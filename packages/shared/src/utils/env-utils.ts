export function mapToSafeEnv(processEnv: NodeJS.ProcessEnv): Record<string, string> {
  const safeEnv: Record<string, string> = {};

  for (const [key, value] of Object.entries(processEnv)) {
    if (value !== undefined) {
      safeEnv[key] = value;
    }
  }

  return safeEnv;
}