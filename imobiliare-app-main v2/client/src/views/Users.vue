<template>
  <div>
    <div class="page-title">Utilizatori</div>
    <div class="neo-table-card">
      <div v-if="loading" class="text-center py-5"><n-spin size="large" /></div>
      <table v-else class="neo-table">
        <thead>
          <tr>
            <th>Utilizator</th>
            <th>Email</th>
            <th>Rol</th>
            <th style="text-align: right;">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in users" :key="item.id">
            <td>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(99,102,241,0.2); color: #818cf8; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                  {{ (item.full_name || 'U')[0].toUpperCase() }}
                </div>
                <strong style="color: white;">{{ item.full_name }}</strong>
              </div>
            </td>
            <td>{{ item.email }}</td>
            <td>
              <span class="role-badge" :class="item.role === 'admin' ? 'role-admin' : item.role === 'client' ? 'role-client' : 'role-user'">
                {{ item.role === 'admin' ? 'Administrator' : item.role === 'client' ? 'Chiriaș / Client' : 'Utilizator' }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button v-if="item.role !== 'admin'" class="icon-btn danger" title="Șterge utilizator" @click="remove(item.id)"><i class="material-icons" style="font-size:18px">delete</i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
