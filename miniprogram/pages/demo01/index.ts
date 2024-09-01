import { generateGoods, type GoodsType } from './data'

interface GoodsTypeEx extends GoodsType {
  idx?: number
  azFirst?: boolean
}

const winInfo = wx.getWindowInfo()

const SAFE_AREA_INSET_BOTTOM = winInfo.screenHeight - winInfo.safeArea.bottom

Page({
  data: {
    items: [] as GoodsTypeEx[],
    recycleViewHeight: winInfo.windowHeight - SAFE_AREA_INSET_BOTTOM - 40 - 24,
    scrollTop: -1,
    scrollToIndex: -1,
    scrollTopDesc: '',
  },
  onReady: function () {
    this.setData({
      items: generateData(),
    })
  },
  scrollToRandom: function () {
    this.setData({
      scrollTop: 5000,
    })
  },
  scrollTo0: function () {
    this.setData({
      scrollTop: 0,
    })
  },
  scrollToid: function () {
    this.setData({
      scrollToIndex: 20,
    })
  },
  handleContextReady(e: WechatMiniprogram.CustomEvent) {
    const context = e.detail
    console.log('contextReady', context)
  },
  handleScroll(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      scrollTopDesc: String(Math.round(e.detail.scrollTop)),
    })
  },
})

function generateData() {
  const goods = generateGoods(50) as GoodsTypeEx[]
  const duplicatedGoods: GoodsTypeEx[] = []
  let k = 0
  goods.forEach((item, i) => {
    item.idx = i
    item.azFirst = k++ % 10 == 0
    duplicatedGoods.push(item)
    item.image_url = item.image_url.replace('https', 'http')
    const newItem = Object.assign({}, item)
    newItem.id = newItem.id + 10000
    duplicatedGoods.push(newItem)
  })
  return duplicatedGoods
}
