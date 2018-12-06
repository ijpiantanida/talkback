const Headers = {
  read(headers, headerName) {
    const value = headers[headerName]
    if (Array.isArray(value)) {
      return value[0]
    } else {
      return value
    }
  },

  write(headers, headerName, value, type) {
    const writeValue = type === "req" ? value : [value]
    headers[headerName] = writeValue
  }
}

export default Headers

