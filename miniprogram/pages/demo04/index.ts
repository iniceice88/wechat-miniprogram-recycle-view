const winInfo = wx.getWindowInfo()

Component({
  options: {
    pureDataPattern: /^_/,
  },
  data: {
    items: [] as any[],
    hasMore: true,
    _loadTimes: 0,
    recycleViewHeight: winInfo.windowHeight / 3,

    items2: [] as any[],
    hasMore2: true,
    _loadTimes2: 0,
    recycleViewHeight2: (winInfo.windowHeight * 2) / 3,
  },
  lifetimes: {
    ready() {
      this._loadNext(true)
      this._loadNext2(true)
    },
  },
  methods: {
    handleLoadMore() {
      if (!this.data.hasMore) return
      this._loadNext(false)
    },
    handleLoadMore2() {
      if (!this.data.hasMore2) return
      this._loadNext2(false)
    },
    _loadNext(reload: boolean = false) {
      const batchCount = 30
      const maxLoadTimes = 3
      const prefix = 'rv1'
      let items = this.data.items
      if (reload) {
        items = generateData(batchCount, prefix, 0)
        this.data._loadTimes = 0
      } else {
        const data = generateData(batchCount, prefix, this.data.items.length)
        items = this.data.items.concat(data)
      }
      this.data._loadTimes++

      this.setData({
        items,
        hasMore: this.data._loadTimes < maxLoadTimes,
      })
    },
    _loadNext2(reload: boolean = false) {
      const batchCount = 50
      const maxLoadTimes = 5
      let items2 = this.data.items2
      const prefix = 'rv2'
      if (reload) {
        items2 = generateData(batchCount, prefix, 0)
        this.data._loadTimes2 = 0
      } else {
        const data = generateData(batchCount, prefix, this.data.items2.length)
        items2 = this.data.items2.concat(data)
      }
      this.data._loadTimes2++

      this.setData({
        items2,
        hasMore2: this.data._loadTimes2 < maxLoadTimes,
      })
    },
  },
})

function generateData(count: number, prefix: string, startId: number = 0) {
  return Array.from(Array(count).keys()).map((item) => ({
    id: item + startId,
    name: `${prefix}_${item + startId}`,
  }))
}
