const Category = require("../Models/CategorySchema.js");
const db = require("../config/dbConnect.js");

const categories = [
  new Category({
    name: 'categoria 1',
    description: 'descrição categoria 1',
    color: "black"
  }),
  new Category({
    name: 'categoria 2',
    description: 'descrição categoria 2',
    color: "black"
  }),
  new Category({
    name: 'categoria 3',
    description: 'descrição categoria 3',
    color: "black"
  }),
  new Category({
    name: 'categoria 4',
    description: 'descrição categoria 4',
    color: "black"
  }),
  new Category({
    name: 'categoria 5',
    description: 'descrição categoria 5',
    color: "black"
  }),
];

db.on("error", console.log.bind(console, 'Error on connecting to MongoDB'));
db.once("open", () => {
  console.log('MongoDB is connected');
})

const categoriesLength = categories.length;

categories.forEach(async (category, index) => {
  try {
    await category.save();
    if (index === categoriesLength - 1) {
      console.log("DONE!");
      db.close();
    }
  } catch(error) {
    const err = new Error(`${error?.message}`);
    console.log(`Category seed failed - ${err}`);
    db.close();
    process.exit(0);
  }
});
