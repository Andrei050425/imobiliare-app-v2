<template>
  <div>
    <h1 style="font-size: 1.6rem; font-weight: 600; margin-bottom: 16px;">Oferte Recente</h1>
    
    <div v-if="loading" class="text-center">Se încarcă...</div>

    <div v-else class="property-grid">
      <n-card 
        v-for="prop in properties" 
        :key="prop.id"
        class="item-card"
        :bordered="true"
        hoverable
      >
        <template #cover>
          <img :src="getImageUrl(prop.image_path)" style="height: 200px; width: 100%; object-fit: cover;" />
        </template>
        <template #header>{{ prop.title }}</template>
        <div style="margin-bottom: 8px;">
          <n-tag type="info" size="small">{{ prop.category_name }}</n-tag>
        </div>
        <div style="font-weight: 700; color: #6366f1;">{{ prop.price }} EUR</div>
        <div style="color: #94a3b8;">{{ prop.area }} mp | {{ prop.address }}</div>
        <template #action>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <n-button secondary @click="goToDetails(prop.id)">
              <template #icon><n-icon><i class="material-icons">visibility</i></n-icon></template>
              Detalii
            </n-button>
            <n-button v-if="canDelete(prop)" type="error" size="small" @click="deleteProperty(prop.id)">
              <template #icon><n-icon><i class="material-icons">delete</i></n-icon></template>
            </n-button>
          </div>
        </template>
      </n-card>
      
      <div v-if="properties.length === 0" class="text-center" style="grid-column: 1 / -1;">
        <p>Nu există anunțuri momentan. Fii primul care adaugă!</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { NCard, NButton, NTag, NIcon } from 'naive-ui';
import api from '../services/api';

export default {
  components: { NCard, NButton, NTag, NIcon },
  setup() {
    const properties = ref([]);
    const loading = ref(true);
    const store = useStore();
    const router = useRouter();

    const currentUser = computed(() => store.getters.currentUser);
    const isAdmin = computed(() => store.getters.isAdmin);

    const fetchProperties = async () => {
      try {
        const res = await api.get('/properties');
        properties.value = res.data;
      } catch (err) {
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const getImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/300';
      const cleanPath = path.replace(/\\/g, "/");
      return `http://localhost:3000/${cleanPath}`; 
    };

    const canDelete = (prop) => {
      if (!currentUser.value) return false;
      if (isAdmin.value) return true;
      return prop.user_id === currentUser.value.id; 
    };

    const deleteProperty = async (id) => {
      if (!confirm('Ești sigur că vrei să ștergi acest anunț?')) return;
      try {
        await api.delete(`/properties/${id}`);
        properties.value = properties.value.filter(p => p.id !== id);
      } catch (err) {
        alert('Eroare la ștergere.');
      }
    };

    const goToDetails = (id) => {
      router.push(`/property/${id}`);
    };

    onMounted(fetchProperties);

    return { 
      properties, 
      loading, 
      getImageUrl, 
      canDelete, 
      deleteProperty, 
      goToDetails
    };
  }
}
</script>

<style scoped>
.property-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.item-card { transition: transform 0.2s; border-radius: 12px; overflow: hidden; }
.item-card:hover { transform: translateY(-5px); }
.text-center { text-align: center; }
</style>