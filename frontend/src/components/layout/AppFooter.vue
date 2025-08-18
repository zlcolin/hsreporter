<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-info">
        <p class="copyright">© 2024 问题反馈系统. All rights reserved.</p>
        <p class="version" v-if="version">Version {{ version }}</p>
      </div>

      <div class="footer-links">
        <slot name="links">
          <a href="#" class="footer-link">帮助文档</a>
          <a href="#" class="footer-link">联系我们</a>
          <a href="#" class="footer-link">隐私政策</a>
        </slot>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
interface Props {
  version?: string;
}

withDefaults(defineProps<Props>(), {
  version: '',
});
</script>

<style scoped>
.app-footer {
  margin-top: auto;
  padding: var(--spacing-lg) 0;
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border-primary);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  gap: var(--spacing-md);
}

.footer-info {
  flex: 1;
}

.copyright {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.version {
  margin: var(--spacing-xs) 0 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.footer-links {
  display: flex;
  gap: var(--spacing-md);
}

.footer-link {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}

.footer-link:hover {
  color: var(--color-primary);
}

/* Mobile Styles */
@media (max-width: 767px) {
  .footer-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 var(--spacing-sm);
  }

  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-sm);
  }
}
</style>