import axios from './config'

// export const SERVER_URL = 'http://localhost:5000'
export const SERVER_URL = (import.meta.env.MODE === 'development') ? '/api' : 'https://server.pptist.cn'
export const ASSET_URL = 'http://127.0.0.1:5273'
export const CSG_URL = 'http://10.100.97.57:8080'
export const LOCAL_URL = 'http://localhost'
export const UPLOAD_URL = 'http://10.100.97.57:8100/upload'

interface ApiResponse {
  code?: number
  message?: string
  filename?: string
  // 其他可能的字段...
}
interface UploadFile{
  file: string,
  date: string
}
export default {
  getMockData(filename: string): Promise<any> {
    return axios.get(`./mocks/${filename}.json`)
  },

  getFileData(filename: string): Promise<any> {
    return axios.get(`./mocks/${filename}.json`)
  },

  AIPPT_Outline(
    content: string,
    language: string,
    model: string,
    uploadFile: UploadFile[]
  ): Promise<any> {
    //`${SERVER_URL}/tools/aippt_outline`
    //`http://localhost/pptist/generateOutline.php`
    return fetch(`${CSG_URL}/pptist/generateOutline.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        language,
        model,
        uploadFile: uploadFile,
        stream: true,
        subject: content,
      }),
    })
  },


  AIPPT(
    content: string,
    uploadFile: UploadFile[]
  ): Promise<any> {
    //`${SERVER_URL}/tools/aippt`
    return fetch(`${CSG_URL}/pptist/generateNewContent.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadFile: uploadFile,
        stream: true,
        outlineMarkdown: content
      }),
    })
  },

  async UPLOAD_File(uploadFile: FormData
  )  :Promise<ApiResponse>{
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: uploadFile
    });
  
    // 新增 HTTP 状态码检查
    if (!response.ok) {
      return {
        code: response.status,
        message: `HTTP Error: ${response.statusText}`
      }
    }
  
    return response.json();
    // return fetch(UPLOAD_URL, {
    //   method: 'POST',
    //   body: uploadFile
    // })
  }

}