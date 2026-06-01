<template>
  <div>
    <h1 class="display-5 mb-4">Oferte Recente</h1>
    
    <div v-if="loading" class="text-center">Se încarcă...</div>

    <div v-else class="row">
      <div 
        class="flex xs12 sm6 md4 lg3" 
        v-for="prop in properties" 
        :key="prop.id"
      >
        <va-card class="mb-4 item-card">
          <va-image 
            :src="getImageUrl(prop.image_path)" 
            style="height: 200px;"
            fit="cover"
          />
          <va-card-title>{{ prop.title }}</va-card-title>
          <va-card-content>
            <div class="mb-2">
              <va-badge color="info" :text="prop.category_name" />
            </div>
            <div class="text--bold text-primary">{{ prop.price }} EUR</div>
            <div class="text--secondary">{{ prop.area }} mp | {{ prop.address }}</div>
          </va-card-content>
          
          <va-card-actions align="between">
            <va-button 
              preset="secondary" 
              icon="visibility" 
              @click="goToDetails(prop.id)"
            >
              Detalii
            </va-button>
            
            <va-button 
              v-if="canDelete(prop)" 
              color="danger" 
              icon="delete" 
              size="small"
              @click="deleteProperty(prop.id)"
            />
          </va-card-actions>
        </va-card>
      </div>
      
      <div v-if="properties.length === 0" class="flex xs12 text-center">
        <p>Nu există anunțuri momentan. Fii primul care adaugă!</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'; // 1. Importăm useRouter
import api from '../services/api';

export default {
  setup() {
    const properties = ref([]);
    const loading = ref(true);
    const store = useStore();
    const router = useRouter(); // 2. Inițializăm routerul

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

    // 3. Funcția care face navigarea
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
      goToDetails // Nu uita să o returnezi!
    };
  }
}
</script>

<style scoped>
.item-card { transition: transform 0.2s; }
.item-card:hover { transform: translateY(-5px); }
</style>