type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer P> ? P : T

type OptionalProps<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>
