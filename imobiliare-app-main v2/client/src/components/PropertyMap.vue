<template>
  <div class="property-map-container">
    <div class="map-controls">
      <button class="reset-zoom-btn" @click="resetView" title="Centrează pe București">
        <va-icon name="my_location" size="small" />
      </button>
    </div>

    <!-- Container pentru Leaflet -->
    <div ref="mapDiv" class="leaflet-map"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

export default {
  name: "PropertyMap",
  props: {
    properties: {
      type: Array,
      default: () => [],
    },
    hoveredId: {
      type: [Number, String],
      default: null,
    },
    interactiveSearch: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["select-property"],
  setup(props, { emit }) {
    const router = useRouter();
    const mapDiv = ref(null);
    let map = null;
    let clusterGroup = null;
    const markersMap = new Map(); // id -> L.marker

    // Coordonate București
    const BUCHAREST_CENTER = [44.4323, 26.1063];
    const DEFAULT_ZOOM = 12;

    const formatPrice = (val) => {
      if (!val && val !== 0) return "0";
      return Number(val).toLocaleString("ro-RO");
    };

    const getImageUrl = (path) => {
      if (!path) return "https://placehold.co/400x300?text=SANTA+Spatiu";
      return `http://localhost:3000/${path.replace(/\\/g, "/")}`;
    };

    const getCategoryClass = (name) => {
      if (!name) return "cat-default";
      if (name.includes("Birou")) return "cat-office";
      if (name.includes("Comercial") || name.includes("Retail")) return "cat-retail";
      if (name.includes("Industrial") || name.includes("Hale")) return "cat-industrial";
      return "cat-default";
    };

    // Ascultător pentru click din interiorul popup-ului Leaflet
    const handlePopupClick = (e) => {
      if (e.detail) {
        emit("select-property", e.detail);
        if (router && router.currentRoute.value.path !== `/property/${e.detail}`) {
          router.push(`/property/${e.detail}`).catch(() => {});
        }
      }
    };

    onMounted(() => {
      window.addEventListener("map-select-prop", handlePopupClick);

      // Inițializare Hartă Leaflet
      map = L.map(mapDiv.value, {
        center: BUCHAREST_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false, // Punem zoom control în dreapta jos
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Strat de piese OpenStreetMap (Stil Clean & Modern)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      // Cluster Group configurat pentru aspect curat
      clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 45,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="custom-cluster-badge"><span>${count}</span></div>`,
            className: "marker-cluster-custom",
            iconSize: L.point(40, 40),
          });
        },
      });

      map.addLayer(clusterGroup);

      renderMarkers();
    });

    onBeforeUnmount(() => {
      window.removeEventListener("map-select-prop", handlePopupClick);
      if (map) {
        map.remove();
      }
    });

    const resetView = () => {
      if (map) {
        map.setView(BUCHAREST_CENTER, DEFAULT_ZOOM, { animate: true });
      }
    };

    // Funcție pentru generarea pinilor HTML cu preț
    const createPriceIcon = (prop, isHovered = false) => {
      const catClass = getCategoryClass(prop.category_name);
      const pulseClass = isHovered ? "hover-pulse" : "";
      return L.divIcon({
        className: "custom-price-pin-wrapper",
        html: `
          <div class="map-price-badge ${catClass} ${pulseClass}">
            <span class="price-val">${formatPrice(prop.price)} €</span>
          </div>
        `,
        iconSize: [80, 32],
        iconAnchor: [40, 16],
        popupAnchor: [0, -18],
      });
    };

    const renderMarkers = () => {
      if (!clusterGroup || !map) return;

      clusterGroup.clearLayers();
      markersMap.clear();

      const validProps = props.properties.filter(
        (p) => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude)
      );

      validProps.forEach((p) => {
        const lat = parseFloat(p.latitude);
        const lng = parseFloat(p.longitude);

        const icon = createPriceIcon(p, p.id === props.hoveredId);
        const marker = L.marker([lat, lng], { icon });

        // Conținut HTML pentru Popup
        const catClass = getCategoryClass(p.category_name);
        const popupHtml = `
          <div class="map-popup-card">
            <div class="popup-img-wrapper">
              <img src="${getImageUrl(p.image_path)}" class="popup-img" alt="${p.title}" />
              <span class="popup-cat-badge ${catClass}">${p.category_name || "Comercial"}</span>
            </div>
            <div class="popup-body">
              <h4 class="popup-title">${p.title}</h4>
              <p class="popup-address"><i class="va-icon material-icons">place</i> ${p.address}</p>
              <div class="popup-footer">
                <div class="popup-price-box">
                  <span class="popup-price">${formatPrice(p.price)} €</span>
                  <span class="popup-area">${p.area} m²</span>
                </div>
                <button class="popup-action-btn" onclick="window.dispatchEvent(new CustomEvent('map-select-prop', { detail: '${p.id}' }))">
                  Detalii →
                </button>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          closeButton: false,
          className: "sleek-map-popup",
          maxWidth: 280,
          minWidth: 260,
        });

        markersMap.set(p.id, marker);
        clusterGroup.addLayer(marker);
      });

      // Dacă avem un singur spațiu, centrăm harta automat pe el la zoom 15
      if (validProps.length === 1 && map) {
        map.setView([parseFloat(validProps[0].latitude), parseFloat(validProps[0].longitude)], 15);
      }
    };

    // Reactivitate la schimbarea listei de proprietăți
    watch(
      () => props.properties,
      () => {
        renderMarkers();
      },
      { deep: true }
    );

    // Reactivitate la hover în lista din stânga -> evidențiere pin pe hartă
    watch(
      () => props.hoveredId,
      (newId, oldId) => {
        if (oldId && markersMap.has(oldId)) {
          const oldMarker = markersMap.get(oldId);
          const oldProp = props.properties.find((p) => p.id === oldId);
          if (oldProp) oldMarker.setIcon(createPriceIcon(oldProp, false));
          oldMarker.setZIndexOffset(0);
        }

        if (newId && markersMap.has(newId)) {
          const newMarker = markersMap.get(newId);
          const newProp = props.properties.find((p) => p.id === newId);
          if (newProp) {
            newMarker.setIcon(createPriceIcon(newProp, true));
            newMarker.setZIndexOffset(10000);
            
            // Dacă pinul nu e vizibil, facem pan lin către el
            const latlng = newMarker.getLatLng();
            if (map && !map.getBounds().contains(latlng)) {
              map.panTo(latlng, { animate: true, duration: 0.5 });
            }
          }
        }
      }
    );

    return { mapDiv, resetView };
  },
};
</script>

