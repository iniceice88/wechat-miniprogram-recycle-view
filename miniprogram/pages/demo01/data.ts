export interface SkuType {
  price: number
  promotion_info: string
}

export interface GoodsType {
  id: number
  title: string
  picture: string
  status: number
  description: string
  skus: SkuType[]
  unit: string
  attrs: any[]
  image_url: string
}

const dummyGoods: GoodsType = {
  id: 0,
  title: 'test测试数据',
  picture: '',
  status: 1,
  description: 'asndasdjaksdhttps://img.yzcdn.cn/u',
  skus: [
    {
      price: 100,
      promotion_info: 'dsadada',
    },
  ],
  unit: 'zhuo',
  attrs: [],
  image_url: 'https://img.yzcdn.cn/upload_files/2018/01/13/FioO3zv7ENB_7uqptCyHuFf6dRdU.png',
}

export function generateGoods<T = GoodsType>(count: number, action?: (g: GoodsType) => T): T[] {
  const list: T[] = []
  for (let i = 0; i < count; i++) {
    const goods = JSON.parse(JSON.stringify(dummyGoods)) as GoodsType
    goods.id = i + 1
    if (!action) {
      list.push(goods as T)
      continue
    }
    const g2 = action(goods)
    list.push(g2)
  }
  return list
}
