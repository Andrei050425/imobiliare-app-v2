<template>
  <div>
    <div class="page-title">Utilizatori</div>
    <va-card>
      <va-card-content>
        <va-data-table :items="users" :columns="cols" :loading="loading">
          <template #cell(role)="{ value }"><va-badge :color="R[value]?.color" :text="R[value]?.label || value" /></template>
          <template #cell(actions)="{ row }">
            <va-button preset="plain" color="danger" icon="delete" @click="remove(row.source.id)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'vuestic-ui';
import api from '../services/api';
import { ROLE } from '../services/labels';

export default {
  name: 'Users',
  setup() {
    const { init } = useToast();
    const users = ref([]);
    const loading = ref(false);
    const cols = [
      { key: 'full_name', label: 'Nume' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Rol' },
      { key: 'actions', label: '' },
    ];
    const load = async () => {
      loading.value = true;
      try { users.value = (await api.get('/users')).data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    const remove = async (id) => {
      if (!confirm('Ștergi utilizatorul?')) return;
      try { await api.delete(`/users/${id}`); init({ message: 'Șters.', color: 'success' }); load(); }
      catch (e) { init({ message: 'Eroare.', color: 'danger' }); }
    };
    onMounted(load);
    return { users, loading, cols, R: ROLE, remove };
  }
};
</script>
