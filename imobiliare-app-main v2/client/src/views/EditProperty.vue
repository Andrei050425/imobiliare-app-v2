<template>
  <div v-if="loadingInit" class="text-center mt-5">
    <va-progress-circle indeterminate />
  </div>
  <div v-else class="row justify-center pb-4">
    <div class="flex xs12 md10 lg8">
      <va-button preset="secondary" icon="arrow_back" @click="$router.back()" class="mb-3">Înapoi</va-button>
      <va-card stripe stripe-color="primary">
        <va-card-title>
          <va-icon name="edit" class="mr-2" color="primary" />
          Editează Spațiul Comercial
        </va-card-title>

        <va-card-content>
          <va-form ref="formRef" @submit.prevent="onSubmit">
            <div class="row">
              <div class="flex xs12 md6">
                <h4 class="va-h6 mb-3" style="color: var(--va-secondary)">
                  Detalii de bază
                </h4>

                <va-input v-model="form.title" label="Titlu Anunț" class="mb-3 w-full" :rules="[rules.required, rules.minLength(5)]" />

                <va-select v-model="form.category_id" :options="categories" text-by="name" value-by="id" label="Categorie" class="mb-3 w-full" :rules="[rules.required]" />

                <div class="row">
                  <div class="flex xs6 pr-2">
                    <va-input v-model.number="form.price" label="Preț" class="w-full" :rules="[rules.required, rules.positiveNumber]">
                      <template #appendInner>EUR</template>
                    </va-input>
                  </div>
                  <div class="flex xs6 pl-2">
                    <va-input v-model.number="form.area" label="Suprafață" type="number" class="w-full" :rules="[rules.required, rules.positiveNumber]">
                      <template #appendInner>m²</template>
                    </va-input>
                  </div>
                </div>

                <va-input v-model="form.address" label="Adresa Exactă" icon="location_on" class="mt-3 w-full" :rules="[rules.required]" />
                <va-select v-model="form.sector" :options="sectors" label="Sector" class="mt-3 w-full" />
              </div>

              <div class="flex xs12 md6 pl-md-4">
                <h4 class="va-h6 mb-3" style="color: var(--va-secondary)">
                  Descriere
                </h4>
                <va-textarea v-model="form.description" label="Descriere Detaliată" :min-rows="5" :max-rows="8" class="mb-3 w-full" :rules="[rules.minLength(10)]" />
                
                <va-select v-model="form.status" :options="statusOptions" text-by="label" value-by="value" label="Status Curent" class="mt-3 w-full" :disabled="hasLinkedContract" />
                <p v-if="hasLinkedContract" class="mt-1" style="color: var(--va-warning); font-size: 0.8rem;">⚠️ Statusul este gestionat automat — acest spațiu are un contract activ sau în curs de validare.</p>
              </div>
            </div>

            <div class="d-flex justify-end mt-3">
              <va-button type="submit" icon="save" :loading="loading">Salvează Modificările</va-button>
            </div>
          </va-form>
        </va-card-content>
      </va-card>

      <va-card class="mt-4">
        <va-card-title>
          <va-icon name="collections" class="mr-2" color="info" />
          Galerie Imagini
        </va-card-title>
        <va-card-content>
          <div class="row">
            <div v-for="img in form.images" :key="img.id" class="flex xs6 sm4 md3 mb-3 text-center position-relative">
              <img :src="getImageUrl(img.path)" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;" />
              <va-button color="danger" size="small" icon="delete" class="mt-2" @click="deleteImage(img.id)">Șterge</va-button>
            </div>
            <div v-if="!form.images || form.images.length === 0" class="flex xs12 text-center text--secondary">
              Nicio imagine disponibilă.
            </div>
          </div>
          
          <va-divider class="my-3" />
          
          <h4 class="va-h6 mb-3" style="color: var(--va-secondary)">Adaugă Imagine Nouă</h4>
          <div class="mb-3 p-3 text-center" style="border: 1px dashed var(--va-secondary); border-radius: 8px;">
            <input id="new-image-input" type="file" @change="uploadNewImage" accept="image/*" style="display: none" />
            <va-button preset="secondary" icon="cloud_upload" @click="triggerImageUpload" type="button" :loading="uploadingImage">
              Selectează și Încarcă Imagine
            </va-button>
          </div>
        </va-card-content>
      </va-card>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast, useForm } from "vuestic-ui";
