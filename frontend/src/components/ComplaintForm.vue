<template>
  <div class="complaint-form">
    <el-form-item label="吐槽类型" prop="complaintType">
      <el-select
        v-model="localComplaintType"
        placeholder="请选择吐槽类型"
        :size="isMobile ? 'large' : 'default'"
        style="width: 100%"
      >
        <el-option label="产品功能" value="functionality"></el-option>
        <el-option label="用户体验" value="usability"></el-option>
        <el-option label="性能问题" value="performance"></el-option>
        <el-option label="其他" value="other"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="期望改进" prop="expectedImprovement">
      <el-input
        type="textarea"
        v-model="localImprovement"
        placeholder="请描述您期望的改进方向..."
        :rows="isMobile ? 4 : 3"
        :size="isMobile ? 'large' : 'default'"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useBreakpoints } from '@/composables/useBreakpoints';
import type { FormData } from '@/types/common';

const { isMobile } = useBreakpoints();

interface Props {
  modelValue: FormData;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: FormData];
  input: [value: FormData];
}>();

const localImprovement = ref(props.modelValue.expectedImprovement || '');
const localComplaintType = ref(props.modelValue.complaintType || '');

watch(localImprovement, newVal => {
  const newValue = { ...props.modelValue, expectedImprovement: newVal };
  emit('update:modelValue', newValue);
  emit('input', newValue);
});

watch(localComplaintType, newVal => {
  const newValue = { ...props.modelValue, complaintType: newVal };
  emit('update:modelValue', newValue);
  emit('input', newValue);
});
</script>

<style scoped>
.complaint-form {
  width: 100%;
}

.complaint-form .el-form-item {
  margin-bottom: var(--spacing-lg);
}

/* Mobile Styles */
@media (max-width: 767px) {
  .complaint-form .el-form-item {
    margin-bottom: var(--spacing-md);
  }
}
</style>
