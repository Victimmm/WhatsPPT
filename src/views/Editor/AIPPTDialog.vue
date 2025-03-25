<template>
  <div class="aippt-dialog">
    <div class="header">
      <span class="title">AIPPT</span>
      <span class="subtite" v-if="step === 'template'">从下方挑选合适的模板，开始生成PPT</span>
      <span class="subtite" v-else-if="step === 'outline'">确认下方内容大纲（点击编辑内容，右键添加/删除大纲项），开始选择模板</span>
      <span class="subtite" v-else>在下方输入您的PPT主题，并适当补充信息，如行业、岗位、学科、用途等</span>
    </div>
    
    <template v-if="step === 'setup'">
      <Input class="input" 
        ref="inputRef"
        v-model:value="keyword" 
        :maxlength="50" 
        placeholder="请输入PPT主题，如：大学生职业生涯规划" 
        @enter="createOutline()"
      >
        <template #suffix>
          <span class="count">{{ keyword.length }} / 50</span>
          <!-- <span class="language" v-tooltip="'切换语言'" @click="language = language === 'zh' ? 'en' : 'zh'">{{ language === 'zh' ? '中' : '英' }}</span> -->
          <div class="submit" type="primary" @click="createOutline()"><IconSend class="icon" /> AI 生成</div>
        </template>
      </Input>
      <div class="recommends">
        <div class="recommend" v-for="(item, index) in recommends" :key="index" @click="setKeyword(item)">{{ item }}</div>
      </div>
      <!-- <div class="model-selector">
        <div class="label">选择AI模型：</div>
        <Select 
          style="width: 160px;"
          v-model:value="model"
          :options="[
            { label: 'Doubao-1.5-Pro', value: 'doubao-1.5-pro-32k' },
            { label: 'DeepSeek-v3', value: 'ark-deepseek-v3' },
            { label: 'GLM-4-Flash', value: 'GLM-4-flash' },
          ]"
        />
      </div> -->
    </template>
    <div class="preview" v-if="step === 'outline'">
      <pre ref="outlineRef" v-if="outlineCreating">{{ outline }}</pre>
       <div class="outline-view" v-else>
         <OutlineEditor v-model:value="outline" />
       </div>
      <div class="btns" v-if="!outlineCreating">
        <Button class="btn" type="primary" @click="step = 'template'">选择PPT模板</Button>
        <Button class="btn" @click="outline = ''; step = 'setup'">返回重新生成</Button>
      </div>
    </div>
    <div class="select-template" v-if="step === 'template'">
      <div class="templates">
        <div class="template" 
          :class="{ 'selected': selectedTemplate === template.id }" 
          v-for="template in templates" 
          :key="template.id" 
          @click="selectedTemplate = template.id"
        >
          <img :src="template.cover" :alt="template.name">
        </div>
      </div>
      <div class="btns">
        <Button class="btn" type="primary" @click="createPPT()">生成</Button>
        <Button class="btn" @click="step = 'outline'">返回大纲</Button>
      </div>
    </div>

    <FullscreenSpin :loading="loading" tip="AI思考生成中，请耐心等待 ..." />

    <Schedule :start="scheduleStart" :end="scheduleEnd" :loading="isShowSchedule && loading" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import api from '@/services'
import useAIPPT from '@/hooks/useAIPPT'
import type { AIPPTSlide } from '@/types/AIPPT'
import type { Slide } from '@/types/slides'
import message from '@/utils/message'
import { useMainStore, useSlidesStore } from '@/store'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
// import Select from '@/components/Select.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import OutlineEditor from '@/components/OutlineEditor.vue'
import useSlideHandler from '@/hooks/useSlideHandler'
//进度提醒
import Schedule from '@/components/schedule.vue'

const mainStore = useMainStore()
const { templates } = storeToRefs(useSlidesStore())
const { resetSlides } = useSlideHandler()
const { AIPPT } = useAIPPT()
const slidesStore = useSlidesStore()
const language = ref<'zh' | 'en'>('zh')
const keyword = ref('')
const outline = ref('')
const selectedTemplate = ref('template_1')
const loading = ref(false)
const outlineCreating = ref(false)
const outlineRef = ref<HTMLElement>()
const inputRef = ref<InstanceType<typeof Input>>()
const step = ref<'setup' | 'outline' | 'template'>('setup')
const model = ref('doubao-1.5-pro-32k')

