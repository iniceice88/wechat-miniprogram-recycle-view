import type { SizeType } from './libs/internal.types'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    item: null,
  },
  /**
   * 组件的初始数据
   */
  data: {
    sizeStyle: '',
  },
  observers: {
    /**
     * 项目改变之后，重新计算尺寸
     */
    item: function (item: { __size__?: Partial<SizeType> }) {
      let sizeStyle = getSizeStyle(item.__size__)
      if (sizeStyle === this.data.sizeStyle) return

      this.setData({
        sizeStyle,
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {},
})

function getSizeStyle(size?: Partial<SizeType>) {
  if (!size) return ''
  const { width, height } = size
  let sizeStyle = ''
  if (width) {
    sizeStyle += `width: ${width}px;`
  }
  if (height) {
    sizeStyle += `height: ${height}px;`
  }
  return sizeStyle
}
