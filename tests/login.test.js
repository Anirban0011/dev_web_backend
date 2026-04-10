import 'dotenv/config'
import {exec} from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)

const TestLogin = async()=>{
    try{
    const command = `
    curl --silent --location \
    -w "\\n%{http_code}" \
    '${process.env.BASE_URL}/api/${process.env.API_VERSION}/users/login'
    -H 'Content-Type: application/json' \
    -d '{
        "username" : "${process.env.TEST_USERNAME}",
        "password": "${process.env.TEST_PASSWORD}"
    }'`
    console.log(command)
    const { stdout, stderr} = await execAsync(command)
    console.log("STDERR >>>", stderr)
    console.log("STDOUT >>>", stdout)
    const [body, status] = stdout.split('\n')
    const response = JSON.parse(body)
     if (status !== `200`) {
      throw new Error(`Status ${status}: ${JSON.stringify(response)}`)
    }

    console.log('Login test passed!')}
    catch(err){
         console.error('Login test failed:', err.message)
         process.exit(1)
    }
}

TestLogin()
