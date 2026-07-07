<template>
  <div style="display: flex; justify-content: center; padding-bottom: 24px;">
    <div style="width: 100%; max-width: 900px;">
      <n-card>
        <template #header>
          <div style="display: flex; align-items: center; gap: 8px;">
            <n-icon size="20" color="#6366f1"><i class="material-icons">add_business</i></n-icon>
            Publică un Spațiu Comercial
          </div>
        </template>

        <form @submit.prevent="onSubmit">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <h4 style="color: #94a3b8; margin-bottom: 12px;">Detalii de bază</h4>
              <n-form-item label="Titlu Anunț"><n-input v-model:value="form.title" placeholder="Titlu" /></n-form-item>
              <n-form-item label="Categorie">
                <n-select v-model:value="form.category_id" :options="categories" label-field="name" value-field="id" />
              </n-form-item>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <n-form-item label="Preț">
                  <n-input-number v-model:value="form.price" :min="0">
                    <template #suffix>EUR</template>
                  </n-input-number>
                </n-form-item>
                <n-form-item label="Suprafață">
                  <n-input-number v-model:value="form.area" :min="0">
                    <template #suffix>m²</template>
                  </n-input-number>
                </n-form-item>
              </div>
              <n-form-item label="Adresa Exactă"><n-input v-model:value="form.address" placeholder="Adresa" /></n-form-item>
              <n-form-item label="Sector">
                <n-select v-model:value="form.sector" :options="sectorOpts" clearable />
              </n-form-item>
            </div>

            <div>
              <h4 style="color: #94a3b8; margin-bottom: 12px;">Media & Descriere</h4>
              <div style="border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 12px;">
                <input id="real-file-input" type="file" @change="updateFileName" accept="image/*" style="display: none" />
                <n-button secondary @click="triggerClick" type="button">
                  <template #icon><n-icon><i class="material-icons">cloud_upload</i></n-icon></template>
                  Alege Imagine
                </n-button>
                <div style="margin-top: 8px; color: #94a3b8;">
                  <span v-if="displayFileName" style="color: #10b981; font-weight: bold;">
                    <n-icon size="14"><i class="material-icons">check</i></n-icon>
                    {{ displayFileName }}
                  </span>
                  <span v-else>Niciun fișier selectat</span>
                </div>
              </div>
              <n-form-item label="Descriere Detaliată">
                <n-input v-model:value="form.description" type="textarea" :rows="5" />
              </n-form-item>
            </div>
          </div>

          <n-divider />

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <n-button secondary @click="$router.push('/app/properties')">Anulează</n-button>
            <n-button type="primary" attr-type="submit" :loading="loading">
              <template #icon><n-icon><i class="material-icons">send</i></n-icon></template>
              Publică Anunțul
            </n-button>
          </div>
        </form>
      </n-card>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useMessage, NCard, NInput, NInputNumber, NSelect, NButton, NFormItem, NDivider, NIcon } from "naive-ui";
import api from "../services/api";

export default {
  components: { NCard, NInput, NInputNumber, NSelect, NButton, NFormItem, NDivider, NIcon },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const loading = ref(false);
    const displayFileName = ref("");

    const categories = [
      { id: 1, name: "Birouri" },
      { id: 2, name: "Comercial / Retail" },
      { id: 3, name: "Industrial / Hale" },
      { id: 4, name: "Terenuri" },
    ];

    const form = reactive({
      title: "", description: "", price: null, area: null,
      address: "", sector: null, category_id: null,
    });

    const sectorOpts = [
      { value: "Sector 1", label: "Sector 1" }, { value: "Sector 2", label: "Sector 2" },
      { value: "Sector 3", label: "Sector 3" }, { value: "Sector 4", label: "Sector 4" },
      { value: "Sector 5", label: "Sector 5" }, { value: "Sector 6", label: "Sector 6" },
    ];

    const triggerClick = () => { document.getElementById("real-file-input").click(); };
    const updateFileName = (event) => { if (event.target.files[0]) { displayFileName.value = event.target.files[0].name; } };

    const onSubmit = async () => {
      if (!form.title || !form.category_id || !form.price || !form.area || !form.address) {
        message.warning("Verifică formularul! Toate câmpurile obligatorii trebuie completate.");
        return;
      }
      const inputElement = document.getElementById("real-file-input");
      const file = inputElement.files[0];
      if (!file) { message.warning("Selectează o poză!"); return; }

      loading.value = true;
      try {
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description || "");
        formData.append("price", form.price);
        formData.append("area", form.area);
        formData.append("address", form.address);
        formData.append("sector", form.sector || "");
        formData.append("category_id", form.category_id);
        formData.append("image", file);
        await api.post("/properties", formData, { headers: { "Content-Type": undefined } });
        message.success("Succes!");
        router.push("/app/properties");
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || "Eroare la salvare";
        message.error(msg);
      } finally { loading.value = false; }
    };

    return { form, sectorOpts, displayFileName, categories, onSubmit, loading, triggerClick, updateFileName };
  },
};
</script>
