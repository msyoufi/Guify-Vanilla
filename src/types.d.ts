interface Window {
  electron: {
    handle: <T>(channel: string, ...args: any) => Promise<T>,
    recieve: (channel: string, listener: (...args: any) => void) => void
  }
}