import api from "../services/api";
import { SPACE_STATUS } from '../services/labels';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { init: notify } = useToast();
    const { validate } = useForm("formRef");

    const loadingInit = ref(true);
    const loading = ref(false);
    const uploadingImage = ref(false);

    const categories = [
      { id: 1, name: "Birouri" },
      { id: 2, name: "Comercial / Retail" },
      { id: 3, name: "Industrial / Hale" },
      { id: 4, name: "Terenuri" },
    ];
    
    const statusOptions = Object.entries(SPACE_STATUS).map(([value, v]) => ({ value, label: v.label }));
    const hasLinkedContract = ref(false);

    const form = reactive({
      id: null,
      title: "",
      description: "",
      price: "",
      area: "",
      address: "",
      sector: null,
      category_id: null,
      status: "",
      images: []
    });

    const sectors = ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"];

    const rules = {
      required: (v) => !!v || "Acest câmp este obligatoriu",
      positiveNumber: (v) => v > 0 || "Trebuie să fie un număr pozitiv",
      minLength: (min) => (v) => (v && v.length >= min) || `Minim ${min} caractere`,
    };

    const fetchProperty = async () => {
      try {
        const id = route.params.id;
        const res = await api.get(`/properties/${id}`);
        Object.assign(form, res.data);
        hasLinkedContract.value = !!res.data.hasLinkedContract;
      } catch (err) {
        console.error(err);
        notify({ message: 'Eroare la preluarea datelor', color: 'danger' });
        router.push('/app/properties');
      } finally {
        loadingInit.value = false;
      }
    };

    const getImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/300x200?text=Fara+Poza';
      return `http://localhost:3000/${path.replace(/\\/g, "/")}`;
    };

    const onSubmit = async () => {
      if (!validate()) {
        notify({ message: "Verifică formularul!", color: "warning" });
        return;
      }
      loading.value = true;
      try {
        await api.put(`/properties/${form.id}`, {
          title: form.title,
          description: form.description,
          price: form.price,
          area: form.area,
          address: form.address,
          sector: form.sector,
          category_id: form.category_id,
          status: form.status
        });
        notify({ message: "Spațiu actualizat cu succes!", color: "success" });
      } catch (err) {
        notify({ message: "Eroare la actualizare.", color: "danger" });
      } finally {
        loading.value = false;
      }
    };

    const triggerImageUpload = () => {
      document.getElementById("new-image-input").click();
    };

    const uploadNewImage = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      uploadingImage.value = true;
      try {
        const formData = new FormData();
        formData.append("image", file);
        
        const res = await api.post(`/properties/${form.id}/images`, formData, {
          headers: { "Content-Type": undefined }
        });
        
        form.images.push(res.data);
        notify({ message: "Imagine adăugată cu succes!", color: "success" });
      } catch (err) {
        notify({ message: "Eroare la încărcarea imaginii.", color: "danger" });
      } finally {
        uploadingImage.value = false;
        event.target.value = ''; // Reset input
      }
    };

    const deleteImage = async (imageId) => {
      if (!confirm("Sigur vrei să ștergi această imagine?")) return;
      try {
        await api.delete(`/properties/${form.id}/images/${imageId}`);
        form.images = form.images.filter(img => img.id !== imageId);
        notify({ message: "Imagine ștearsă.", color: "success" });
      } catch (err) {
        notify({ message: "Eroare la ștergerea imaginii.", color: "danger" });
      }
    };

    onMounted(fetchProperty);

    return {
      form, sectors, categories, statusOptions, hasLinkedContract, loadingInit, loading, uploadingImage,
      rules, onSubmit, getImageUrl, triggerImageUpload, uploadNewImage, deleteImage
    };
  },
};
</script>

<style scoped>
.w-full { width: 100%; }
.position-relative { position: relative; }
</style>
