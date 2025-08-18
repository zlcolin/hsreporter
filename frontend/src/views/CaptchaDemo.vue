<template>
  <div class="captcha-demo">
    <el-card class="demo-card">
      <template #header>
        <h2>验证码系统演示</h2>
      </template>

      <div class="demo-section">
        <h3>基础验证码组件</h3>
        <captcha-input
          v-model="captchaCode"
          @verified="handleVerified"
          @error="handleError"
          ref="captchaRef"
        />

        <div class="demo-info">
          <p><strong>当前输入:</strong> {{ captchaCode }}</p>
          <p><strong>验证状态:</strong> {{ verificationStatus }}</p>
          <p><strong>最后消息:</strong> {{ lastMessage }}</p>
        </div>

        <div class="demo-actions">
          <el-button @click="refreshCaptcha">手动刷新</el-button>
          <el-button @click="clearInput">清空输入</el-button>
          <el-button @click="testVerification" :disabled="!captchaCode">测试验证</el-button>
        </div>
      </div>

      <div class="demo-section">
        <h3>使用 Composable</h3>
        <div class="composable-demo">
          <div class="captcha-container">
            <el-input
              v-model="composableCaptcha.captchaCode.value"
              placeholder="请输入验证码"
              maxlength="4"
            />
            <div class="captcha-image-container">
              <img
                v-if="composableCaptcha.captchaImageUrl.value"
                :src="composableCaptcha.captchaImageUrl.value"
                alt="验证码"
                @click="composableCaptcha.refresh"
                class="captcha-image"
              />
              <div v-else class="loading">加载中...</div>
            </div>
            <el-button
              @click="composableCaptcha.refresh"
              :loading="composableCaptcha.loading.value"
            >
              刷新
            </el-button>
          </div>

          <div class="composable-info">
            <p>
              <strong>验证状态:</strong>
              {{ composableCaptcha.verified.value ? '已验证' : '未验证' }}
            </p>
            <p><strong>错误信息:</strong> {{ composableCaptcha.error.value }}</p>
            <p><strong>剩余时间:</strong> {{ composableCaptcha.formatTimeRemaining() }}</p>
          </div>

          <el-button
            @click="composableCaptcha.verify"
            :disabled="!composableCaptcha.canVerify.value"
            :loading="composableCaptcha.verifying.value"
          >
            验证
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import CaptchaInput from '@/components/CaptchaInput.vue';
import { useCaptcha } from '@/composables/useCaptcha';

// 基础组件演示
const captchaCode = ref('');
const captchaRef = ref();
const verificationStatus = ref('未验证');
const lastMessage = ref('');

const handleVerified = (captchaId: string) => {
  verificationStatus.value = '验证成功';
  lastMessage.value = `验证成功，ID: ${captchaId}`;
  ElMessage.success('验证码验证成功！');
};

const handleError = (error: string) => {
  verificationStatus.value = '验证失败';
  lastMessage.value = error;
};

const refreshCaptcha = () => {
  captchaRef.value?.refresh();
};

const clearInput = () => {
  captchaCode.value = '';
  verificationStatus.value = '未验证';
  lastMessage.value = '';
};

const testVerification = () => {
  captchaRef.value?.verify();
};

// Composable 演示
const composableCaptcha = useCaptcha({
  onVerified: captchaId => {
    ElMessage.success(`Composable 验证成功: ${captchaId}`);
  },
  onError: error => {
    ElMessage.error(`Composable 错误: ${error}`);
  },
});

onMounted(() => {
  composableCaptcha.generate();
});
</script>

<style scoped>
.captcha-demo {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.demo-card {
  margin-bottom: 20px;
}

.demo-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.demo-section h3 {
  margin-top: 0;
  color: var(--el-color-primary);
}

.demo-info {
  margin: 20px 0;
  padding: 15px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.demo-info p {
  margin: 8px 0;
  font-size: 14px;
}

.demo-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.composable-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.captcha-image-container {
  width: 120px;
  height: 40px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-image {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.loading {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.composable-info {
  padding: 15px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 4px;
}

.composable-info p {
  margin: 8px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .captcha-container {
    flex-direction: column;
    align-items: stretch;
  }

  .captcha-image-container {
    width: 100%;
    max-width: 200px;
    align-self: center;
  }

  .demo-actions {
    justify-content: center;
  }
}
</style>
