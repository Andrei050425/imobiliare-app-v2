<template>
  <n-card class="kpi-card">
    <div class="kpi-layout">
      <div>
        <div class="kpi-label">{{ label }}</div>
        <div class="kpi-value" :style="{ color: colorValue }">{{ value }}</div>
        <div v-if="sub" class="kpi-sub">{{ sub }}</div>
      </div>
      <div v-if="icon">
        <n-button
          v-if="iconButton"
          quaternary
          circle
          :type="colorType"
          size="large"
          :title="iconTitle || 'Vezi istoric lunar'"
          @click.stop="$emit('icon-click')"
          class="kpi-action-btn"
        >
          <template #icon><n-icon size="22"><i class="material-icons">{{ icon }}</i></n-icon></template>
        </n-button>
        <n-icon v-else size="28" :color="colorValue"><i class="material-icons">{{ icon }}</i></n-icon>
      </div>
    </div>
  </n-card>
</template>

<script>
import { computed } from 'vue';
import { NCard, NButton, NIcon } from 'naive-ui';
export default {
  name: 'Kpi',
  components: { NCard, NButton, NIcon },
  props: {
    label: String,
    value: [String, Number],
    sub: String,
    icon: String,
    color: String,
    iconButton: Boolean,
    iconTitle: String,
  },
  emits: ['icon-click'],
  setup(props) {
    const colorMap = {
      danger: '#ef4444',
      warning: '#f59e0b',
      primary: '#6366f1',
      success: '#10b981',
      info: '#3b82f6',
    };
    const typeMap = {
      danger: 'error',
      warning: 'warning',
      primary: 'primary',
      success: 'success',
      info: 'info',
    };
    const colorValue = computed(() => colorMap[props.color] || colorMap.primary);
    const colorType = computed(() => typeMap[props.color] || 'primary');
    return { colorValue, colorType };
  }
};
</script>

<style scoped>
.kpi-card { height: 100%; margin-bottom: 12px; }
.kpi-layout { display: flex; justify-content: space-between; align-items: flex-start; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; }
.kpi-value { font-size: 1.6rem; font-weight: 700; margin-top: 4px; }
.kpi-sub { color: #64748b; font-size: 0.8rem; margin-top: 2px; }
.kpi-action-btn {
  cursor: pointer;
  transform: scale(1.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 12px;
}
.kpi-action-btn:hover {
  transform: scale(1.25);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>
