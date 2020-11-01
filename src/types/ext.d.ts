type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer P> ? P : T

type OptionProps<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>
//
// interface AAA {
//   name: string
//   age: number
// }
//
// const aa: OptionProps<AAA, 'name'>
//
// aa
