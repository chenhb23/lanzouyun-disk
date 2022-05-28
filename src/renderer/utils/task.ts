/**
 * 计算任务数量
 * @param tasks
 */
export function taskLength<T>(tasks: T[]) {
  const len = tasks?.length
  return len ? `（${len}）` : ''
}
