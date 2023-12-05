const mongoose = require('mongoose');
const moment = require('moment-timezone');
const fs = require('fs');
const pathR = require('path');
const Demand = require('../Models/DemandSchema');
const Category = require('../Models/CategorySchema');
const validation = require('../Utils/validate');
const { getClients } = require('../Services/Axios/clientService');
const { getUser } = require('../Services/Axios/userService');
const { verifyChanges } = require('../Utils/verifyChanges');
const File = require('../Models/FileSchema');
const {clearQueryParams} = require('../Utils/clear');

const demandGetWithClientsNames = async (request, response) => {
  try {
    const token = request.headers['x-access-token'];

    clearQueryParams(request.query);

    const demandsWithClients = [];
    const clients = await getClients(token);

    if (clients.error) {
      return response.status(400).json({ err: clients.error });
    }

    const demands = await Demand.find(request.query)
      .populate('categoryID')
      .sort({ 'createdAt': -1, 'sectorHistory.createdAt': 1 });

    clients.forEach((client) => {
      demands.forEach((demand) => {
        if (client._id === demand.clientID) {
          const demandWithClient = {
            _id: demand._id,
            clientName: client.name,
            name: demand.name,
            categoryID: demand.categoryID,
            open: demand.open,
            description: demand.description,
            process: demand.process,
            sectorHistory: demand.sectorHistory,
            clientID: demand.clientID,
            userID: demand.userID,
            createdAt: demand.createdAt,
            updatedAt: demand.updatedAt,
            updateList: demand.updateList,
          };
          demandsWithClients.push(demandWithClient);
          console.log(demandsWithClients);
          return true;
        }
        return false;
      });
      return false;
    });

    return response.json(demandsWithClients);
  } catch (error) {
    console.error(error);
    return response.status(400).json({ err: 'Could not get demands' });
  }
};

const demandGet = async (request, response) => {
  try {
    const { open } = request.query;
    const query = open ? { open: open === 'true' } : {};

    const demands = await Demand.find(query).populate('categoryID');
    
    return response.json(demands);
  } catch (error) {
    return response.status(400).json({ err: 'Could not get demands' });
  }
};

const demandsFeaturesStatistic = async (request, response) => {
  const {
    isDemandActive, idSector, idFeature, initialDate, finalDate, idClients,
  } = request.query;
  let isActive;
  if (isDemandActive === 'true') {
    isActive = true;
  } else if (isDemandActive === 'false') {
    isActive = false;
  } else {
    isActive = { $exists: true };
  }
  const completeFinalDate = `${finalDate}T24:00:00`;
  
  const token = request.headers['x-access-token'];

  const clients = await getClients(token);

  if (clients.error) {
    return response.status(400).json({ err: clients.error });
  }

  const clientIDsWithFeatures = clients.filter((client) => client.features.length > 0);
  const clientIDs = clientIDsWithFeatures.map((client) => client._id);

  const aggregatorOpts = [
    {
      $match: {
        clientID: { $in: clientIDs },
      },
    },
    {
      $group: {
        _id: '$clientID',
        demandas: { $sum: 1 },
      },
    },
  ];
  
  try {
    if (idSector && idSector !== 'null' && idSector !== 'undefined') {
      if (idFeature && idFeature !== 'null' && idFeature !== 'undefined') {
        aggregatorOpts.unshift({
          $match: {
            open: isActive,
            sectorID: idSector,
            createdAt: {
              $gte: new Date(initialDate),
              $lte: new Date(completeFinalDate),
            },
          },
        });
      } else {
        aggregatorOpts.unshift({
          $match: {
            open: isActive,
            sectorID: idSector,
            createdAt: {
              $gte: new Date(initialDate),
              $lte: new Date(completeFinalDate),
            },
          },
        });
      }
      aggregatorOpts.unshift({
        $addFields: {
          sectorID: { $arrayElemAt: ['$sectorHistory.sectorID', -1] },
        },
      });
    } else if (
      idFeature
      && idFeature !== 'null'
      && idFeature !== 'undefined'
    ) {
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    } else {
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    }
  } catch (err) {
    console.error(err);
  }

  if (idClients && idClients !== 'null' && idClients !== 'undefined') {
    try {
      const clientID = String(idClients);
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          clientID,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    } catch (err) {
      console.error(err.message);
    }
  }
  try {
    const statistics = await Demand.aggregate(aggregatorOpts).exec();
    return response.json(statistics);
  } catch {
    return response.status(400).json({ err: 'failed to generate statistics' });
  }
};

