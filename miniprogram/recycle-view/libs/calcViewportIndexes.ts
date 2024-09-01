import { isUndef } from './utils'
import type { ItemSizeType, PagePosType, SizeType } from './internal.types'
import { RECT_SIZE } from './consts'

export interface CalcViewportIndexesOption {
  top: number
  /** 所有项目占的的总高度 */
  totalHeight: number
  /** 在recycle-view内容前面的slot高度 */
  beforeSlotHeight: number
  screen: number
  viewWidth: number
  pos: PagePosType
  sizeArray: ItemSizeType[]
  sizeMap: Record<string, number[]>
}

export interface ViewportIndexesType {
  beginIndex?: number
  endIndex?: number
  minTop?: number
  maxTop?: number
}

export function calcViewportIndexes(opt: CalcViewportIndexesOption): ViewportIndexesType {
  const { totalHeight, beforeSlotHeight, screen, viewWidth, pos, sizeArray, sizeMap } = opt
  if (!sizeArray) return {}
  const top = opt.top
  let minTop = top - pos.recycleViewHeight * screen - beforeSlotHeight
  let maxTop = top + pos.recycleViewHeight * screen - beforeSlotHeight
  // maxTop或者是minTop超出了范围
  if (maxTop > totalHeight) {
    minTop -= maxTop - totalHeight
    maxTop = totalHeight
  }
  if (minTop < beforeSlotHeight) {
    maxTop += Math.min(beforeSlotHeight - minTop, totalHeight)
    minTop = 0
  }
  // 计算落在minTop和maxTop之间的方格有哪些
  let { beginIndex, endIndex } = getIndexes(minTop, maxTop, viewWidth, sizeMap)
  if (endIndex >= sizeArray.length) {
    endIndex = sizeArray.length - 1
  }
  // 校验一下beginIndex和endIndex的有效性,
  if (!isIndexValid(sizeArray, beginIndex, endIndex)) {
    return {
      beginIndex: -1,
      endIndex: -1,
      minTop: 0,
      maxTop: 0,
    }
  }

  const minTopFull = sizeArray[beginIndex].top
  return {
    beginIndex,
    endIndex,
    minTop: minTopFull, // 取整, beforeHeight的距离
    maxTop,
  }
}

function getIndexes(
  minTop: number,
  maxTop: number,
  viewWidth: number,
  sizeMap: Record<string, number[]>,
) {
  if (minTop === maxTop && maxTop === 0) {
    return {
      beginIndex: -1,
      endIndex: -1,
    }
  }
  const startLine = Math.floor(minTop / RECT_SIZE)
  const endLine = Math.ceil(maxTop / RECT_SIZE)
  const rectEachLine = Math.ceil(viewWidth / RECT_SIZE)
  let beginIndex = NaN
  let endIndex = NaN
  for (let i = startLine; i <= endLine; i++) {
    for (let col = 0; col < rectEachLine; col++) {
      const key = `${i}-${col}`
      // 找到sizeMap里面的最小值和最大值即可
      if (!sizeMap[key]) continue

      for (let j = 0; j < sizeMap[key].length; j++) {
        if (isNaN(beginIndex)) {
          beginIndex = endIndex = sizeMap[key][j]
          continue
        }
        if (beginIndex > sizeMap[key][j]) {
          beginIndex = sizeMap[key][j]
        } else if (endIndex < sizeMap[key][j]) {
          endIndex = sizeMap[key][j]
        }
      }
    }
  }
  return {
    beginIndex,
    endIndex,
  }
}

function isIndexValid(sizeArray: SizeType[], beginIndex?: number, endIndex?: number) {
  if (
    isUndef(beginIndex) ||
    beginIndex === -1 ||
    isUndef(endIndex) ||
    endIndex === -1 ||
    (endIndex || 0) >= sizeArray.length
  ) {
    return false
  }
  return true
}
