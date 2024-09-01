let isIPhone: boolean | null = null
let deviceWidth = 0
let deviceDPR = 0
const BASE_DEVICE_WIDTH = 750
const checkDeviceWidth = () => {
  const winInfo = wx.getWindowInfo()
  if (isIPhone === null) {
    isIPhone = wx.getDeviceInfo().platform === 'ios'
  }
  const newDeviceWidth = winInfo.screenWidth || 375
  const newDeviceDPR = winInfo.pixelRatio || 2

  if (!isIPhone) {
    // HACK switch width and height when landscape
    // const newDeviceHeight = info.screenHeight || 375
    // 暂时不处理转屏的情况
  }

  if (newDeviceWidth !== deviceWidth || newDeviceDPR !== deviceDPR) {
    deviceWidth = newDeviceWidth
    deviceDPR = newDeviceDPR
    // console.info('Updated device width: ' + newDeviceWidth + 'px DPR ' + newDeviceDPR)
  }
}
checkDeviceWidth()

const eps = 1e-4
const transformByDPR = (number: number): number => {
  if (number === 0) {
    return 0
  }
  number = (number / BASE_DEVICE_WIDTH) * deviceWidth
  number = Math.floor(number + eps)
  if (number === 0) {
    if (deviceDPR === 1 || !isIPhone) {
      return 1
    }
    return 0.5
  }
  return number
}

const rpxRE = /([+-]?\d+(?:\.\d+)?)rpx/gi

const rpxToPx = (style: string | number, withUnit?: boolean): string => {
  const unit = withUnit ? 'px' : ''
  if (typeof style === 'number') {
    return transformByDPR(style) + unit
  }
  style = String(style)
  return style.replace(rpxRE, function (_, num) {
    return transformByDPR(Number(num)) + unit
  })
}

export { rpxToPx }
