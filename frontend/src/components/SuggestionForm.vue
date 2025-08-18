<template>
  <div class="suggestion-form">
    <el-form-item label="建议类型" prop="suggestionType">
      <el-select
        v-model="localSuggestionType"
        placeholder="请选择建议类型"
        :size="isMobile ? 'large' : 'default'"
        style="width: 100%"
      >
        <el-option label="功能增强" value="enhancement"></el-option>
        <el-option label="新功能建议" value="new_feature"></el-option>
        <el-option label="流程优化" value="process_optimization"></el-option>
        <el-option label="其他" value="other"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="预期效益" prop="benefit">
      <el-input
        v-model="localBenefit"
        placeholder="请描述建议带来的预期效益"
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

const localSuggestionType = ref(props.modelValue.suggestionType || '');
const localBenefit = ref(props.modelValue.benefit || '');

watch(localSuggestionType, val => {
  const newValue = { ...props.modelValue, suggestionType: val };
  emit('update:modelValue', newValue);
  emit('input', newValue);
});

watch(localBenefit, val => {
  const newValue = { ...props.modelValue, benefit: val };
  emit('update:modelValue', newValue);
  emit('input', newValue);
});
</script>

<style scoped>
.suggestion-form {
  width: 100%;
}

.suggestion-form .el-form-item {
  margin-bottom: var(--spacing-lg);
}

/* Mobile Styles */
@media (max-width: 767px) {
  .suggestion-form .el-form-item {
    margin-bottom: var(--spacing-md);
  }
}
</style>
