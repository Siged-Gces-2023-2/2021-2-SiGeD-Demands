const Alert = require("../Models/AlertSchema.js");
const db = require("../config/dbConnect.js");
const moment = require('moment-timezone');

const alerts = [
  new Alert({
    name: 'alerta 1',
    description: 'descrição alerta 1',
    date: moment().format('YYYY-MM-DD'),
    demandID: '123456789',
    sectorID: '123456789',
  }),
  new Alert({
    name: 'alerta 2',
    description: 'descrição alerta 2',
    date: moment().format('YYYY-MM-DD'),
    demandID: '12345678',
    sectorID: '12345678',
  }),
  new Alert({
    name: 'alerta 3',
    description: 'descrição alerta 3',
    date: moment().format('YYYY-MM-DD'),
    demandID: '1234567',
    sectorID: '1234567',
  }),
  new Alert({
    name: 'alerta 4',
    description: 'descrição alerta 4',
    date: moment().format('YYYY-MM-DD'),
    demandID: '123456',
    sectorID: '123456',
  }),
  new Alert({
    name: 'alerta 5',
    description: 'descrição alerta 5',
    date: moment().format('YYYY-MM-DD'),
    demandID: '12345',
    sectorID: '12345',
  }),
];

db.on("error", console.log.bind(console, 'Error on connecting to MongoDB'));
db.once("open", () => {
  console.log('MongoDB is connected');
})

const alertsLength = alerts.length;

alerts.forEach(async (alert, index) => {
  try {
    await alert.save();
    if (index === alertsLength - 1) {
      console.log("DONE!");
      db.close();
    }
  } catch(error) {
    const err = new Error(`${error?.message}`);
    console.log(`Alert seed failed - ${err}`);
    db.close();
    process.exit(0);
  }
});