const demandsClientsStatistic = async (request, response) => {
  const {
    isDemandActive, idSector, idCategory, initialDate, finalDate, idClients,
  } = request.query;
  let isActive;
  if (isDemandActive === 'true') {
    isActive = true;
  } else if (isDemandActive === 'false') {
    isActive = false;
  } else {
    isActive = { $exists: true };
  }
  const completeFinalDate = `${finalDate}T24:00:00`;

  const aggregatorOpts = [
    {
      $group: {
        _id: '$clientID',
        demandas: { $sum: 1 },
      },
    },
  ];

  try {
    if (idSector && idSector !== 'null' && idSector !== 'undefined') {
      if (idCategory && idCategory !== 'null' && idCategory !== 'undefined') {
        const categoryId = mongoose.Types.ObjectId(idCategory);
        aggregatorOpts.unshift({
          $match: {
            open: isActive,
            sectorID: idSector,
            categoryID: categoryId,
            createdAt: {
              $gte: new Date(initialDate),
              $lte: new Date(completeFinalDate),
            },
          },
        });
      } else {
        aggregatorOpts.unshift({
          $match: {
            open: isActive,
            sectorID: idSector,
            createdAt: {
              $gte: new Date(initialDate),
              $lte: new Date(completeFinalDate),
            },
          },
        });
      }
      aggregatorOpts.unshift({
        $addFields: {
          sectorID: { $arrayElemAt: ['$sectorHistory.sectorID', -1] },
        },
      });
    } else if (
      idCategory
      && idCategory !== 'null'
      && idCategory !== 'undefined'
    ) {
      const categoryId = mongoose.Types.ObjectId(idCategory);
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          categoryID: categoryId,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    } else {
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    }
  } catch (err) {
    console.error(err);
  }

  if (idClients && idClients !== 'null' && idClients !== 'undefined') {
    try {
      const clientID = String(idClients);
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          clientID,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    } catch (err) {
      console.error(err.message);
    }
  }
  try {
    const statistics = await Demand.aggregate(aggregatorOpts).exec();
    return response.json(statistics);
  } catch {
    return response.status(400).json({ err: 'failed to generate statistics' });
  }
};

const demandsCategoriesStatistic = async (request, response) => {
  const {
    isDemandActive, idSector, idCategory, initialDate, finalDate, idClients,
  } = request.query;

  let isActive;
  if (isDemandActive === 'true') {
    isActive = true;
  } else if (isDemandActive === 'false') {
    isActive = false;
  } else {
    isActive = { $exists: true };
  }
  const completeFinalDate = `${finalDate}T24:00:00`;

  const aggregatorOpts = [
    { $unwind: '$categoryID' },
    {
      $lookup: {
        from: Category.collection.name,
        localField: 'categoryID',
        foreignField: '_id',
        as: 'categories',
      },
    },
    {
      $group: {
        _id: '$categoryID',
        categories: { $first: '$categories' },
        demandas: { $sum: 1 },
      },
    },
  ];
  
  try {
    if (idSector && idSector !== 'null' && idSector !== 'undefined') {
      if (idCategory && idCategory !== 'null' && idCategory !== 'undefined') {
        const categoryId = mongoose.Types.ObjectId(idCategory);
        aggregatorOpts.unshift({
          $match: {
            open: isActive,
            sectorID: idSector,
            categoryID: categoryId,
            createdAt: {
              $gte: new Date(initialDate),
              $lte: new Date(completeFinalDate),
            },
          },
        });
      } else {
        aggregatorOpts.unshift({
          $match: {
            open: isActive,
            sectorID: idSector,
            createdAt: {
              $gte: new Date(initialDate),
              $lte: new Date(completeFinalDate),
            },
          },
        });
      }
      aggregatorOpts.unshift({
        $addFields: {
          sectorID: { $arrayElemAt: ['$sectorHistory.sectorID', -1] },
        },
      });
    } else if (
      idCategory
      && idCategory !== 'null'
      && idCategory !== 'undefined'
    ) {
      const categoryId = mongoose.Types.ObjectId(idCategory);
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          categoryID: categoryId,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    } else {
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    }
  } catch (err) {
    console.error(err);
  }

  if (idClients && idClients !== 'null' && idClients !== 'undefined') {
    try {
      const clientID = String(idClients);
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          clientID,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    } catch (err) {
      console.error(err.message);
    }
  }

  try {
    const statistics = await Demand.aggregate(aggregatorOpts).exec();
    return response.json(statistics);
  } catch {
    return response.status(400).json({ err: 'failed to generate statistics' });
  }
};

