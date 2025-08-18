<template>
  <div class="bug-form">
    <el-row :gutter="isMobile ? 0 : 16" class="bug-form-row">
      <el-col :xs="24" :sm="12">
        <el-form-item label="严重程度" prop="severity">
          <el-select
            v-model="localSeverity"
            placeholder="请选择问题严重程度"
            :size="isMobile ? 'large' : 'default'"
            style="width: 100%"
          >
            <el-option label="低" value="low"></el-option>
            <el-option label="中" value="medium"></el-option>
            <el-option label="高" value="high"></el-option>
            <el-option label="紧急" value="critical"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item label="问题环境" prop="environment">
          <el-input
            v-model="localEnvironment"
            placeholder="如：Chrome 120, Windows 11"
            :size="isMobile ? 'large' : 'default'"
          />
        </el-form-item>
      </el-col>
    </el-row>
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

const localSeverity = ref(props.modelValue.severity || '');
const localEnvironment = ref(props.modelValue.environment || '');

watch(localSeverity, val => {
  const newValue = { ...props.modelValue, severity: val };
  emit('update:modelValue', newValue);
  emit('input', newValue);
});

watch(localEnvironment, val => {
  const newValue = { ...props.modelValue, environment: val };
  emit('update:modelValue', newValue);
  emit('input', newValue);
});
</script>

<style scoped>
.bug-form {
  width: 100%;
}

.bug-form-row {
  margin: 0 calc(var(--spacing-sm) * -1);
}

.bug-form-row .el-col {
  padding: 0 var(--spacing-sm);
}

.bug-form .el-form-item {
  margin-bottom: var(--spacing-lg);
}

/* Mobile Styles */
@media (max-width: 767px) {
  .bug-form-row {
    margin: 0;
  }

  .bug-form-row .el-col {
    padding: 0;
    margin-bottom: var(--spacing-md);
  }

  .bug-form-row .el-col:last-child {
    margin-bottom: 0;
  }
}
</style>
