import 'dotenv/config'
import FetchData from '../src/utils/FetchData.js'

const TestLogin = async()=>{
    try{
    const url = `${process.env.BASE_URL}/api/${process.env.API_VERSION}/users/login`
    const payload = {
            username: process.env.TEST_USERNAME,
            password: process.env.TEST_PASSWORD
        }

   const res = await FetchData(url, payload)
   const response = await res.json()
   if (!res.ok) {
            throw new Error(`Status ${res.status}: ${JSON.stringify(response)}`)
        }
        console.log('Login test passed!', response.message)
    } catch (err) {
        console.error('Login test failed:', err.message)
        process.exit(1)
    }
}

TestLogin()
