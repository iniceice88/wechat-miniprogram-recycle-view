import { convertToPx, rpxToPx } from './libs/rpxToPx.js'
import { RecycleContext } from './libs/recycle-context'
import type {
  ItemSizeType,
  RecycleViewCache,
  RecycleViewDataType,
  RecycleViewViewModel,
  SizeMapType,
  SizeType,
} from './libs/internal.types'
import { batchBoundingClientRect, usePromise, waitUntil } from './libs/utils'
import { calcViewportIndexes, type ViewportIndexesType } from './libs/calcViewportIndexes'
import { DEBUG, DEFAULT_SHOW_SCREENS } from './libs/consts'
import { getIndexesInViewport } from './libs/getIndexesInViewport'
import { updateRecycleViewListData } from './libs/updateRecycleViewListData'
import type { BoundingClientRect, RecycleViewExportType } from './index'

type CustomEvent = WechatMiniprogram.CustomEvent

const winInfo = wx.getWindowInfo()

interface ScrollViewDidScrollEventDetailType {
  scrollLeft: number
  scrollTop: number
  scrollHeight?: number
  scrollWidth?: number
  deltaX?: number
  deltaY?: number
}

interface ScrollViewDidScrollEventType {
  detail: ScrollViewDidScrollEventDetailType
}

function getVm(p: any): RecycleViewViewModel {
  return p as RecycleViewViewModel
}