const demandsSectorsStatistic = async (request, response) => {
  const {
    isDemandActive, idSector, idCategory, initialDate, finalDate, idClients,
  } = request.query;

  let isActive;
  if (isDemandActive === 'true') {
    isActive = true;
  } else if (isDemandActive === 'false') {
    isActive = false;
  } else {
    isActive = { $exists: true };
  }
  const completeFinalDate = `${finalDate}T24:00:00`;

  const aggregatorOpts = [
    {
      $unwind: '$sectorHistory',
    },
    {
      $match: {
        createdAt: {
          $gte: new Date(initialDate),
          $lte: new Date(completeFinalDate),
        },
        open: isActive,
      },
    },
    {
      $group: {
        _id: '$sectorHistory.sectorID',
        total: { $sum: 1 },
      },
    },
  ];
  
  try {
    if (idSector && idSector !== 'null' && idSector !== 'undefined') {
      if (idCategory && idCategory !== 'null' && idCategory !== 'undefined') {
        const categoryId = mongoose.Types.ObjectId(idCategory);
        aggregatorOpts.unshift({
          $match: {
            open: isActive,
            sectorID: idSector,
            categoryID: categoryId,
            createdAt: {
              $gte: new Date(initialDate),
              $lte: new Date(completeFinalDate),
            },
          },
        });
      } else {
        aggregatorOpts.unshift({
          $match: {
            open: isActive,
            sectorID: idSector,
            createdAt: {
              $gte: new Date(initialDate),
              $lte: new Date(completeFinalDate),
            },
          },
        });
      }
      aggregatorOpts.unshift({
        $addFields: {
          sectorID: { $arrayElemAt: ['$sectorHistory.sectorID', -1] },
        },
      });
    } else if (
      idCategory
      && idCategory !== 'null'
      && idCategory !== 'undefined'
    ) {
      const categoryId = mongoose.Types.ObjectId(idCategory);
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          categoryID: categoryId,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    } else {
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    }
  } catch (err) {
    console.error(err);
  }

  if (idClients && idClients !== 'null' && idClients !== 'undefined') {
    try {
      const clientID = String(idClients);
      aggregatorOpts.unshift({
        $match: {
          open: isActive,
          clientID,
          createdAt: {
            $gte: new Date(initialDate),
            $lte: new Date(completeFinalDate),
          },
        },
      });
    } catch (err) {
      console.error(err.message);
    }
  }

  try {
    const statistics = await Demand.aggregate(aggregatorOpts).exec();
    return response.json(statistics);
  } catch (err) {
    return response.status(400).json({ err: 'failed to generate statistics' });
  }
};

