exports.seed = async function (knex) {
  // Șterge intrările existente
  await knex("categories").del();
  // Inserează categorii
  await knex("categories").insert([
    { id: 1, name: "Birouri" },
    { id: 2, name: "Comercial / Retail" },
    { id: 3, name: "Industrial / Hale" },
    { id: 4, name: "Terenuri" },
  ]);
};
