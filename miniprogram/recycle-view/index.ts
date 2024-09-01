export interface RecycleViewOnItemSizeEventDetail<T = any> {
  item: T
  idx: number
  size: {
    width: number
    height: number
  }
}

/**
 * selectComponent('#recycleId') 返回的数据
 * https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/events.html
 */
export interface RecycleViewExportType {
  /**
   * RecycleView 实例本身
   */
  instance: any
  /**
   * 滚动到指定位置
   * @param top
   */
  scrollTo: (top: number) => void
  /**
   * 滚动到指定索引
   * @param index
   */
  scrollToIndex: (index: number) => void

  /**
   * 取得指定项目的位置尺寸信息
   * @param idx
   */
  boundingClientRect: (idx: number) => BoundingClientRect | undefined

  /**
   * 取得当前视口内的项目下标列表
   */
  getViewportItemIndices: (inViewportPx: number) => number[]
}

export interface BoundingClientRect {
  top: number
  left: number
  width: number
  height: number
}
