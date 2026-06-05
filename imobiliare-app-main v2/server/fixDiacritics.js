const knex = require("knex")(require("./knexfile").development);

const updates = [
  { id: 43, title: 'Promenada Mall - Spațiu Comercial', description: 'Spațiu comercial premium situat în incinta Promenada Mall, vad excelent.', address: 'Calea Floreasca 246B, București, Sector 1' },
  { id: 44, title: 'Băneasa Shopping City - Insulă', description: 'Spațiu tip insulă pe culoarul principal din Băneasa Shopping City.', address: 'Șoseaua București-Ploiești 42D, București, Sector 1' },
  { id: 45, title: 'Victoria Business Park - Birou', description: 'Spațiu de birouri open space, clasa A, acces facil metrou.', address: 'Șoseaua București-Ploiești 73-81, București, Sector 1' },
  { id: 46, title: 'Bucharest Business Park', description: 'Birou compartimentat, etaj 3, finisaje premium.', address: 'Șoseaua București-Ploiești 1A, București, Sector 1' },

  { id: 47, title: 'Mega Mall - Spațiu Retail', description: 'Spațiu generos pretabil magazin de haine sau electronice.', address: 'Bulevardul Pierre de Coubertin 3-5, București, Sector 2' },
  { id: 48, title: 'Veranda Mall - Food Court', description: 'Spațiu amenajat pentru alimentație publică.', address: 'Strada Ziduri Moși 23, București, Sector 2' },
  { id: 49, title: 'Pipera Business Tower', description: 'Birou modern cu vedere panoramică, sistem HVAC inteligent.', address: 'Bulevardul Dimitrie Pompeiu, București, Sector 2' },
  { id: 50, title: 'Floreasca Park - Open Space', description: 'Spațiu birouri clasa A în Floreasca Park.', address: 'Șoseaua Pipera 43, București, Sector 2' },

  { id: 51, title: 'ParkLake Shopping Center', description: 'Spațiu comercial etaj 1, proximitate ancore principale.', address: 'Strada Liviu Rebreanu 4, București, Sector 3' },
  { id: 52, title: 'București Mall (Vitan)', description: 'Locație centrală în primul mall din România.', address: 'Calea Vitan 55-59, București, Sector 3' },
  { id: 53, title: 'Titan Shopping Center - Magazin', description: 'Spațiu comercial la parter, trafic pietonal intens.', address: 'Bulevardul 1 Decembrie 1918 33A, București, Sector 3' },
  { id: 54, title: 'Pallady Business Center', description: 'Spațiu de birouri/showroom, parcare asigurată.', address: 'Bulevardul Theodor Pallady, București, Sector 3' },

  { id: 55, title: 'Sun Plaza - Retail', description: 'Spațiu comercial situat vizavi de intrarea principală.', address: 'Calea Văcărești 391, București, Sector 4' },
  { id: 56, title: 'Grand Arena Mall', description: 'Spațiu ideal pentru magazin de decorațiuni/mobilier.', address: 'Bulevardul Metalurgiei 12-18, București, Sector 4' },
  { id: 57, title: 'City Offices - Birou', description: 'Spațiu birouri complet mobilat, la 1 min de metrou Eroii Revoluției.', address: 'Șoseaua Olteniței 2, București, Sector 4' },
  { id: 58, title: 'Timpuri Noi Square', description: 'Clădire verde, birou cu dotări ultra-moderne.', address: 'Splaiul Unirii 165, București, Sector 4' },

  { id: 59, title: 'Liberty Center - Food Court', description: 'Spațiu pentru restaurant/fast-food în incinta mall-ului.', address: 'Șoseaua Progresului 151-171, București, Sector 5' },
  { id: 60, title: 'Vulcan Value Centre', description: 'Spațiu cu vitrină generoasă, pretabil magazin electrocasnice.', address: 'Strada Mihail Sebastian 88, București, Sector 5' },
  { id: 61, title: 'AFI Tech Park', description: 'Birou clasa A, campus tehnologic modern.', address: 'Bulevardul Tudor Vladimirescu 29, București, Sector 5' },
  { id: 62, title: 'The One Cotroceni Park', description: 'Spațiu mixt (birou/retail) la parterul clădirii.', address: 'Șoseaua Progresului, București, Sector 5' },

  { id: 63, title: 'AFI Cotroceni - Mega Spațiu', description: 'Cel mai mare mall din România, vizibilitate maximă.', address: 'Bulevardul Vasile Milea 4, București, Sector 6' },
  { id: 64, title: 'Plaza România', description: 'Spațiu fashion, poziționat excelent la etajul 1.', address: 'Bulevardul Timișoara 26, București, Sector 6' },
  { id: 65, title: 'West Gate Business Park', description: 'Birou în cel mai mare parc de afaceri din vestul capitalei.', address: 'Bulevardul Preciziei 24, București, Sector 6' },
  { id: 66, title: 'Sema Park', description: 'Hala/Spațiu industrial recondiționat, perfect pentru depozitare/showroom.', address: 'Splaiul Independenței 319, București, Sector 6' },
];

async function run() {
  try {
    for (const data of updates) {
      await knex('properties').where('id', data.id).update({
        title: data.title,
        description: data.description,
        address: data.address
      });
      console.log(`Updated property ID ${data.id}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    knex.destroy();
  }
}

run();
