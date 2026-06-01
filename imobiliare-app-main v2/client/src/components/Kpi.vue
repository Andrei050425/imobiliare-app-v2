<template>
  <va-card class="kpi-card mb-3">
    <va-card-content>
      <div class="d-flex justify-space-between align-start">
        <div>
          <div class="kpi-label">{{ label }}</div>
          <div class="kpi-value" :class="'text-' + (color || 'primary')">{{ value }}</div>
          <div v-if="sub" class="kpi-sub">{{ sub }}</div>
        </div>
        <va-icon v-if="icon" :name="icon" size="large" :color="color || 'primary'" />
      </div>
    </va-card-content>
  </va-card>
</template>

<script>
export default {
  name: 'Kpi',
  props: {
    label: String,
    value: [String, Number],
    sub: String,
    icon: String,
    color: String,
  },
};
</script>

<style scoped>
.kpi-card { height: 100%; }
.kpi-label { color: #6b7280; font-size: 0.85rem; }
.kpi-value { font-size: 1.6rem; font-weight: 700; margin-top: 4px; }
.kpi-sub { color: #9ca3af; font-size: 0.8rem; margin-top: 2px; }
.text-danger { color: var(--va-danger); }
.text-warning { color: var(--va-warning); }
.text-primary { color: var(--va-primary); }
</style>
