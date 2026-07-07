<template>
  <div>
    <div class="page-title">Utilizatori</div>
    <n-card>
      <n-data-table :columns="columns" :data="users" :loading="loading" :bordered="false" />
    </n-card>
  </div>
</template>

<script>
import { ref, onMounted, h } from 'vue';
import { useMessage, NCard, NDataTable, NButton, NTag, NIcon } from 'naive-ui';
import api from '../services/api';
import { ROLE } from '../services/labels';

export default {
  name: 'Users',
  components: { NCard, NDataTable, NButton, NTag, NIcon },
  setup() {
    const message = useMessage();
    const users = ref([]);
    const loading = ref(false);
    const R = ROLE;
    const roleTypeMap = { admin: 'error', client: 'success', user: 'info' };
    const columns = [
      { title: 'ID', key: 'id' },
      { title: 'Nume', key: 'full_name' },
      { title: 'Email', key: 'email' },
      { title: 'Rol', key: 'role', render(row) { const r = R[row.role]; return h(NTag, { type: roleTypeMap[row.role] || 'default', size: 'small' }, { default: () => r?.label || row.role }); } },
      { title: 'Acțiuni', key: 'actions', width: 80, render(row) {
        if (row.role === 'admin') return null;
        return h(NButton, { text: true, type: 'error', onClick: () => remove(row.id) }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'delete') }) });
      }},
    ];
    const load = async () => {
      loading.value = true;
      try { users.value = (await api.get('/users')).data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    const remove = async (id) => {
      if (!confirm('Ștergi utilizatorul?')) return;
      try { await api.delete(`/users/${id}`); message.success('Șters.'); load(); }
      catch (e) { message.error('Eroare.'); }
    };
    onMounted(load);
    return { users, loading, columns, remove };
  }
};
</script>
