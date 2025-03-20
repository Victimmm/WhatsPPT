import axios from './config'

// export const SERVER_URL = 'http://localhost:5000'
export const SERVER_URL = (import.meta.env.MODE === 'development') ? '/api' : 'https://server.pptist.cn'
export const ASSET_URL = 'http://127.0.0.1:5273'
export const CSG_URL = 'http://10.100.97.57'

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
        stream: true,
        subject: content,
      }),
    })
  },


  AIPPT(
    content: string,
    language: string,
    model: string,
  ): Promise<any> {
    //`${SERVER_URL}/tools/aippt`
    return fetch(`${CSG_URL}/pptist/generateNewContent.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        language,
        model,
        stream: true,
        outlineMarkdown: content
      }),
    })
  },
}