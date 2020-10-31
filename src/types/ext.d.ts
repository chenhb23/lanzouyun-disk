type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer P> ? P : T
