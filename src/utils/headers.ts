export default class Headers {
  static read(headers: any, headerName: string) {
    const value = headers[headerName]
    if (Array.isArray(value)) {
      return value[0]
    } else {
      return value
    }
  }

  static write(headers: any, headerName: string, value: string, type: "req"|"res") {
    headers[headerName] = type === "req" ? value : [value]
  }
}
