const File = require("../Models/FileSchema.js");
const db = require("../config/dbConnect.js");

const files = [
  new File({
    name: 'File 1',
    path: 'Descrição da Filea 1',
    demandId: '62c62d8f2f35ac01525cccf9'
  }),
  new File({
    name: 'Nome da Filea 2',
    path: 'Descrição da Filea 2',
    demandId: '62c62d8f2f35ac01525cccfa'
  }),
  new File({
    name: 'Nome da Filea 3',
    path: 'Descrição da Filea 3',
    demandId: '62c62d8f2f35ac01525cccfd'
  }),
  new File({
    name: 'Nome da Filea 4',
    path: 'Descrição da Filea 4',
    demandId: '62c62d8f2f35ac01525cccfc'
  }),
  new File({
    name: 'Nome da Filea 5',
    path: 'Descrição da Filea 5',
    demandId: '62c62d8f2f35ac01525cccfb'
  }),
];

db.on("error", console.log.bind(console, 'Error on connecting to MongoDB'));
db.once("open", () => {
  console.log('MongoDB is connected');
})

const filesLength = files.length;

files.forEach(async (file, index) => {
  try {
    await file.save();
    if (index === filesLength - 1) {
      console.log("DONE!");
      db.close();
    }
  } catch(error) {
    const err = new Error(`${error?.message}`);
    console.log(`File seed failed - ${err}`);
    db.close();
    process.exit(0);
  }
});