const recommends = ref([
  '大学生职业生涯规划',
  '公司年会策划方案',
  '大数据如何改变世界',
  '餐饮市场调查与研究',
  'AIGC在教育领域的应用',
  '5G技术如何改变我们的生活',
  '社交媒体与品牌营销',
  '年度工作总结与展望',
  '区块链技术及其应用',
]) 
//定义进度的开始和结束
const scheduleStart = ref(0)
const scheduleEnd = ref(0)
const isShowSchedule = ref(false) //是否显示进度

onMounted(() => {
  setTimeout(() => {
    inputRef.value!.focus()
  }, 500)
})

const setKeyword = (value: string) => {
  keyword.value = value
  inputRef.value!.focus()
}

const createOutline = async () => {
  if (!keyword.value) return message.error('请先输入PPT主题')

  // outline.value = "# 实时生成PPT行业总结性报告\n\n ## 1. 实时生成PPT技术概述\n ### 1.1 技术定义与背景\n 1.1.1 实时生成PPT的基本概念。\n 实时生成PPT技术指通过AI算法和自动化工具，根据用户输入内容即时创建演示文稿。该技术整合自然语言理解、视觉设计和结构化逻辑，实现从文本到可视化幻灯片的秒级转换，满足快速制稿需求。\n\n 1.1.2 技术的发展历程。\n 该技术起源于2010年后云计算与AI的发展，早期基于预设模板自动化排版，2020年后结合深度学习实现内容理解与智能设计，目前已形成从文字输入到动态交互的全流程解决方案。\n\n"
  // step.value = 'outline'
  // return 
  isShowSchedule.value = false
  loading.value = true
  outlineCreating.value = true
  
  const stream = await api.AIPPT_Outline(keyword.value, language.value, model.value)

  loading.value = false
  step.value = 'outline'

  const reader: ReadableStreamDefaultReader = stream.body.getReader()
  const decoder = new TextDecoder('utf-8')
  
  const readStream = () => {
    reader.read().then(({ done, value }) => {
      // console.log("回传数据：", done, decoder.decode(value, { stream: true }));
      if (done) {
        outlineCreating.value = false
        return
      }
  
      const chunk = decoder.decode(value, { stream: true })
      outline.value += chunk

      if (outlineRef.value) {
        outlineRef.value.scrollTop = outlineRef.value.scrollHeight + 20
      }

      readStream()
    })
  }
  readStream()
}

interface JSONItem {
  level: number;
  name: string;
  children: JSONItem[];
  type?: string; // Optional field for type
}

// interface AIPPTSlide {
//   type: string;
//   data: { title?: string; text?: string; items?: string[] };
// }

