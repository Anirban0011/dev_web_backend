const FetchData = (path, payload, method='POST') =>{
    const options = {
        method : method
    }

    options.headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }

  options.body = JSON.stringify(payload)

  return fetch(path, options)
}

export default FetchData