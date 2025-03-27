<template>
    <div class="container">
      <div class="upload-box">
        <h2>批量文件转换测试</h2>
        <input 
          type="file" 
          ref="fileInput"
          multiple
          accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.txt"
          @change="handleFileSelect"
        >
        <label class="custom-upload-btn" @click="triggerFileSelect">
          选择文件（已选 {{ selectedFiles.length }}/{{ remainingSlots }}）
        </label>
        <p>支持格式：DOC、DOCX、PDF、PPT、XLS、txt等文本文件及常见压缩文件</p>
  
        <div v-if="selectedFiles.length" class="selected-files">
          <div v-for="(file, index) in selectedFiles" :key="file.name" class="file-item">
            {{ index + 1 }}. {{ file.name }} ({{ formatFileSize(file.size) }})
            <button class="delete-file-btn" @click="removeFile(index)">删除</button>
          </div>
        </div>
  
        <button 
          class="convert-btn" 
          @click="uploadFiles"
          :disabled="isUploading || !selectedFiles.length"
        >
          {{ isUploading ? '上传中...' : '开始上传' }}
        </button>
  
        <div class="progress-container" v-show="isUploading">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
  
      <div class="result-container" v-if="results.length">
        <h3>上传结果</h3>
        <div v-for="(result, index) in results" :key="index" class="result-item" :class="result.status">
          <p v-if="result.status === 'success'">
            ✅ {{ result.filename }} 上传成功，文件名：{{ result.filename }}
            <button class="delete-result-btn" @click="removeResult(index)">删除</button>
          </p>
          <p v-else>
            ❌ {{ result.filename }} 上传失败，错误信息：{{ result.error }}
            <button class="delete-result-btn" @click="removeResult(index)">删除</button>
          </p>
        </div>
      </div>
    </div>
  </template>
  <script lang="ts" setup>
  import { ref, computed } from 'vue'
  import api from '@/services'

  // Declare the type for the file object
interface CustomFile 
 {
  name: string;
  size: number;
  originalFile: File;
}

// Declare the type for the result object
interface Result {
  status: 'success' | 'error';
  filename?: string;
  file?: any; // Adjust according to the actual response type from the API
  error?: string;
  date?: string;
}

interface ResponseData{
    message?: string;
    file?: string;
    date?: string;
    error?: string
}
  const emits = defineEmits(['upload-file']);
  const MAX_FILES = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<CustomFile[]>([]);
const uploadProgress = ref<number>(0);
const isUploading = ref<boolean>(false);
const results = ref<Result[]>([]);
  

  
  const remainingSlots = computed(() => MAX_FILES - results.value.filter(r => r.status === 'success').length);
  
  const handleFileSelect = (e:Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return; // 如果没有文件，直接返回

    const files = Array.from(input.files); // 将 FileList 转换为 Array

    const availableSlots = remainingSlots.value - selectedFiles.value.length;
  
    if (availableSlots <= 0) {
      alert(`已达到最大上传文件数`);
      return;
    }

 
    if (files.length > availableSlots) {
      alert(`最多只能再选择 ${availableSlots} 个文件`);
      files.splice(availableSlots);
    }
  
   // const newFiles = files.filter(newFile => !selectedFiles.value.some(existingFile => existingFile.name === newFile.name));
     // 过滤文件大小
  const validFiles = files.filter(file => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`文件 ${file.name} 超过5MB大小限制`);
      return false;
    }
    return true;
  });

   const newFiles = validFiles.map(file => ({
        name: file.name,
        size: file.size,
        originalFile: file // 存储原始 File 对象
    }));
    selectedFiles.value = [...selectedFiles.value, ...newFiles];
  };
  

  const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click(); // 确保 fileInput.value 不是 null
  }
};
  
  const removeFile = (index: number) => selectedFiles.value.splice(index, 1);
  
  const removeResult = (index: number) => {
    results.value.splice(index, 1);
    emits('upload-file', results.value.filter(item => item.status === 'success'));
  };
  
  const formatFileSize = (bytes:number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  const uploadFiles = async () => {
    if (!selectedFiles.value.length) return;
  
    isUploading.value = true;
    uploadProgress.value = 0;
  
    try {
      for (let i = 0; i < selectedFiles.value.length; i++) {
        const fileItem = selectedFiles.value[i];
        const formData = new FormData();
        formData.append('file', fileItem.originalFile );
  
        uploadProgress.value = Math.floor((i / selectedFiles.value.length) * 100);
        
        try {
          const response: ResponseData  = await api.UPLOAD_File(formData);
          
          const successResult = {
            status: 'success'as const,
            filename: fileItem.name,
            file: response.file,
            date: response.date
          };
          results.value.push(successResult);
        } catch (error: unknown) {  // 使用 'unknown' 类型捕获异常
            if (error instanceof Error) {  // 确保 'error' 是 'Error' 类型
                results.value.push({
                status: 'error',
                error: error.message,  // 现在可以安全地访问 message
                filename: fileItem.name
                });
            } else {
                // 处理其他异常类型
                results.value.push({
                status: 'error',
                error: 'Unknown error occurred',
                filename: fileItem.name
                });
            }
        }
      }
      emits('upload-file', results.value.filter(item => item.status === 'success'));
      uploadProgress.value = 100;
      selectedFiles.value = [];
    } finally {
      isUploading.value = false;
      setTimeout(() => uploadProgress.value = 0, 5000);
    }
  };
  </script>
  
  
  
  <style scoped>
  .container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  .upload-box {
    border: 2px dashed #ccc;
    padding: 30px;
    text-align: center;
    margin-bottom: 20px;
  }
  input[type="file"] {
    display: none;
  }
  .custom-upload-btn {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    display: inline-block;
    margin: 10px 0;
  }
  .selected-files {
    margin: 15px 0;
    text-align: left;
  }
  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }
  .delete-file-btn, .delete-result-btn {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    margin-left: 10px;
  }
  .convert-btn {
    background-color: #2196F3;
    color: white;
    padding: 10px 25px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 15px;
  }
  .progress-container {
    margin: 15px 0;
  }
  .progress-bar {
    height: 20px;
    background-color: #f5f5f5;
    border-radius: 10px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background-color: #4CAF50;
    transition: width 0.3s ease;
  }
  .result-container {
    margin-top: 20px;
    padding: 15px;
    border-radius: 5px;
    background: #f9f9f9;
  }
  .result-item.success {
    color: #3c763d;
    background: #dff0d8;
  }
  .result-item.error {
    color: #a94442;
    background: #f2dede;
  }
  </style>