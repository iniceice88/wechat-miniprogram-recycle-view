Page({
  handleDemo01(e: WechatMiniprogram.CustomEvent) {
    const demoName = e.target.dataset.name
    wx.navigateTo({
      url: `/pages/${demoName}/index`,
    })
  },
})
