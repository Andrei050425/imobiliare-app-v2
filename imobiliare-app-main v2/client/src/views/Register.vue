<template>
  <div class="row justify-center mt-5">
    <div class="flex xs12 md6">
      <va-card>
        <va-card-title>Creează cont nou</va-card-title>
        <va-card-content>
          <form @submit.prevent="onSubmit">
            <va-input
              v-model="form.full_name"
              label="Nume Complet"
              class="mb-3"
              required
            />
            <va-input
              v-model="form.email"
              type="email"
              label="Email"
              class="mb-3"
              required
            />
            <va-input
              v-model="form.password"
              type="password"
              label="Parola"
              class="mb-3"
              required
            />
            
            <div v-if="error" class="mb-3" style="color: var(--va-danger);">
              {{ error }}
            </div>

            <va-button type="submit" class="w-100">Înregistrează-te</va-button>
          </form>
          <div class="mt-3 text-center">
            Ai deja cont? <router-link to="/login">Loghează-te</router-link>
          </div>
        </va-card-content>
      </va-card>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
    const error = ref(null);

    const form = reactive({
      full_name: '',
      email: '',
      password: ''
    });

    const onSubmit = async () => {
      try {
        await store.dispatch('register', form);
        // După register, trimitem userul la login
        router.push('/login');
      } catch (err) {
        error.value = err.response?.data?.message || 'Eroare la înregistrare';
      }
    };

    return { form, onSubmit, error };
  }
}
</script> 