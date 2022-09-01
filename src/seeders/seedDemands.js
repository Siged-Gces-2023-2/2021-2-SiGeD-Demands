const Demand = require("../Models/DemandSchema.js");
const db = require("../config/dbConnect.js");

const demands = [
  new Demand({
    name: 'Nome da Demanda 1',
    description: 'Descrição da Demanda 1',
    process: '000000',
    categoryID: ['62c62be737f3880118ecbbc7', '62c62be737f3880118ecbbc8'],
    sectorID: '123456789',
    clientID: '123',
    userID: '1'
  }),
  new Demand({
    name: 'Nome da Demanda 2',
    description: 'Descrição da Demanda 2',
    process: '000000',
    categoryID: ['62c62be737f3880118ecbbca', '62c62be737f3880118ecbbc9'],
    sectorID: '12345678',
    clientID: '1234',
    userID: '2'
  }),
  new Demand({
    name: 'Nome da Demanda 3',
    description: 'Descrição da Demanda 3',
    process: '000000',
    categoryID: ['62c62be737f3880118ecbbcb', '62c62be737f3880118ecbbc7'],
    sectorID: '1234567',
    clientID: '12345',
    userID: '3'
  }),
  new Demand({
    name: 'Nome da Demanda 4',
    description: 'Descrição da Demanda 4',
    process: '000000',
    categoryID: ['62c62be737f3880118ecbbc8', '62c62be737f3880118ecbbca'],
    sectorID: '123456',
    clientID: '123456',
    userID: '4'
  }),
  new Demand({
    name: 'Nome da Demanda 5',
    description: 'Descrição da Demanda 5',
    process: '000000',
    categoryID: ['62c62be737f3880118ecbbc9', '62c62be737f3880118ecbbcb'],
    sectorID: '12345',
    clientID: '1234567',
    userID: '5'
  }),
];

db.on("error", console.log.bind(console, 'Error on connecting to MongoDB'));
db.once("open", () => {
  console.log('MongoDB is connected');
})

const demandsLength = demands.length;

demands.forEach(async (demand, index) => {
  try {
    await demand.save();
    if (index === demandsLength - 1) {
      console.log("DONE!");
      db.close();
    }
  } catch(error) {
    const err = new Error(`${error?.message}`);
    console.log(`Demand seed failed - ${err}`);
    db.close();
    process.exit(0);
  }
});
