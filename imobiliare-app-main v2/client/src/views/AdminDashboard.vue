<template>
  <div class="admin-dashboard">
    <h1 class="display-5 mb-4">Panou Administrator</h1>

    <va-card>
      <va-card-content>
        <va-tabs v-model="activeTab" class="mb-4">
          <va-tab name="users">Utilizatori</va-tab>
          <va-tab name="properties">Anunțuri Imobiliare</va-tab>
        </va-tabs>

        <div v-if="activeTab === 'users'">
          <div class="mb-3">
            <va-alert color="info" outline>
              Atenție: Ștergerea unui utilizator va șterge automat și toate anunțurile acestuia!
            </va-alert>
          </div>
          
          <va-data-table 
            :items="users" 
            :columns="userColumns" 
            hoverable
          >
            <template #cell(actions)="{ row }">
              <va-button 
                preset="plain" 
                icon="delete" 
                color="danger" 
                @click="deleteUser(row.rowData.id)"
                :disabled="row.rowData.role === 'admin'" 
              />
            </template>
          </va-data-table>
        </div>

        <div v-if="activeTab === 'properties'">
          <va-data-table 
            :items="properties" 
            :columns="propColumns" 
            hoverable
          >
            <template #cell(price)="{ value }">
              <strong>{{ value }} €</strong>
            </template>
            
            <template #cell(actions)="{ row }">
              <va-button 
                preset="plain" 
                icon="visibility" 
                color="primary" 
                class="mr-2"
                @click="$router.push(`/property/${row.rowData.id}`)"
              />
              <va-button 
                preset="plain" 
                icon="delete" 
                color="danger" 
                @click="deleteProperty(row.rowData.id)"
              />
            </template>
          </va-data-table>
        </div>

      </va-card-content>
    </va-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../services/api';

export default {
  setup() {
    const activeTab = ref('users');
    const users = ref([]);
    const properties = ref([]);

    // Definire coloane tabel
    const userColumns = [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'full_name', label: 'Nume', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Rol', sortable: true },
      { key: 'actions', label: 'Acțiuni', width: '80px' },
    ];

    const propColumns = [
      { key: 'id', label: 'ID', sortable: true, width: '60px' },
      { key: 'title', label: 'Titlu', sortable: true },
      { key: 'category_name', label: 'Categorie', sortable: true },
      { key: 'price', label: 'Preț', sortable: true },
      { key: 'actions', label: 'Acțiuni', width: '120px' },
    ];

    // --- FETCH DATA ---
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

    // --- ACTIONS ---
    const deleteUser = async (id) => {
      if(!confirm("Sigur ștergi acest utilizator?")) return;
      try {
        await api.delete(`/users/${id}`);
        users.value = users.value.filter(u => u.id !== id);
        // Reîncărcăm și proprietățile pentru că s-au șters automat cele ale userului
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
}
</script>