const demandCreate = async (request, response) => {
  try {
    const {
      name,
      description,
      process,
      categoryID,
      sectorID,
      responsibleUserName,
      clientID,
      userID,
      demandDate,
    } = request.body;

    const validFields = validation.validateDemand(
      name,
      description,
      categoryID,
      sectorID,
      clientID,
      userID,
    );
    if (validFields.length) {
      return response.status(400).json({ status: validFields });
    }
    const token = request.headers['x-access-token'];

    const user = await getUser(userID, token);

    if (user.error) {
      return response.status(400).json({ message: user.error });
    }
    const date = moment.utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss')).toDate();

    const retroactiveDate = moment(demandDate).toDate();
    retroactiveDate.setHours(
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    );

    const newDemand = await Demand.create({
      name,
      description,
      process: process || '',
      categoryID,
      sectorHistory: {
        sectorID,
        createdAt: date,
        updatedAt: date,
        responsibleUserName,
      },
      clientID,
      userID,
      demandHistory: {
        userID,
        date,
        label: 'created',
      },
      createdAt: demandDate ? retroactiveDate : date,
      updatedAt: date,
    });

    return response.json(newDemand);
  } catch (err) {
    console.log(err);
    return response.status(500).json({ message: 'Failed to create demand' });
  }
};

const demandUpdate = async (request, response) => {
  const { id } = request.params;
  const {
    name, description, process, categoryID, sectorID, clientID, userID,
  } = request.body;

  const validFields = validation.validateDemand(
    name,
    description,
    categoryID,
    sectorID,
    clientID,
    userID,
  );

  if (validFields.length) {
    return response.status(400).json({ status: validFields });
  }

  try {
    const token = request.headers['x-access-token'];

    const user = await getUser(userID, token);

    if (user.error) {
      return response.status(400).json({ message: user.error });
    }

    const demandHistory = await verifyChanges(request.body, id);
    const updateStatus = await Demand.findOneAndUpdate(
      { _id: id },
      {
        name,
        description,
        process,
        categoryID,
        sectorID,
        clientID,
        userID,
        demandHistory,
        updatedAt: moment
          .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
          .toDate(),
      },
      { new: true },
      (err) => err,
    );
    return response.json(updateStatus);
  } catch {
    return response.status(400).json({ err: 'invalid id' });
  }
};

const toggleDemand = async (request, response) => {
  const { id } = request.params;

  try {
    const demandFound = await Demand.findOne({ _id: id });

    let { open } = demandFound;

    open = !demandFound.open;

    const updateStatus = await Demand.findOneAndUpdate(
      { _id: id },
      {
        open,
        updatedAt: moment
          .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
          .toDate(),
      },
      { new: true },
      (demand) => demand,
    );
    return response.json(updateStatus);
  } catch {
    return response.status(400).json({ err: 'Invalid ID' });
  }
};

const demandByClient = async (request, response) => {
  const { clientID, open } = request.params;

  try {
    const demand = await Demand.find({ clientID: clientID, open: open }).populate('categoryID');
    return response.status(200).json(demand);
  } catch {
    return response.status(400).json({ err: 'Invalid ID' });
  }
};

const demandId = async (request, response) => {
  const { id } = request.params;
  try {
    const demand = await Demand.findOne({ _id: id }).populate('categoryID');
    return response.status(200).json(demand);
  } catch {
    return response.status(400).json({ err: 'Invalid ID' });
  }
};

const updateSectorDemand = async (request, response) => {
  const { id } = request.params;

  const { sectorID } = request.body;

  const validFields = validation.validateSectorID(sectorID);

  if (validFields.length) {
    return response.status(400).json({ status: validFields });
  }

  try {
    const demandFound = await Demand.findOne({ _id: id });

    demandFound.sectorHistory[demandFound.sectorHistory.length - 1].sectorID = sectorID;

    demandFound.sectorHistory[demandFound.sectorHistory.length - 1].updatedAt = moment
      .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
      .toDate();

    const updateStatus = await Demand.findOneAndUpdate(
      { _id: id },
      {
        sectorHistory: demandFound.sectorHistory,
        updatedAt: moment
          .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
          .toDate(),
      },
      { new: true },
      (user) => user,
    );
    return response.json(updateStatus);
  } catch {
    return response.status(400).json({ err: 'Invalid ID' });
  }
};

