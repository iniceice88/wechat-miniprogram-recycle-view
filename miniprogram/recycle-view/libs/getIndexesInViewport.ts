import type { ItemSizeType } from './internal.types'

/**
 * 获取当前出现在屏幕内数据项， 返回数据项组成的数组
 * 参数inViewportPx表示当数据项至少有多少像素出现在屏幕内才算是出现在屏幕内，默认是1
 */
export function getIndexesInViewport(
  inViewportPx: number,
  scrollTop: number,
  totalHeight: number,
  recycleViewHeight: number,
  sizeArray: ItemSizeType[],
): number[] {
  if (!inViewportPx) {
    inViewportPx = 1
  }
  let minTop = scrollTop + inViewportPx
  if (minTop < 0) minTop = 0
  let maxTop = scrollTop + recycleViewHeight - inViewportPx
  if (maxTop > totalHeight) maxTop = totalHeight
  const indexes = []
  for (let i = 0; i < sizeArray.length; i++) {
    const size = sizeArray[i]
    const beforeHeight = size.top || 0
    if (beforeHeight + sizeArray[i].height >= minTop && beforeHeight <= maxTop) {
      indexes.push(i)
    }
    if (beforeHeight > maxTop) break
  }
  return indexes
}
