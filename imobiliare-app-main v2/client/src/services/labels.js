// Etichete și culori pentru stările/enum-urile sistemului (folosite în badge-uri)

export const TENANT_STATUS = {
  PROSPECT: { label: 'Prospect', color: 'warning' },
  ACTIVE: { label: 'Activ', color: 'success' },
  OVERDUE: { label: 'Restanțier', color: 'danger' },
  INACTIVE: { label: 'Inactiv', color: 'secondary' },
};

export const SPACE_STATUS = {
  FREE: { label: 'Liber', color: 'success' },
  RESERVED: { label: 'Rezervat', color: 'warning' },
  OCCUPIED: { label: 'Ocupat', color: 'info' },
  MAINTENANCE: { label: 'Întreținere', color: 'danger' },
};

export const CONTRACT_STATUS = {
  DRAFT: { label: 'Draft', color: 'warning' },
  ACTIVE: { label: 'Activ', color: 'success' },
  EXPIRED: { label: 'Expirat', color: 'secondary' },
  TERMINATED: { label: 'Reziliat', color: 'danger' },
};

export const INVOICE_STATUS = {
  ISSUED: { label: 'Emisă', color: 'warning' },
  PAID: { label: 'Achitată', color: 'success' },
  OVERDUE: { label: 'Restanță', color: 'danger' },
  CANCELLED: { label: 'Anulată', color: 'secondary' },
};

export const PRIORITY = {
  LOW: { label: 'Scăzută', color: 'secondary' },
  MEDIUM: { label: 'Medie', color: 'warning' },
  HIGH: { label: 'Ridicată', color: 'danger' },
  URGENT: { label: 'Urgentă', color: 'danger' },
};

export const MAINT_STATUS = {
  OPEN: { label: 'Deschisă', color: 'warning' },
  IN_PROGRESS: { label: 'În lucru', color: 'info' },
  RESOLVED: { label: 'Rezolvată', color: 'success' },
  CANCELLED: { label: 'Anulată', color: 'secondary' },
};

export const ROLE = {
  admin: { label: 'Administrator', color: 'primary' },
  contabil: { label: 'Contabil', color: 'info' },
  tehnic: { label: 'Tehnic', color: 'warning' },
  client: { label: 'Chiriaș', color: 'success' },
  user: { label: 'Utilizator', color: 'secondary' },
};