const forwardDemand = async (request, response) => {
  const { id } = request.params;

  const { sectorID, responsibleUserName } = request.body;

  const validField = validation.validateSectorID(sectorID);

  if (validField.length) {
    return response.status(400).json({ status: validField });
  }

  try {
    const demandFound = await Demand.findOne({ _id: id });

    demandFound.sectorHistory = demandFound.sectorHistory.push({
      sectorID,
      createdAt: moment
        .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
        .toDate(),
      updatedAt: moment
        .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
        .toDate(),
      responsibleUserName,
    });

    const updateStatus = await Demand.findOneAndUpdate(
      { _id: id },
      {
        sectorHistory: demandFound.sectorHistory,
      },
      { new: true },
      (user) => user,
    );
    return response.json(updateStatus);
  } catch (error) {
    return response.status(400).json({ err: 'Invalid ID' });
  }
};

const createDemandUpdate = async (request, response) => {
  const { id } = request.params;

  const {
    userName,
    userSector,
    userID,
    description,
    visibilityRestriction,
    important,
    treatment,
  } = request.body;

  const validFields = validation.validateDemandUpdate(
    userName,
    description,
    visibilityRestriction,
    userSector,
    userID,
    important,
    treatment,
  );

  if (validFields.length) {
    return response.status(400).json({ status: validFields });
  }

  try {
    const demandFound = await Demand.findOne({ _id: id });

    demandFound.updateList = demandFound.updateList.push({
      userName,
      userSector,
      userID,
      description,
      visibilityRestriction,
      important,
      treatment,
      createdAt: moment
        .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
        .toDate(),
      updatedAt: moment
        .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
        .toDate(),
    });

    const updateStatus = await Demand.findOneAndUpdate(
      { _id: id },
      {
        updateList: demandFound.updateList,
      },
      { new: true },
      (user) => user,
    );

    return response.json(updateStatus);
  } catch {
    return response.status(400).json({ err: 'Invalid ID' });
  }
};

const updateDemandUpdate = async (request, response) => {
  const {
    userName,
    userSector,
    userID,
    description,
    visibilityRestriction,
    updateListID,
    important,
    treatment,
  } = request.body;

  const validFields = validation.validateDemandUpdate(
    userName,
    description,
    visibilityRestriction,
    userSector,
    userID,
    important,
    treatment,
  );

  if (validFields.length) {
    return response.status(400).json({ status: validFields });
  }

  try {
    const final = await Demand.findOneAndUpdate(
      { 'updateList._id': updateListID },
      {
        $set: {
          'updateList.$.userName': userName,
          'updateList.$.userSector': userSector,
          'updateList.$.userID': userID,
          'updateList.$.description': description,
          'updateList.$.visibilityRestriction': visibilityRestriction,
          'updateList.$.important': important,
          'updateList.$.treatment': treatment,
          'updateList.$.updatedAt': moment
            .utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'))
            .toDate(),
        },
      },
      { new: true },
      (user) => user,
    );
    return response.json(final);
  } catch {
    return response.status(400).json({ err: 'Invalid ID' });
  }
};

const deleteDemandUpdate = async (request, response) => {
  const { id } = request.params;

  const { updateListID } = request.body;

  try {
    const demand = await Demand.findOne({ _id: id });
    const updateList = demand.updateList.filter(
      (update) => String(update._id) !== updateListID,
    );
    const difference = demand.updateList.filter((x) => updateList.indexOf(x) === -1);
    if (difference[0].fileID.length > 0) {
      const fileID = difference[0].fileID[0];
      const fileObject = await File.findOne({ _id: fileID });
      const pathFile = pathR.resolve(__dirname, '..', '..', 'files', 'uploads', `${fileObject.path}`);
      if (fs.existsSync(pathFile)) {
        fs.unlinkSync(pathFile);
      }
      await File.deleteOne({ _id: fileID });
    }

    const updateStatus = await Demand.findOneAndUpdate(
      { _id: id },
      {
        updateList,
      },
      { new: true },
      (user) => user,
    );
    return response.json(updateStatus);
  } catch (error) {
    return response.status(400).json({ err: 'failure' });
  }
};

