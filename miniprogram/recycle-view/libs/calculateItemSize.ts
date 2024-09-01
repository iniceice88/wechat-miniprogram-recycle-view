import type { ItemSizeType, RectType, SizeMapType } from './internal.types'
import { RECT_SIZE } from './consts'
import type { RecycleContextOption } from './recycle-context'

export function calculateItemSize(
  list: any[],
  itemSizeProvider: RecycleContextOption['itemSize'],
  recycleViewWidth: number,
) {
  // 遍历所有的数据
  // 应该最多就千量级的, 遍历没有问题
  const sizeMap = {} as SizeMapType
  let offsetLeft = 0
  let offsetTop = 0
  let prevLineHeight = 0 // 上一行高度,以最高的项目为准
  const sizeArray: ItemSizeType[] = []
  const listLen = list.length
  const func = itemSizeProvider
  // 把整个页面拆分成200*200的很多个方格, 判断每个数据落在哪个方格上
  for (let i = 0; i < listLen; i++) {
    list[i].__index__ = i
    let itemSize = {} as ItemSizeType
    // 获取到每一项的宽和高
    if (typeof func === 'function') {
      // 必须保证返回的每一行的高度一样
      // @ts-ignore
      itemSize = func && func(list[i], i)
    } else {
      itemSize = {
        width: func.width,
        height: func.height,
        top: 0,
      }
    }
    itemSize = Object.assign({}, itemSize)
    list[i].__size__ = itemSize
    sizeArray.push(itemSize)

    let itemRect: RectType = {
      left: offsetLeft,
      right: offsetLeft + itemSize.width,
      top: offsetTop,
      bottom: offsetTop + itemSize.height,
    }

    itemSize.top = offsetTop

    // 同一行
    if (itemRect.right <= recycleViewWidth) {
      appendPosition(i, itemRect, sizeMap)
      offsetLeft = itemRect.right
      prevLineHeight = Math.max(prevLineHeight, itemSize.height)
      continue
    }

    offsetTop += prevLineHeight
    offsetLeft = 0
    itemSize.top = offsetTop

    // 下一行
    itemRect = {
      left: offsetLeft,
      right: offsetLeft + itemSize.width,
      top: offsetTop,
      bottom: offsetTop + itemSize.height,
    }

    appendPosition(i, itemRect, sizeMap)
    offsetLeft = itemRect.right
    prevLineHeight = itemSize.height
  }
  return {
    array: sizeArray,
    map: sizeMap,
  }
}

/**
 * 根据当前元素的Rect,计算占用了哪些格子
 * 有些元素可能比较大，占用多个格子
 */
function appendPosition(idx: number, itemRect: RectType, sizeMap: SizeMapType) {
  const columns = calcItemSpans(itemRect.left, itemRect.right, RECT_SIZE)
  const rows = calcItemSpans(itemRect.top, itemRect.bottom, RECT_SIZE)
  rows.forEach((row) => {
    columns.forEach((column) => {
      const key = `${row}-${column}`
      if (!sizeMap[key]) {
        sizeMap[key] = []
      }
      sizeMap[key].push(idx)
    })
  })
}

function calcItemSpans(startPos: number, endPos: number, rectSize: number) {
  const startIdx = Math.floor(startPos / rectSize)
  const endIdx = Math.floor(endPos / rectSize)
  return Array.from({ length: endIdx - startIdx + 1 }, (_, idx) => startIdx + idx)
}