Component({
  behaviors: ['wx://component-export'],
  export() {
    return {
      instance: this,
      scrollTo: (top: number) => {
        this._manualScrollTop(top)
      },
      scrollToIndex: (itemIndex: number) => {
        this._manualScrollToIndex(itemIndex)
      },
      boundingClientRect: (idx: number): BoundingClientRect | undefined => {
        return this.boundingClientRect(idx)
      },
      getViewportItemIndices: (inViewportPx: number): number[] => {
        return this.getViewportItemIndices(inViewportPx)
      },
    } as RecycleViewExportType
  },
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    pureDataPattern: /^_/,
  },
  /**
   * 组件的属性列表
   */
  properties: {
    debug: {
      type: Boolean,
      value: false,
    },
    scrollY: {
      type: Boolean,
      value: true,
    },
    height: {
      type: Number,
      value: winInfo.windowHeight,
    },
    width: {
      type: Number,
      value: winInfo.windowWidth,
    },
    /**
     * 行高
     * 如果设置，则所有行统一使用这个高度
     * 支持[100, '100rpx', '10px']的形式
     */
    itemHeight: {
      type: null,
      value: null,
      optionalTypes: [Number, String],
    },
    /**
     * 列宽
     * 如果设置，则所有行统一使用这个宽度
     * 支持[100, '100rpx', '10px','10%']的形式
     */
    itemWidth: {
      type: null,
      value: null,
      optionalTypes: [Number, String],
    },
    /** 距顶部/左边多远时，触发bindscrolltoupper,透传给scroll-view */
    upperThreshold: {
      type: Number,
      value: 50,
      public: true,
    },
    /** 距底部/右边多远时，触发bindscrolltolower,透传给scroll-view */
    lowerThreshold: {
      type: Number,
      value: 50,
      public: true,
    },
    /** 是否节流，默认是,透传给scroll-view */
    throttle: {
      type: Boolean,
      value: true,
    },
    /**
     * iOS点击顶部状态栏、安卓双击标题栏时，滚动条返回顶部，只支持竖向。
     * 默认否
     * 自 2.27.3 版本开始，若非显式设置为 false，则在显示尺寸大于屏幕 90% 时自动开启。
     * 透传给scroll-view
     */
    enableBackToTop: {
      type: Boolean,
      value: false,
    },
    /**
     * 手动滚动到指定位置
     */
    scrollTop: {
      type: Number,
      value: -1,
    },
    /**
     * 手动滚动到指定项目下标
     */
    scrollToIndex: {
      type: Number,
      value: -1,
    },
    /**
     * 在设置滚动条位置时使用动画过渡
     * 默认否
     * 透传给scroll-view
     */
    scrollWithAnimation: {
      type: Boolean,
      value: false,
    },
    placeholderImage: {
      type: String,
      public: true,
      value: '',
    },
    screen: {
      // 默认渲染多少屏的数据
      type: Number,
      value: DEFAULT_SHOW_SCREENS,
    },
    items: {
      type: Array,
    },
    dataKey: {
      type: String,
      value: 'recycleList',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    innerBeforeHeight: 0,
    hasBeforeSlotHeight: false,
    hasAfterSlotHeight: false,
    beforeSlotHeight: 0,
    afterSlotHeight: 0,
    innerScrollIntoView: '',
    totalHeight: 0,
    backgroundStyle: '',

    // 设置到scroll-view上的scrollTop
    innerScrollTop: 0,
    // 记录scroll-view的位置
    _scrollLeft: 0,
    _scrollTop: 0,
  } as RecycleViewDataType,
  observers: {
    height(newVal: number) {
      const vm = getVm(this)
      if (!vm._isReady) return
      const cache = vm.cache
      cache.pos.recycleViewHeight = Math.max(500, newVal)
      this.forceUpdate()
    },
    width(newVal: number) {
      const vm = getVm(this)
      if (!vm._isReady) return
      const cache = vm.cache
      cache.pos.recycleViewWidth = newVal
      this.forceUpdate()
    },
    placeholderImageStr(url) {
      if (!url) {
        this.setData({ backgroundStyle: '' })
        return
      }
      this.setData({ backgroundStyle: `background: url("${url}") repeat;` })
    },
    scrollTop(top: number) {
      if (top < 0 || this.data._scrollTop === top) return
      this._manualScrollTop(top)
    },
    scrollToIndex(idx: number) {
      if (idx < 0) return
      this._manualScrollToIndex(idx)
    },
    items(newVal: any[]) {
      this._syncItems(newVal)
    },
  },
  lifetimes: {
    created() {
      ;(this as any).cache = { pos: { renderedItems: {} } } as RecycleViewCache
    },
    attached() {
      const vm = getVm(this)
      if (this.data.placeholderImage) {
        this.setData({
          placeholderImageStr: rpxToPx(this.data.placeholderImage, true),
        })
      }
      this.setItemSize({
        array: [],
        map: {},
        totalHeight: 0,
      })
      const recycleViewOwner = this.selectOwnerComponent()
      vm.recycleViewOwner = recycleViewOwner
      vm.context = new RecycleContext(
        {
          dataKey: this.data.dataKey,
          recycleViewOwner,
          itemSize: this.onCalcRecycleItemSize.bind(this),
        },
        this,
      )
      if (this.data.items?.length) {
        this._syncItems(this.data.items)
      }
      this.triggerEvent('contextReady', vm.context)
    },
    async ready() {
      const vm = getVm(this)
      await this._initPosition()
      vm._isReady = true // DOM结构ready了
      this._innerForceScroll({ scrollLeft: 0, scrollTop: 0 })
      this.triggerEvent('ready')
    },
    detached() {
      const vm = getVm(this)
      delete vm.recycleViewOwner
      // 销毁对应的RecycleContext
      if (vm.context) {
        vm.context.destroy()
        delete vm.context
      }
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _log(...args: any[]) {
      if (!DEBUG && !this.data.debug) return
      const h = new Date()
      const str = `${h.getHours()}:${h.getMinutes()}:${h.getSeconds()}.${h.getMilliseconds()}`
      Array.prototype.splice.call(args, 0, 0, str)
      console.log(...args)
    },
    handleScrollToUpper(e: CustomEvent) {
      this.triggerEvent('scrolltoupper', e.detail)
    },
    handleScrollToLower(e: CustomEvent) {
      this.triggerEvent('scrolltolower', e.detail)
    },
    _clearList() {
      const vm = getVm(this)
      const cache = vm.cache
      const renderedItems = cache.pos.renderedItems

      renderedItems.beginIndex = renderedItems.endIndex = -1
      renderedItems.minTop = renderedItems.maxTop = 0
      updateRecycleViewListData(vm)
    },
    // 判断RecycleContext是否Ready
    _isValid() {
      const vm = getVm(this)
      return vm.recycleViewOwner && vm.context && vm.context.isDataReady
    },
    /**
     * 处理页面ScrollView滚动事件
     * 该方法有两个途径调用：1. 用户手动滚动 2. 通过_innerForceScroll触发
     * @param e
     * @param force 是否强制渲染，用户手动滚动的时候为undefined
     */
    async handleScrollViewDidScroll(e: ScrollViewDidScrollEventType, force?: boolean) {
      const { scrollTop, scrollLeft } = e.detail
      const vm = getVm(this)
      const data = vm.data
      if (data._scrollTop !== scrollTop || data._scrollLeft !== scrollLeft) {
        data._scrollTop = scrollTop
        data._scrollLeft = scrollLeft
        this.triggerEvent('scroll', e.detail)
      }

      // 如果RecycleContext还没有初始化, 不做任何事情
      if (!this._isValid()) {
        return
      }

      const cache = vm.cache
      const pos = cache.pos
      // 高度为0的情况, 不做任何渲染逻辑
      if (!pos!.recycleViewHeight || !vm.sizeArray.length) {
        // 没有任何数据的情况下, 直接清理所有的状态
        this._clearList()
        return
      }

      if (!force && Math.abs(scrollTop - pos.top) < pos.recycleViewHeight * 1.5) {
        return // 滚动距离不够大，无需再计算
      }
      const viewportIndexes = await this._calcViewportIndexes(scrollTop)
      const { beginIndex, endIndex, minTop, maxTop } = viewportIndexes
      const renderedItems = pos.renderedItems
      //debugger
      // 渲染的数据不变
      if (
        !force &&
        renderedItems.beginIndex === beginIndex &&
        renderedItems.endIndex === endIndex &&
        renderedItems.minTop === minTop
      ) {
        // 要显示的元素没有变化
        return
      }

      vm._log(
        '【check】before setData, old pos is',
        renderedItems.minTop,
        renderedItems.maxTop,
        minTop,
        maxTop,
      )
      pos.top = scrollTop
      renderedItems.beginIndex = beginIndex
      renderedItems.endIndex = endIndex
      renderedItems.minTop = minTop
      renderedItems.maxTop = maxTop

      await updateRecycleViewListData(vm)
    },
    /** 计算在视窗内渲染的数据 */
    async _calcViewportIndexes(top: number): Promise<ViewportIndexesType> {
      const vm = getVm(this)
      const data = vm.data
      const cache = vm.cache

      // 等待slot高度计算完毕
      if (!(await waitUntil(1000, () => cache.slotHeightCalculated))) {
        // 应该不会超时
        console.warn('[recycle-view] wait slot height timeout')
        await this.reRender()
      }

      return calcViewportIndexes({
        top,
        totalHeight: vm.totalHeight,
        beforeSlotHeight: data.beforeSlotHeight || 0,
        screen: this.data.screen,
        viewWidth: this.data.width,
        pos: cache.pos,
        sizeArray: vm.sizeArray,
        sizeMap: vm.sizeMap,
      })
    },
    setItemSize(size: { array: ItemSizeType[]; map: SizeMapType }) {
      const vm = getVm(this)
      const { array, map } = size
      vm.sizeArray = array
      vm.sizeMap = map
      const lastItemSize = array.length > 0 ? array[array.length - 1] : null
      const totalHeight = !lastItemSize ? 0 : lastItemSize.top + lastItemSize.height
      if (totalHeight !== vm.totalHeight) {
        this.setData({ totalHeight: totalHeight })
        vm.totalHeight = totalHeight
      }
    },
    async forceUpdate() {
      const vm = getVm(this)
      if (!vm._isReady) {
        if (!(await waitRecycleViewReady(vm))) {
          console.warn('[recycle-view].forceUpdate: wait page ready timeout')
          return
        }
      }
      const data = vm.data
      this._innerForceScroll({
        scrollLeft: data._scrollLeft,
        scrollTop: data._scrollTop || 0,
      })
    },
    _innerForceScroll(detail: ScrollViewDidScrollEventDetailType) {
      this.handleScrollViewDidScroll({ detail }, true)
    },
    _initPosition(): Promise<void> {
      const vm = getVm(this)
      const data = vm.data
      const cache = vm.cache
      cache.pos = {
        top: data._scrollTop || 0,
        recycleViewWidth: this.data.width,
        recycleViewHeight: Math.max(500, this.data.height), // 一个屏幕的高度
        renderedItems: {},
      }
      return this.reRender()
    },
    reRender(): Promise<void> {
      const vm = getVm(this)
      const cache = vm.cache
      const { promise, resolve } = usePromise<void>()

      function onGetSlotsSize(beforeSlotHeight: number, afterSlotHeight: number) {
        const compareKey = `${beforeSlotHeight}-${afterSlotHeight}`
        if (cache.lastSlotKey !== compareKey) {
          vm.setData({
            hasBeforeSlotHeight: beforeSlotHeight > 0,
            hasAfterSlotHeight: afterSlotHeight > 0,
            beforeSlotHeight,
            afterSlotHeight,
          })
          cache.lastSlotKey = compareKey
        }
        cache.slotHeightCalculated = true
        resolve()
      }

      cache.slotHeightCalculated = false
      // 确保获取slot节点实际高度
      this.setData({ hasBeforeSlotHeight: false, hasAfterSlotHeight: false }, async () => {
        const slotBefore = this.createSelectorQuery().select('.slot-before')
        const slotAfter = this.createSelectorQuery().select('.slot-after')

        const rects = await batchBoundingClientRect([slotBefore, slotAfter])
        const beforeSlotHeight = rects[0].height
        const afterSlotHeight = rects[1].height
        onGetSlotsSize(beforeSlotHeight, afterSlotHeight)
      })

      return promise
    },
    _recycleInnerBatchDataChanged(beforeHeight?: number) {
      const dataToSet = { innerBeforeHeight: beforeHeight || 0 } as Record<string, any>
      const saveScrollWithAnimation = this.data.scrollWithAnimation

      this.setData(dataToSet, () => {
        this.setData({ scrollWithAnimation: saveScrollWithAnimation })
      })
    },
    /**
     * 手动滚动到指定位置
     * @param top
     */
    async _manualScrollTop(top: number) {
      this.setData({ innerScrollTop: top })
    },
    async _manualScrollToIndex(itemIndex: number) {
      const rect = this.boundingClientRect(itemIndex) as BoundingClientRect
      if (!rect) return
      this.setData({ innerScrollTop: rect.top })
    },
    // 提供给开发者使用的接口
    boundingClientRect(idx: number): BoundingClientRect | undefined {
      const vm = getVm(this)
      const sizeArray = vm.sizeArray
      if (idx < 0 || idx >= sizeArray.length) {
        return undefined
      }
      return {
        left: 0,
        top: sizeArray[idx].top,
        width: sizeArray[idx].width,
        height: sizeArray[idx].height,
      }
    },
    /**
     * 获取当前出现在屏幕内数据项， 返回数据项组成的数组
     * 参数inViewportPx表示当数据项至少有多少像素出现在屏幕内才算是出现在屏幕内，默认是1
     */
    getViewportItemIndices(inViewportPx: number): number[] {
      const vm = getVm(this)
      return getIndexesInViewport(
        inViewportPx,
        vm.data._scrollTop || 0,
        vm.totalHeight,
        this.data.height,
        vm.sizeArray,
      )
    },
    getTotalHeight() {
      return getVm(this).totalHeight
    },
    onCalcRecycleItemSize(item: any, idx: number) {
      const height = convertToPx(this.data.itemHeight)
      let width = convertItemWidth(this.data.itemWidth, this.data.width)
      if (this.data.itemHeight > 0 && !width) {
        width = this.data.width // 默认宽度为100%
      }
      const customSize = { width, height } as SizeType
      this.triggerEvent('onItemSize', { item, idx, size: customSize })

      if (!customSize.width || !customSize.height) {
        console.warn(`invalid item size:width=${width},height=${height}`, item, idx)
      }

      return customSize
    },
    _syncItems(list: any[]) {
      const vm = getVm(this)
      const ctx = vm.context
      if (!ctx) return // 还没加载
      ctx.replaceAll(list)
    },
  },
})

async function waitRecycleViewReady(vm: { _isReady?: boolean }): Promise<boolean> {
  return waitUntil(3000, () => vm._isReady)
}

function convertItemWidth(itemWidth: string | number, totalWidth: number): number {
  if (!itemWidth) return totalWidth
  if (typeof itemWidth === 'number') {
    return itemWidth
  }

  if (itemWidth.includes('%')) {
    // itemWidth可能是 10% 的形式，需要取得数字部分
    itemWidth = itemWidth.replace('%', '').trim()
    const n = Number(itemWidth)
    return isNaN(n) ? totalWidth : (totalWidth * n) / 100
  }
  return convertToPx(itemWidth) || totalWidth
}
