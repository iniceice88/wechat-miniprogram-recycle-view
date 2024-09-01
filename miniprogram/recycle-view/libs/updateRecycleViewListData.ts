import { isUndef, usePromise } from './utils'
import { RecycleContext } from './recycle-context'
import type { PagePosType, RecycleViewViewModel } from './internal.types'
import { DEBUG } from './consts'

/**
 * 更新RecycleView的列表数据(用于显示的部分而非全部数据)
 */
export function updateRecycleViewListData(recycleView: RecycleViewViewModel): Promise<unknown> {
  const { promise, resolve } = usePromise()
  const ctx = recycleView.context as RecycleContext

  if (!ctx.list.length) return promise
  const dataList = ctx.list
  const pos = recycleView.cache.pos as PagePosType
  const renderedItems = pos.renderedItems
  const beginIndex = renderedItems.beginIndex
  const endIndex = renderedItems.endIndex
  let newList = []
  if (DEBUG) {
    console.log(`render list from ${beginIndex} to ${endIndex}`)
  }
  if (isUndef(beginIndex) || beginIndex === -1 || isUndef(endIndex) || endIndex === -1) {
    newList = []
  } else {
    for (let i = beginIndex; i < dataList.length && i <= endIndex; i++) {
      newList.push(dataList[i])
    }
  }
  const dataToSet = {} as any
  dataToSet[ctx.options.dataKey!] = newList
  const page = ctx.recycleViewOwner
  const beforeHeight = renderedItems.minTop
  page.groupSetData(() => {
    recycleView._recycleInnerBatchDataChanged(beforeHeight)
    page.setData(dataToSet, () => {
      resolve()
    })
  })

  return promise
}
