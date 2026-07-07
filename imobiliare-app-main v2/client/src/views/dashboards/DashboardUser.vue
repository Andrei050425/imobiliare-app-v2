<template>
  <div class="text-center mt-5">
    <n-icon size="64" color="#6366f1" class="mb-3"><i class="material-icons">search</i></n-icon>
    <h2 style="font-size: 1.6rem; margin-bottom: 8px;">Bine ai venit!</h2>
    <p style="color: #94a3b8; margin-bottom: 20px;">
      Contul tău a fost creat. Pentru moment, ai acces limitat și poți explora doar catalogul de spații.
    </p>
    <n-button type="primary" tag="a" @click="$router.push('/')">Către Catalogul de Spații</n-button>
  </div>
</template>

<script>
import { NButton, NIcon } from 'naive-ui';
export default {
  name: 'DashboardUser',
  components: { NButton, NIcon },
};
</script>