const createPPT = async () => {
  
  if (window.confirm('生成AI将会清空当前幻灯片，是否继续？')) {
    // 用户点击确定后执行
    resetSlides()
  } else {
    // 用户点击取消
    return
  }
  loading.value = true
  isShowSchedule.value = true

  const stream = await api.AIPPT(outline.value, language.value, 'doubao-1.5-pro-32k')
  const templateSlides: Slide[] = await api.getFileData(selectedTemplate.value).then(ret => ret.slides)

  const reader: ReadableStreamDefaultReader = stream.body.getReader()
  const decoder = new TextDecoder('utf-8')
  const chunksBuffer =  ref<Uint8Array[]>([])

  const readStream = () => {
    reader.read().then(({ done, value }) => {
      if (done) {
        loading.value = false
        mainStore.setAIPPTDialogState(false)
        return
      }
      // 检查 value 是否为字符串.数据同时返回两行时
      if (typeof value === 'string') {
        // 使用正则表达式提取每个 JSON 对象
        const jsonObjects = value.match(/{.*?}/gs);
        if (jsonObjects) {
          const parsedObjects = jsonObjects.map((json) => JSON.parse(json));
          // 将 parsedObjects 中的每个对象添加到 chunksBuffer 中
          chunksBuffer.value.push(...parsedObjects);
        }
      }else{
        chunksBuffer.value.push(value)
      }
      
      //{"current":1, "pptId":"", "status":3, "text":"", "total":9}

 //

      // 合并所有 Uint8Array 为一个大的 Uint8Array
      const combined = new Uint8Array(chunksBuffer.value.reduce((sum, chunk) => sum + chunk.length, 0));

      let offset = 0;
      for (const chunk of chunksBuffer.value) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const chunk = decoder.decode(combined , { stream: false })

      console.log("回传数据", chunk)
      try {
        const jsonTemp = JSON.parse(chunk)
        //解析成功清空缓存
        chunksBuffer.value = []


        console.log("回传数据", jsonTemp)
        if(jsonTemp.current){
          console.log("当前数据：", jsonTemp.current)
          console.log("总数据：", jsonTemp.total)
          scheduleStart.value = jsonTemp.current
          scheduleEnd.value = jsonTemp.total
        }else{
          //cover
          const slide: AIPPTSlide[] = []
          const slideJson = jsonTemp as JSONItem

          slide.push(
           {
            type: "cover",
            data: { title: slideJson.name.replace(/#/g, ''), text: "" }
          })

          slide.push({
              type: "copyright",
              data: {
                title: "",
                text: ""
              }
          })

          // Table of contents
          slide.push({
            type: "contents",
            data: { items: slideJson.children.map(item => item.name.replace(/#/g, '')) }
          });

          slideJson.children.forEach((item) => {
          // Transition slide for each main section
          slide.push({
            type: "transition",
            data: { title: item.name.replace(/#/g, ''), text: "" }
          });

          // Process content slides for each sub-section
          if (item.children && item.children.length > 0) {
            item.children.forEach((subItem) => {
              // const contentItems = subItem.children?.map(child => { return {title: this.name, text: child.name}}) 
              const contentItems = [];
              if (subItem.children && subItem.children.length > 0) {
                for (let i = 0; i < subItem.children.length; i++) {
                  const child = subItem.children[i] as JSONItem;
                  contentItems.push({ title: child.name.replace(/#/g, ''), text: child.children[0].name });
                }
              }
              
              slide.push({
                type: "content",
                data: { title: subItem.name.replace(/#/g, ''), items: contentItems }
              });
            });
          }
        });

          slide.push({
              type: "end"
            })
          AIPPT(templateSlides, slide)
        }
        

        // mainStore.setAIPPTDialogState(false)
      }
      catch (err) {
        // eslint-disable-next-line
        console.error(err)
      }

      readStream()
    })
  }
  readStream()
}
</script>

<style lang="scss" scoped>
.aippt-dialog {
  margin: -20px;
  padding: 30px;
}
.header {
  margin-bottom: 12px;

  .title {
    font-weight: 700;
    font-size: 20px;
    margin-right: 8px;
    background: linear-gradient(270deg, #d897fd, #33bcfc);
    background-clip: text;
    color: transparent;
    vertical-align: text-bottom;
    line-height: 1.1;
  }
  .subtite {
    color: #888;
    font-size: 12px;
  }
}
.preview {
  pre {
    max-height: 450px;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #f1f1f1;
    overflow: auto;
  }
  .outline-view {
    max-height: 450px;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #f1f1f1;
    overflow: auto;
  }
  .btns {
    display: flex;
    justify-content: center;
    align-items: center;

    .btn {
      width: 120px;
      margin: 0 5px;
    }
  }
}
.select-template {
  .templates {
    display: flex;
    margin-bottom: 10px;
    @include flex-grid-layout();
  
    .template {
      border: 2px solid $borderColor;
      border-radius: $borderRadius;
      width: 304px;
      height: 172.75px;
      margin-bottom: 12px;

      &:not(:nth-child(2n)) {
        margin-right: 12px;
      }

      &.selected {
        border-color: $themeColor;
      }
  
      img {
        width: 100%;
      }
    }
  }
  .btns {
    display: flex;
    justify-content: center;
    align-items: center;

    .btn {
      width: 120px;
      margin: 0 5px;
    }
  }
}
.configs {
  margin-top: 5px;
  display: flex;
  justify-content: space-between;

  .items {
    display: flex;
  }
  .item {
    margin-right: 5px;
  }
}
.recommends {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;

  .recommend {
    font-size: 12px;
    background-color: #f1f1f1;
    border-radius: $borderRadius;
    padding: 3px 5px;
    margin-right: 5px;
    margin-top: 5px;
    cursor: pointer;

    &:hover {
      color: $themeColor;
    }
  }
}
.model-selector {
  margin-top: 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
}
.count {
  font-size: 12px;
  color: #999;
  margin-right: 10px;
}
.language {
  font-size: 12px;
  margin-right: 10px;
  color: $themeColor;
  cursor: pointer;
}
.submit {
  height: 20px;
  font-size: 12px;
  background-color: $themeColor;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 5px;
  border-radius: $borderRadius;
  cursor: pointer;

  &:hover {
    background-color: $themeHoverColor;
  }

  .icon {
    font-size: 15px;
    margin-right: 3px;
  }
}
</style>