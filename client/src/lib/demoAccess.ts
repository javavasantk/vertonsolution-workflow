export type DemoCredentials = { email: string; password: string } | null | undefined;

/** A second client-side guard ensures a production build never renders shared demo credentials. */
export function shouldShowDevelopmentDemo(credentials: DemoCredentials, isDevelopment = import.meta.env.DEV) {
  return Boolean(isDevelopment && credentials);
}
