<template>
  <div class="base-input">
    <el-input :model-value="modelValue" :type="type" :placeholder="placeholder" :disabled="disabled"
      :readonly="readonly" :clearable="clearable" :show-password="showPassword" :maxlength="maxlength"
      :minlength="minlength" :show-word-limit="showWordLimit" :size="size" :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon" :rows="rows" :autosize="autosize" :class="[
        'base-input__inner',
        {
          'base-input__inner--error': hasError,
          'base-input__inner--success': hasSuccess,
        },
      ]" @input="handleInput" @change="handleChange" @blur="handleBlur" @focus="handleFocus" @clear="handleClear">
      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend" />
      </template>
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>
      <template v-if="$slots.prefix" #prefix>
        <slot name="prefix" />
      </template>
      <template v-if="$slots.suffix" #suffix>
        <slot name="suffix" />
      </template>
    </el-input>

    <!-- Validation message -->
    <div v-if="errorMessage" class="base-input__error">
      {{ errorMessage }}
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="base-input__success">
      {{ successMessage }}
    </div>

    <!-- Help text -->
    <div v-if="helpText && !errorMessage && !successMessage" class="base-input__help">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InputSize } from 'element-plus';
import { computed } from 'vue';

interface Props {
  modelValue: string | number;
  type?: 'text' | 'textarea' | 'password' | 'email' | 'tel' | 'number';
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  showPassword?: boolean;
  maxlength?: number;
  minlength?: number;
  showWordLimit?: boolean;
  size?: InputSize;
  prefixIcon?: string;
  suffixIcon?: string;
  rows?: number;
  autosize?: boolean | { minRows?: number; maxRows?: number };
  errorMessage?: string;
  successMessage?: string;
  helpText?: string;
  validateOnBlur?: boolean;
  validateOnInput?: boolean;
}

interface Emits {
  'update:modelValue': [value: string | number];
  input: [value: string | number];
  change: [value: string | number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
  clear: [];
  validate: [value: string | number];
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  clearable: false,
  showPassword: false,
  showWordLimit: false,
  size: 'default',
  validateOnBlur: true,
  validateOnInput: false,
});

const emit = defineEmits<Emits>();

const hasError = computed(() => !!props.errorMessage);
const hasSuccess = computed(() => !!props.successMessage);

const handleInput = (value: string | number) => {
  emit('update:modelValue', value);
  emit('input', value);

  if (props.validateOnInput) {
    emit('validate', value);
  }
};

const handleChange = (value: string | number) => {
  emit('change', value);
};

const handleBlur = (event: FocusEvent) => {
  emit('blur', event);

  if (props.validateOnBlur) {
    emit('validate', props.modelValue);
  }
};

const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

const handleClear = () => {
  emit('clear');
  emit('update:modelValue', '');
  emit('input', '');
};
</script>

<style scoped>
.base-input {
  width: 100%;
}

.base-input__inner {
  transition: all 0.3s ease;
}

.base-input__inner--error :deep(.el-input__wrapper) {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.base-input__inner--success :deep(.el-input__wrapper) {
  border-color: var(--el-color-success);
  box-shadow: 0 0 0 1px var(--el-color-success) inset;
}

.base-input__error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
  line-height: 1.4;
}

.base-input__success {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-success);
  line-height: 1.4;
}

.base-input__help {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

/* Enhanced focus styles */
.base-input__inner :deep(.el-input__wrapper:focus-within) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .base-input__inner :deep(.el-input__wrapper) {
    min-height: 44px;
    font-size: 16px;
    /* Prevents zoom on iOS */
  }

  .base-input__inner :deep(.el-textarea__inner) {
    font-size: 16px;
    min-height: 100px;
  }
}
</style>
