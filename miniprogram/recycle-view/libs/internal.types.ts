import { RecycleContext } from './recycle-context'

export interface RenderedItemsInfo {
  /** 已经渲染的项目中最小下标 */
  beginIndex?: number
  /** 已经渲染的项目中最大下标 */
  endIndex?: number

  minTop?: number
  maxTop?: number
}

export interface PagePosType {
  top: number
  recycleViewWidth: number
  recycleViewHeight: number

  /** 已经渲染的项目相关信息 */
  renderedItems: RenderedItemsInfo
}

export interface RecycleViewCache {
  /** 用于比较两次渲染之间slot的高度是否有变化 */
  lastSlotKey?: string

  /** 记录各位置信息 */
  pos: PagePosType

  /** slot高度是否已经计算完毕? */
  slotHeightCalculated?: boolean
}

export interface RecycleViewDataType {
  innerScrollTop?: number
  _scrollTop?: number
  _scrollLeft?: number
  innerBeforeHeight?: number
  hasBeforeSlotHeight?: boolean
  hasAfterSlotHeight?: boolean
  beforeSlotHeight?: number
  afterSlotHeight?: number
  placeholderImageStr?: string
  /** 所有项目的总高度 */
  totalHeight?: number
  backgroundStyle?: string
}

export interface RecycleViewViewModel {
  /** 正在使用recycle-view的组件或页面 */
  recycleViewOwner: any
  sizeArray: ItemSizeType[]
  sizeMap: SizeMapType
  context?: RecycleContext
  /** 所有项目占的的总高度 */
  totalHeight: number
  _isReady?: boolean

  cache: RecycleViewCache

  data: RecycleViewDataType

  setData(obj: any, cb?: Function): void

  _log(...args: any[]): void

  _recycleInnerBatchDataChanged(beforeHeight?: number): void
}

export interface RectType {
  left: number
  right: number
  top: number
  bottom: number
}

export interface SizeType {
  width: number
  height: number
}

export interface ItemSizeType extends SizeType {
  /**
   * 到顶部的距离
   */
  top: number
}

/**
 * 假设宽度=itemSize.width,高度是无限的,然后把所有元素从左到右从上到下铺开
 * 然后把这个区域划分成一个个200*200的方格
 * sizeMap的key是`行号.列号`, value是一个数组, 里面是这个方格内的项目的index
 */
export type SizeMapType = Record<string, number[]>
