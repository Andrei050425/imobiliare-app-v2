<template>
  <div class="row justify-center pb-4">
    <div class="flex xs12 md10 lg8">
      <va-card stripe stripe-color="primary">
        <va-card-title>
          <va-icon name="add_business" class="mr-2" color="primary" />
          Publică un Spațiu Comercial
        </va-card-title>

        <va-card-content>
          <va-form ref="formRef" @submit.prevent="onSubmit">
            <div class="row">
              <div class="flex xs12 md6">
                <h4 class="va-h6 mb-3" style="color: var(--va-secondary)">
                  Detalii de bază
                </h4>

                <va-input
                  v-model="form.title"
                  label="Titlu Anunț"
                  class="mb-3 w-full"
                  :rules="[rules.required, rules.minLength(5)]"
                />

                <va-select
                  v-model="form.category_id"
                  :options="categories"
                  text-by="name"
                  value-by="id"
                  label="Categorie"
                  class="mb-3 w-full"
                  :rules="[rules.required]"
                />

                <div class="row">
                  <div class="flex xs6 pr-2">
                    <va-input
                      v-model.number="form.price"
                      label="Preț"
                      class="w-full"
                      :rules="[rules.required, rules.positiveNumber]"
                    >
                      <template #appendInner>EUR</template>
                    </va-input>
                  </div>
                  <div class="flex xs6 pl-2">
                    <va-input
                      v-model.number="form.area"
                      label="Suprafață"
                      type="number"
                      class="w-full"
                      :rules="[rules.required, rules.positiveNumber]"
                    >
                      <template #appendInner>m²</template>
                    </va-input>
                  </div>
                </div>

                <va-input
                  v-model="form.address"
                  label="Adresa Exactă"
                  icon="location_on"
                  class="mt-3 w-full"
                  :rules="[rules.required]"
                />

                <va-select
                  v-model="form.sector"
                  :options="sectors"
                  label="Sector"
                  class="mt-3 w-full"
                />
              </div>

              <div class="flex xs12 md6 pl-md-4">
                <h4 class="va-h6 mb-3" style="color: var(--va-secondary)">
                  Media & Descriere
                </h4>

                <div
                  class="mb-3 p-3"
                  style="
                    border: 1px dashed var(--va-secondary);
                    border-radius: 8px;
                  "
                >
                  <input
                    id="real-file-input"
                    type="file"
                    @change="updateFileName"
                    accept="image/*"
                    style="display: none"
                  />

                  <div class="text-center">
                    <va-button
                      preset="secondary"
                      icon="cloud_upload"
                      @click="triggerClick"
                      type="button"
                    >
                      Alege Imagine
                    </va-button>

                    <div class="mt-2 text--secondary">
                      <span
                        v-if="displayFileName"
                        style="color: var(--va-success); font-weight: bold"
                      >
                        <va-icon name="check" color="success" size="small" />
                        {{ displayFileName }}
                      </span>
                      <span v-else>Niciun fișier selectat</span>
                    </div>
                  </div>
                </div>

                <va-textarea
                  v-model="form.description"
                  label="Descriere Detaliată"
                  :min-rows="5"
                  :max-rows="8"
                  class="mb-3 w-full"
                  :rules="[rules.minLength(10)]"
                />
              </div>
            </div>

            <va-divider class="my-3" />

            <div class="d-flex justify-end">
              <va-button
                preset="secondary"
                color="secondary"
                class="mr-3"
                @click="$router.push('/app/properties')"
              >
                Anulează
              </va-button>
              <va-button type="submit" icon="send" :loading="loading">
                Publică Anunțul
              </va-button>
            </div>
          </va-form>
        </va-card-content>
      </va-card>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast, useForm } from "vuestic-ui";
import api from "../services/api";

export default {
  setup() {
    const router = useRouter();
    const { init: notify } = useToast();
    const { validate } = useForm("formRef");

    const loading = ref(false);
    const displayFileName = ref(""); // Doar pentru afisare vizuala

    const categories = [
      { id: 1, name: "Birouri" },
      { id: 2, name: "Comercial / Retail" },
      { id: 3, name: "Industrial / Hale" },
      { id: 4, name: "Terenuri" },
    ];

    const form = reactive({
      title: "",
      description: "",
      price: "",
      area: "",
      address: "",
      sector: null,
      category_id: null,
    });

    const sectors = [
      "Sector 1", "Sector 2", "Sector 3",
      "Sector 4", "Sector 5", "Sector 6",
    ];

    const rules = {
      required: (v) => !!v || "Acest câmp este obligatoriu",
      positiveNumber: (v) => v > 0 || "Trebuie să fie un număr pozitiv",
      minLength: (min) => (v) =>
        (v && v.length >= min) || `Minim ${min} caractere`,
    };

    // Funcție pentru a declanșa input-ul ascuns folosind JS pur
    const triggerClick = () => {
      document.getElementById("real-file-input").click();
    };

    // Funcție doar pentru a actualiza textul de pe ecran
    const updateFileName = (event) => {
      if (event.target.files[0]) {
        displayFileName.value = event.target.files[0].name;
      }
    };

    const onSubmit = async () => {
      // 1. Validare
      if (!validate()) {
        notify({ message: "Verifică formularul!", color: "warning" });
        return;
      }

      // --- METODA NUCLEARĂ: JavaScript Pur ---
      // Extragem elementul direct din DOM, ocolind Vue
      const inputElement = document.getElementById("real-file-input");
      const file = inputElement.files[0];

      // Verificăm în consola BROWSERULUI ce am găsit
      console.log("--- DEBUGGER ---");
      console.log("Element input:", inputElement);
      console.log("Fișier extras:", file);

      if (!file) {
        notify({ message: "Selectează o poză!", color: "warning" });
        return;
      }

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

        // Adăugăm fișierul pur
        formData.append("image", file);

        await api.post("/properties", formData, {
          headers: {
            // Setând asta la undefined, ștergem header-ul default 'application/json'
            // Astfel, browserul va pune automat 'multipart/form-data; boundary=...'
            "Content-Type": undefined,
          },
        });

        notify({ message: "Succes!", color: "success" });
        router.push("/app/properties");
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || "Eroare la salvare";
        notify({ message: msg, color: "danger" });
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      sectors,
      displayFileName,
      categories,
      onSubmit,
      loading,
      rules,
      triggerClick,
      updateFileName,
    };
  },
};
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>
