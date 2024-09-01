import type { RecycleViewOnItemSizeEventDetail } from '../../recycle-view/index'

Component({
  data: {
    sizeStrategy: 'fixed' as 'fixed' | 'random',
    items: [] as any[],
  },
  lifetimes: {
    attached() {},
    ready() {
      this._refresh()
    },
  },
  methods: {
    handleRandomHeights() {
      this.setData({
        sizeStrategy: 'random',
      })
      this._refresh()
    },
    handleFixedHeights() {
      if (this.data.sizeStrategy === 'fixed') return

      this.setData({
        sizeStrategy: 'fixed',
      })
      this._refresh()
    },
    onCalcRecycleItemSize(e: WechatMiniprogram.CustomEvent<RecycleViewOnItemSizeEventDetail>) {
      const { item: _, idx: __, size } = e.detail

      const { sizeStrategy } = this.data
      let height = size.height
      if (sizeStrategy === 'random') {
        height = randomInt(30, 150)
      }
      Object.assign(size, {
        height: height,
      })
    },
    _refresh() {
      this.setData({
        items: generateData(100),
      })
    },
  },
})

function generateData(count: number) {
  return Array.from(Array(count).keys()).map((item) => ({
    id: item,
    name: `name${item}`,
  }))
}

function randomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
