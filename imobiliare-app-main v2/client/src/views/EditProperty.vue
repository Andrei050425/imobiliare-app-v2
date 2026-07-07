<template>
  <div v-if="loadingInit" style="display: flex; justify-content: center; padding: 40px;">
    <n-spin size="large" />
  </div>
  <div v-else style="display: flex; justify-content: center; padding-bottom: 24px;">
    <div style="width: 100%; max-width: 900px;">
      <n-button secondary @click="$router.back()" style="margin-bottom: 12px;">
        <template #icon><n-icon><i class="material-icons">arrow_back</i></n-icon></template>
        Înapoi
      </n-button>

      <n-card>
        <template #header>
          <div style="display: flex; align-items: center; gap: 8px;">
            <n-icon size="20" color="#6366f1"><i class="material-icons">edit</i></n-icon>
            Editează Spațiul Comercial
          </div>
        </template>

        <form @submit.prevent="onSubmit">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <h4 style="color: #94a3b8; margin-bottom: 12px;">Detalii de bază</h4>
              <n-form-item label="Titlu Anunț"><n-input v-model:value="form.title" /></n-form-item>
              <n-form-item label="Categorie">
                <n-select v-model:value="form.category_id" :options="categories" label-field="name" value-field="id" />
              </n-form-item>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <n-form-item label="Preț"><n-input-number v-model:value="form.price" :min="0"><template #suffix>EUR</template></n-input-number></n-form-item>
                <n-form-item label="Suprafață"><n-input-number v-model:value="form.area" :min="0"><template #suffix>m²</template></n-input-number></n-form-item>
              </div>
              <n-form-item label="Adresa Exactă"><n-input v-model:value="form.address" /></n-form-item>
              <n-form-item label="Sector"><n-select v-model:value="form.sector" :options="sectorOpts" clearable /></n-form-item>
            </div>

            <div>
              <h4 style="color: #94a3b8; margin-bottom: 12px;">Descriere</h4>
              <n-form-item label="Descriere Detaliată"><n-input v-model:value="form.description" type="textarea" :rows="5" /></n-form-item>
              <n-form-item label="Status Curent">
                <n-select v-model:value="form.status" :options="statusOptions" :disabled="hasLinkedContract" />
              </n-form-item>
              <p v-if="hasLinkedContract" style="color: #f59e0b; font-size: 0.8rem;">⚠️ Statusul este gestionat automat — acest spațiu are un contract activ sau în curs de validare.</p>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
            <n-button type="primary" attr-type="submit" :loading="loading">
              <template #icon><n-icon><i class="material-icons">save</i></n-icon></template>
              Salvează Modificările
            </n-button>
          </div>
        </form>
      </n-card>

      <n-card style="margin-top: 16px;">
        <template #header>
          <div style="display: flex; align-items: center; gap: 8px;">
            <n-icon size="20" color="#3b82f6"><i class="material-icons">collections</i></n-icon>
            Galerie Imagini
          </div>
        </template>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
          <div v-for="img in form.images" :key="img.id" style="text-align: center;">
            <img :src="getImageUrl(img.path)" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);" />
            <n-button type="error" size="small" style="margin-top: 8px;" @click="deleteImage(img.id)">
              <template #icon><n-icon><i class="material-icons">delete</i></n-icon></template>
              Șterge
            </n-button>
          </div>
          <div v-if="!form.images || form.images.length === 0" style="grid-column: 1 / -1; text-align: center; color: #64748b;">
            Nicio imagine disponibilă.
          </div>
        </div>
        <n-divider />
        <h4 style="color: #94a3b8; margin-bottom: 12px;">Adaugă Imagine Nouă</h4>
        <div style="border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 16px; text-align: center;">
          <input id="new-image-input" type="file" @change="uploadNewImage" accept="image/*" style="display: none" />
          <n-button secondary @click="triggerImageUpload" type="button" :loading="uploadingImage">
            <template #icon><n-icon><i class="material-icons">cloud_upload</i></n-icon></template>
            Selectează și Încarcă Imagine
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMessage, NCard, NInput, NInputNumber, NSelect, NButton, NFormItem, NDivider, NSpin, NIcon } from "naive-ui";
import api from "../services/api";
import { SPACE_STATUS } from '../services/labels';

export default {
  components: { NCard, NInput, NInputNumber, NSelect, NButton, NFormItem, NDivider, NSpin, NIcon },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const loadingInit = ref(true);
    const loading = ref(false);
    const uploadingImage = ref(false);

    const categories = [
      { id: 1, name: "Birouri" }, { id: 2, name: "Comercial / Retail" },
      { id: 3, name: "Industrial / Hale" }, { id: 4, name: "Terenuri" },
    ];
    const statusOptions = Object.entries(SPACE_STATUS).map(([value, v]) => ({ value, label: v.label }));
    const hasLinkedContract = ref(false);

    const form = reactive({
      id: null, title: "", description: "", price: null, area: null,
      address: "", sector: null, category_id: null, status: "", images: []
    });

    const sectorOpts = [
      { value: "Sector 1", label: "Sector 1" }, { value: "Sector 2", label: "Sector 2" },
      { value: "Sector 3", label: "Sector 3" }, { value: "Sector 4", label: "Sector 4" },
      { value: "Sector 5", label: "Sector 5" }, { value: "Sector 6", label: "Sector 6" },
    ];

    const fetchProperty = async () => {
      try {
        const id = route.params.id;
        const res = await api.get(`/properties/${id}`);
        Object.assign(form, res.data);
        hasLinkedContract.value = !!res.data.hasLinkedContract;
      } catch (err) {
        console.error(err);
        message.error('Eroare la preluarea datelor');
        router.push('/app/properties');
      } finally { loadingInit.value = false; }
    };

    const getImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/300x200?text=Fara+Poza';
      return `http://localhost:3000/${path.replace(/\\/g, "/")}`;
    };

    const onSubmit = async () => {
      if (!form.title || !form.category_id) { message.warning("Verifică formularul!"); return; }
      loading.value = true;
      try {
        await api.put(`/properties/${form.id}`, {
          title: form.title, description: form.description, price: form.price,
          area: form.area, address: form.address, sector: form.sector,
          category_id: form.category_id, status: form.status
        });
        message.success("Spațiu actualizat cu succes!");
      } catch (err) { message.error("Eroare la actualizare."); }
      finally { loading.value = false; }
    };

    const triggerImageUpload = () => { document.getElementById("new-image-input").click(); };

    const uploadNewImage = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      uploadingImage.value = true;
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await api.post(`/properties/${form.id}/images`, formData, { headers: { "Content-Type": undefined } });
        form.images.push(res.data);
        message.success("Imagine adăugată cu succes!");
      } catch (err) { message.error("Eroare la încărcarea imaginii."); }
      finally { uploadingImage.value = false; event.target.value = ''; }
    };

    const deleteImage = async (imageId) => {
      if (!confirm("Sigur vrei să ștergi această imagine?")) return;
      try {
        await api.delete(`/properties/${form.id}/images/${imageId}`);
        form.images = form.images.filter(img => img.id !== imageId);
        message.success("Imagine ștearsă.");
      } catch (err) { message.error("Eroare la ștergerea imaginii."); }
    };

    onMounted(fetchProperty);
    return { form, sectorOpts, categories, statusOptions, hasLinkedContract, loadingInit, loading, uploadingImage, onSubmit, getImageUrl, triggerImageUpload, uploadNewImage, deleteImage };
  },
};
</script>
