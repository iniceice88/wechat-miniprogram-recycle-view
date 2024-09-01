type BoundingClientRectCallbackResult = WechatMiniprogram.BoundingClientRectCallbackResult

export function isUndef(v: any): v is undefined | null {
  return v === undefined || v === null
}

export function isDef<T>(v: T): v is NonNullable<T> {
  return v !== undefined && v !== null
}

export function boundingClientRectAsync(node: WechatMiniprogram.NodesRef) {
  return new Promise((resolve) => {
    node
      .boundingClientRect((rect) => {
        resolve(rect)
      })
      .exec()
  })
}

export function batchBoundingClientRect(
  nodes: WechatMiniprogram.NodesRef[],
): Promise<BoundingClientRectCallbackResult[]> {
  return Promise.all(nodes.map((n) => boundingClientRectAsync(n))) as Promise<
    BoundingClientRectCallbackResult[]
  >
}

export function usePromise<T>() {
  let resolve: (value?: T | PromiseLike<T>) => void
  let reject: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res as any
    reject = rej
  })
  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  }
}

type PredicateFunction = () => boolean | undefined

export function waitUntil(
  timeoutMs: number,
  predicate?: PredicateFunction,
  intervalMs = 33,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const tick = () => {
      if (predicate && predicate()) {
        resolve(true)
        return
      }
      timeoutMs -= intervalMs
      if (timeoutMs <= 0) {
        resolve(false)
        return
      }
      setTimeout(tick, intervalMs)
    }
    setTimeout(tick, intervalMs)
  })
}
