<template>
  <div class="auth-wrapper">
    <div class="auth-card-container">
      <n-card title="Autentificare" :bordered="true" class="auth-card">
        <form @submit.prevent="onSubmit">
          <n-form-item label="Email">
            <n-input v-model:value="form.email" type="text" placeholder="Email" />
          </n-form-item>
          <n-form-item label="Parola">
            <n-input v-model:value="form.password" type="password" placeholder="Parola" show-password-on="click" />
          </n-form-item>
          
          <div v-if="error" class="error-msg">
            {{ error }}
          </div>

          <n-button type="primary" attr-type="submit" block>Logare</n-button>
        </form>
        <div class="auth-footer">
          Nu ai cont? <router-link to="/register">Creează unul</router-link>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { NCard, NInput, NButton, NFormItem } from 'naive-ui';

export default {
  components: { NCard, NInput, NButton, NFormItem },
  setup() {
    const store = useStore();
    const router = useRouter();
    const error = ref(null);

    const form = reactive({
      email: '',
      password: ''
    });

    const onSubmit = async () => {
      try {
        await store.dispatch('login', form);
        const role = store.getters.userRole;
        if (role === 'user') {
          router.push('/');
        } else {
          router.push('/app/dashboard');
        }
      } catch (err) {
        error.value = err.response?.data?.message || 'Date incorecte';
      }
    };

    return { form, onSubmit, error };
  }
}
</script>

<style scoped>
.auth-wrapper { display: flex; justify-content: center; padding-top: 60px; }
.auth-card-container { width: 100%; max-width: 440px; }
.auth-card { border-radius: 12px; }
.error-msg { color: #ef4444; margin-bottom: 12px; font-size: 0.9rem; }
.auth-footer { margin-top: 16px; text-align: center; color: #94a3b8; }
.auth-footer a { color: #6366f1; }
</style>

<style>
/* Fix pentru autofill-ul din browser în dark mode pe pagina de Login */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px #26262a inset !important;
  -webkit-text-fill-color: #e2e8f0 !important;
  caret-color: #e2e8f0 !important;
}
</style>