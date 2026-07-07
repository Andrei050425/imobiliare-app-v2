<template>
  <div class="admin-dashboard">
    <h1 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; color: #f1f5f9;">Panou Administrator</h1>

    <n-card :bordered="true">
      <n-tabs v-model:value="activeTab" type="segment" style="margin-bottom: 16px;">
        <n-tab-pane name="users" tab="Utilizatori">
          <div style="margin-bottom: 16px;">
            <n-alert type="info" :bordered="true">
              Atenție: Ștergerea unui utilizator va șterge automat și toate anunțurile acestuia!
            </n-alert>
          </div>
          
          <n-data-table 
            :data="users" 
            :columns="userColumns" 
            :bordered="false"
          />
        </n-tab-pane>

        <n-tab-pane name="properties" tab="Anunțuri Imobiliare">
          <n-data-table 
            :data="properties" 
            :columns="propColumns" 
            :bordered="false"
          />
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script>
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NTabs, NTabPane, NAlert, NDataTable, NButton, NIcon } from 'naive-ui';
import api from '../services/api';

export default {
  name: 'AdminDashboard',
  components: { NCard, NTabs, NTabPane, NAlert, NDataTable, NButton, NIcon },
  setup() {
    const activeTab = ref('users');
    const users = ref([]);
    const properties = ref([]);
    const router = useRouter();

    const userColumns = [
      { key: 'id', title: 'ID', sorter: (a, b) => a.id - b.id },
      { key: 'full_name', title: 'Nume', sorter: 'default' },
      { key: 'email', title: 'Email', sorter: 'default' },
      { key: 'role', title: 'Rol', sorter: 'default' },
      { key: 'actions', title: 'Acțiuni', width: 100, render(row) {
        return h(NButton, { 
          text: true, 
          type: 'error', 
          disabled: row.role === 'admin',
          onClick: () => deleteUser(row.id),
          title: 'Șterge utilizator'
        }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'delete') }) });
      }},
    ];

    const propColumns = [
      { key: 'id', title: 'ID', width: 60, sorter: (a, b) => a.id - b.id },
      { key: 'title', title: 'Titlu', sorter: 'default' },
      { key: 'category_name', title: 'Categorie', sorter: 'default' },
      { key: 'price', title: 'Preț', sorter: (a, b) => a.price - b.price, render(row) { return h('strong', null, `${row.price} €`); } },
      { key: 'actions', title: 'Acțiuni', width: 140, render(row) {
        return h('div', { style: 'display: flex; gap: 14px; align-items: center;' }, [
          h(NButton, { text: true, type: 'primary', onClick: () => router.push(`/property/${row.id}`), title: 'Vezi' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          h(NButton, { text: true, type: 'error', onClick: () => deleteProperty(row.id), title: 'Șterge' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'delete') }) }),
        ]);
      }},
    ];

    const loadData = async () => {
      try {
        const [usersRes, propsRes] = await Promise.all([
          api.get('/users'),
          api.get('/properties')
        ]);
        users.value = usersRes.data;
        properties.value = propsRes.data;
      } catch (err) {
        console.error("Eroare la încărcare date admin", err);
      }
    };

    const deleteUser = async (id) => {
      if(!confirm("Sigur ștergi acest utilizator?")) return;
      try {
        await api.delete(`/users/${id}`);
        users.value = users.value.filter(u => u.id !== id);
        const propsRes = await api.get('/properties');
        properties.value = propsRes.data;
      } catch (err) {
        alert("Eroare la ștergere user.");
      }
    };

    const deleteProperty = async (id) => {
      if(!confirm("Sigur ștergi acest anunț?")) return;
      try {
        await api.delete(`/properties/${id}`);
        properties.value = properties.value.filter(p => p.id !== id);
      } catch (err) {
        alert("Eroare la ștergere anunț.");
      }
    };

    onMounted(loadData);

    return { 
      activeTab, users, properties, 
      userColumns, propColumns, 
      deleteUser, deleteProperty 
    };
  }
};
</script>