import { calculateItemSize } from './calculateItemSize'

export type IndexedItem<T> = T & { __index__: number }

export type ItemSizeFunc<T = any> = (
  item: IndexedItem<T>,
  idx: number,
) => { width: number; height: number }

export type ItemSizeType = {
  width: number
  height: number
  dataKey?: string
  beforeHeight?: number
}

export interface RecycleContextOption<T = any> {
  dataKey: string
  /** 持有RecycleView的组件 */
  recycleViewOwner: any
  itemSize: ItemSizeType | ItemSizeFunc<T>
}

const DefaultRecycleContextOption = {} as RecycleContextOption

// RecycleContext的作用不大，可以考虑移除
export class RecycleContext<T = any> {
  private _opt: RecycleContextOption
  private _list: T[] = []

  isDataReady = false
  /** recycle-view组件实例 */
  private _recycleView: any

  get options() {
    return this._opt
  }

  get recycleView() {
    return this._recycleView
  }

  get recycleViewOwner() {
    return this._opt.recycleViewOwner
  }

  constructor(opt: RecycleContextOption, recycleView: any) {
    this._opt = Object.assign({}, DefaultRecycleContextOption, opt)
    const { dataKey, recycleViewOwner, itemSize } = opt
    if (!dataKey || !recycleViewOwner || !itemSize) {
      throw new Error('parameter dataKey, recycleViewOwner, itemSize is required')
    }
    if (typeof itemSize !== 'function' && typeof itemSize !== 'object') {
      throw new Error('parameter itemSize must be function or object with key width and height')
    }
    if (
      typeof itemSize === 'object' &&
      (!itemSize.width || !itemSize.height) &&
      !itemSize.dataKey
    ) {
      throw new Error('parameter itemSize must be function or object with key width and height')
    }
    this._recycleView = recycleView
  }

  appendList(list: T[], cb?: Function) {
    this._list.concat(list)
    this._forceRerender(cb)
    return this
  }

  append = this.appendList

  private _forceRerender(cb?: Function) {
    this.isDataReady = true // 首次调用说明数据已经ready了

    this._recalculateSize(this.list)
    // 触发强制渲染
    this._recycleView.forceUpdate().then(() => cb && cb())
  }

  private _recalculateSize(list: any[]) {
    const func = this._opt.itemSize
    const recycleView = this._recycleView
    const recycleViewData = recycleView.data
    const itemSizeObj = calculateItemSize(list, func, recycleViewData.width)
    recycleView.setItemSize(itemSizeObj)
    return itemSizeObj
  }

  deleteList(beginIndex: number, count: number, cb?: Function) {
    this.list.splice(beginIndex, count)
    this._forceRerender(cb)
    return this
  }

  updateList(beginIndex: number, list: T[], cb?: Function) {
    const len = this.list.length
    for (let i = 0; i < list.length && beginIndex < len; i++) {
      this.list[beginIndex++] = list[i]
    }
    this._forceRerender(cb)
    return this
  }

  update = this.updateList

  // 定义重载的方法签名
  splice(appendList: T[], cb?: Function): void
  splice(begin: number, deleteCount: number, cb?: Function): void
  splice(begin: number, deleteCount: number, appendList: T[], cb?: Function): void
  splice(begin: number | T[], deleteCount: any, appendList?: any, cb?: any) {
    if (Array.isArray(begin)) {
      cb = deleteCount
      appendList = begin
      begin = 0
    }
    if (typeof appendList === 'function') {
      cb = appendList
      appendList = []
    }
    const list = this.list
    if (list.length === 0) {
      list.push(...appendList)
    } else {
      if (appendList && appendList.length) {
        list.splice(begin, deleteCount, ...appendList)
      } else {
        list.splice(begin, deleteCount)
      }
    }

    this._forceRerender(cb)
    return this
  }

  replaceAll(newList: T[]) {
    this._list.length = 0
    this._list.push(...newList)
    this._forceRerender()
    return this
  }

  /**
   * 对list进行批量操作，完成之后再进行一次渲染
   * @param action
   */
  batchUpdate(action: (list: T[]) => void) {
    action(this.list)
    this._forceRerender()
    return this
  }

  destroy() {
    this._recycleView = null
    const anyThis = this as any
    delete anyThis._opt
  }

  getTotalHeight() {
    return this._recycleView.getTotalHeight()
  }

  getList() {
    return this.list
  }

  get list() {
    return this._list
  }
}
