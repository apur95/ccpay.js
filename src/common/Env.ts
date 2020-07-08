const ua = navigator.userAgent.toLowerCase()

export class Env {
  isIOS = ua.includes('iphone')
  isAndroid = ua.includes('android')
  isElectron = ua.includes('electron')
  isMac = ua.includes('mac')
  isWindows = ua.includes('windows')
  isCCPay = ua.includes('ccpay')

  get language () {
    const matches: any = ua.match(/Language\/([a-zA-Z-_]+)/g) // 形如 Language/zh-CN
    const splitParts: string[] = matches?.[0]?.split('/') || []
    return splitParts[1]
  }

  get clientVersion () {
    const matches: any = ua.match(/CCPay\/([a-zA-Z-_]+)/g) // 形如 CCPay/1.2.3
    const splitParts: string[] = matches?.[0]?.split('/') || []
    return splitParts[1]
  }
}
