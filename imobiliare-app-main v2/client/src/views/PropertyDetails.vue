<template>
  <div v-if="loading" class="text-center mt-5">
    <va-progress-circle indeterminate />
  </div>

  <div v-else-if="!property" class="text-center mt-5">
    <h3>Anunțul nu a fost găsit.</h3>
    <va-button to="/">Înapoi la oferte</va-button>
  </div>

  <div v-else class="row justify-center pb-4">
    <div class="flex xs12 lg10">
      <va-button preset="secondary" icon="arrow_back" @click="$router.back()" class="mb-3">
        Înapoi
      </va-button>

      <va-card>
        <va-image 
          :src="getImageUrl(property.images?.[0]?.path)" 
          style="height: 400px; width: 100%;"
          fit="cover"
        />

        <va-card-content>
          <div class="row">
            <div class="flex xs12 md8">
              <h1 class="display-2 mb-2">{{ property.title }}</h1>
              
              <div class="mb-4">
                 <va-chip color="info" class="mr-2">{{ property.category_name }}</va-chip>
                 <span class="text--secondary"><va-icon name="location_on" size="small"/> {{ property.address }}</span>
              </div>

              <h3 class="mt-4">Descriere</h3>
              <p style="white-space: pre-line;">{{ property.description }}</p>
            </div>

            <div class="flex xs12 md4">
              <va-card color="background-element" class="mt-3 md-mt-0">
                <va-card-content>
                  <div class="display-6 text-primary mb-3 text-center">
                    {{ property.price }} EUR
                  </div>
                  
                  <va-divider />
                  
                  <div class="row mt-3">
                    <div class="flex xs6 text-center">
                      <va-icon name="square_foot" color="secondary" />
                      <div class="text--bold">{{ property.area }} mp</div>
                    </div>
                    <div class="flex xs6 text-center">
                      <va-icon name="person" color="secondary" />
                      <div>{{ property.owner_name || 'Proprietar' }}</div>
                    </div>
                  </div>

                  <div class="mt-4" v-if="property.status === 'FREE'">
                    <va-button block color="primary" @click="requestOffer">
                      Cerere ofertă
                    </va-button>
                  </div>
                  <div class="mt-4" v-else>
                    <va-alert color="info" outline class="text-center w-full">
                      Acest spațiu nu mai este disponibil pentru închiriere.
                    </va-alert>
                  </div>
                </va-card-content>
              </va-card>
            </div>
          </div>
        </va-card-content>
      </va-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'vuestic-ui';
import api from '../services/api';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const { init: notify } = useToast();
    
    const property = ref(null);
    const loading = ref(true);

    const fetchProperty = async () => {
      try {
        // Luam ID-ul din URL (ex: /property/5)
        const id = route.params.id;
        const res = await api.get(`/properties/${id}`);
        property.value = res.data;
      } catch (err) {
        console.error(err);
        notify({ message: 'Nu am putut încărca anunțul', color: 'danger' });
      } finally {
        loading.value = false;
      }
    };

    const getImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/600x400?text=Fara+Poza';
      const cleanPath = path.replace(/\\/g, "/");
      return `http://localhost:3000/${cleanPath}`; 
    };

    const requestOffer = async () => {
        if (!store.getters.isLoggedIn) {
          notify({ message: 'Trebuie să te loghezi pentru a cere o ofertă.', color: 'warning' });
          router.push('/login');
          return;
        }

        try {
          await api.post('/offers', { property_id: route.params.id });
          notify({ message: 'Cererea ta de ofertă a fost trimisă cu succes!', color: 'success' });
        } catch (err) {
          const msg = err.response?.data?.error || err.response?.data?.message || err.message;
          notify({ message: `A apărut o eroare: ${msg}`, color: 'danger' });
        }
    };

    onMounted(fetchProperty);

    return { property, loading, getImageUrl, requestOffer };
  }
}
</script>