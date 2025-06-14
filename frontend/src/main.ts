// main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import FeedbackForm from './components/FeedbackForm.vue'

const app = createApp(FeedbackForm)
app.use(ElementPlus)
app.mount('#app')