<style>
/* --- STILURI GENERALE SI LAYOUT --- */
.property-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.leaflet-map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* --- CONTROALE SUPRAPUSE PE HARTĂ --- */
.map-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 500;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  pointer-events: none;
}

.reset-zoom-btn {
  pointer-events: auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #334155;
  transition: all 0.2s ease;
}

.reset-zoom-btn:hover {
  background: #ffffff;
  color: #10b981;
  transform: scale(1.05);
}

/* --- BADGE-URI CU PREȚ PE HARTĂ (L.divIcon) --- */
.custom-price-pin-wrapper {
  background: transparent;
  border: none;
}

.map-price-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 2px #ffffff;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
  cursor: pointer;
}

.map-price-badge:hover,
.map-price-badge.hover-pulse {
  transform: scale(1.2) translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35), 0 0 0 3px #ffffff;
  z-index: 9999 !important;
}

/* Culori Categorii pe Hartă */
.map-price-badge.cat-office {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8); /* Blue */
}
.map-price-badge.cat-retail {
  background: linear-gradient(135deg, #f59e0b, #d97706); /* Orange/Amber */
}
.map-price-badge.cat-industrial {
  background: linear-gradient(135deg, #10b981, #047857); /* Emerald Green */
}
.map-price-badge.cat-default {
  background: linear-gradient(135deg, #6366f1, #4338ca); /* Indigo */
}

/* Animație de Pulse pentru pinul activ din listă */
@keyframes pin-glow {
  0% { transform: scale(1.15) translateY(-3px); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7), 0 0 0 3px #fff; }
  70% { transform: scale(1.22) translateY(-5px); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0), 0 0 0 3px #fff; }
  100% { transform: scale(1.15) translateY(-3px); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 0 0 3px #fff; }
}

.map-price-badge.hover-pulse {
  animation: pin-glow 1.5s infinite;
}

/* --- CLUSTERS CUSTOM --- */
.marker-cluster-custom {
  background: transparent;
}
.custom-cluster-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), 0 0 0 3px #ffffff;
  border: 2px solid #10b981;
  transition: transform 0.2s ease;
}
.custom-cluster-badge:hover {
  transform: scale(1.15);
}

/* --- POPUP LEAFLET CUSTOM (CLEAN & BRIGHT MODERN) --- */
.sleek-map-popup .leaflet-popup-content-wrapper {
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
  border: 1px solid #f1f5f9;
  background: #ffffff;
}

.sleek-map-popup .leaflet-popup-content {
  margin: 0;
  line-height: 1.4;
}

.sleek-map-popup .leaflet-popup-tip-container {
  width: 24px;
  height: 12px;
}
.sleek-map-popup .leaflet-popup-tip {
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.map-popup-card {
  display: flex;
  flex-direction: column;
  font-family: 'Outfit', sans-serif;
}

.popup-img-wrapper {
  position: relative;
  width: 100%;
  height: 140px;
  overflow: hidden;
  background: #e2e8f0;
}

.popup-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.map-popup-card:hover .popup-img {
  transform: scale(1.05);
}

.popup-cat-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
.popup-cat-badge.cat-office { background: #3b82f6; }
.popup-cat-badge.cat-retail { background: #f59e0b; }
.popup-cat-badge.cat-industrial { background: #10b981; }
.popup-cat-badge.cat-default { background: #6366f1; }

.popup-body {
  padding: 14px;
}

.popup-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.popup-address {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.popup-address i {
  font-size: 14px;
  color: #94a3b8;
}

.popup-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.popup-price-box {
  display: flex;
  flex-direction: column;
}

.popup-price {
  font-size: 1.1rem;
  font-weight: 800;
  color: #10b981; /* Emerald Green */
}

.popup-area {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.popup-action-btn {
  background: #1e293b;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.popup-action-btn:hover {
  background: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}
</style>