const history = async (request, response) => {
  const { id } = request.params;

  try {
    let error = '';
    const token = request.headers['x-access-token'];
    const demandFound = await Demand.findOne({ _id: id });
    const userHistory = await Promise.all(
      demandFound.demandHistory.map(async (elem) => {
        const user = await getUser(elem.userID, token);

        if (user.error) {
          error = user.error;
          return;
        }
        return {
          label: elem.label,
          before: elem.before,
          after: elem.after,
          date: elem.date,
          user: {
            _id: user._id,
            name: user.name,
            sector: user.sector,
            role: user.role,
          },
        };
      }),
    );
    if (error) {
      return response.status(400).json({ message: error });
    }
    return response.json(userHistory);
  } catch {
    return response.status(400).json({ message: 'Demand not found' });
  }
};

const newestFourDemandsGet = async (request, response) => {
  const demands = await Demand.find().limit(4).sort({ createdAt: -1 });

  return response.status(200).json(demands);
};

const getFile = async (request, response) => {
  const { idFile } = request.params;
  try {
    const fileObject = await File.findOne({ _id: idFile });
    let pathFile = pathR.resolve(__dirname, '..', '..', 'files', 'uploads', `${fileObject.path}`);
    if (!fs.existsSync(pathFile)) {
      pathFile = pathR.resolve(__dirname, '..', '..', 'files', 'Error', 'PDF_NOT_FOUND.pdf');
    }
    const file = fs.createReadStream(pathFile);
    response.contentType('application/pdf');
    return file.pipe(response);
  } catch (err) {
    return response.status(400).json({ err: 'Failed to get file.' });
  }
};

const uploadFile = async (request, response) => {
  try {

    const { id } = request.params;
    const {
      userName,
      userSector,
      userID,
      description,
      important,
      visibility,
    } = request.body;

    const name = request.file.originalname;
    const { size } = request.file;
    const path = request.file.filename;
    const newFile = await File.create({
      name,
      path,
      size,
      demandId: id,
      createdAt: moment.utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss')).toDate(),
      updatedAt: moment.utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss')).toDate(),
    });

    const validFields = validation.validateDemandUpdate(
      userName, description, visibility, userSector, userID, important,
    );
    
    const MAX_SIZE_5_MEGABYTES = 5 * 1024 * 1024;
    if (size >= MAX_SIZE_5_MEGABYTES) {
      return response.status(400).json({ err: "File bigger then 5MB." })
    }

    if (validFields.length) {
      return response.status(400).json({ status: validFields });
    }

    const demandFound = await Demand.findOne({ _id: id });

    demandFound.updateList = demandFound.updateList.push({
      userName,
      userSector,
      userID,
      fileID: newFile._id,
      description,
      visibility,
      important,
      createdAt: moment.utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss')).toDate(),
      updatedAt: moment.utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss')).toDate(),
    });

    await Demand.findOneAndUpdate({ _id: id }, {
      updateList: demandFound.updateList,
    }, { new: true }, (user) => user);
    return response.json(newFile);
  } catch {
    return response.status(400).json({ err: 'Failed to save file.' });
  }
};

module.exports = {
  demandGet,
  demandCreate,
  demandUpdate,
  toggleDemand,
  demandByClient,
  demandId,
  updateSectorDemand,
  forwardDemand,
  createDemandUpdate,
  demandGetWithClientsNames,
  updateDemandUpdate,
  deleteDemandUpdate,
  demandsCategoriesStatistic,
  demandsSectorsStatistic,
  demandsClientsStatistic,
  demandsFeaturesStatistic,
  history,
  newestFourDemandsGet,
  uploadFile,
  getFile,
};