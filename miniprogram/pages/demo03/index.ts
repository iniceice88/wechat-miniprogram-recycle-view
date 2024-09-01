const BATCH_COUNT = 50
const MAX_LOAD_TIMES = 10

Component({
  options: {
    pureDataPattern: /^_/,
  },
  data: {
    items: [] as any[],
    hasMore: true,
    _loadTimes: 0,
  },
  lifetimes: {
    ready() {
      this._loadNext(true)
    },
  },
  methods: {
    handleLoadMore() {
      if (!this.data.hasMore) return
      this._loadNext(false)
    },
    _loadNext(reload: boolean = false) {
      let items = this.data.items
      if (reload) {
        items = generateData(BATCH_COUNT, 0)
        this.data._loadTimes = 0
      } else {
        const data = generateData(BATCH_COUNT, this.data.items.length)
        items = this.data.items.concat(data)
      }
      this.data._loadTimes++

      this.setData({
        items,
        hasMore: this.data._loadTimes < MAX_LOAD_TIMES,
      })
    },
  },
})

function generateData(count: number, startId: number = 0) {
  return Array.from(Array(count).keys()).map((item) => ({
    id: item + startId,
    name: `name${item + startId}`,
  }))
}

export {}
