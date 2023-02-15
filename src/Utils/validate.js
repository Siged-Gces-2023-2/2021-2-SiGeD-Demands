const addError = errorMessage => errors.push(errorMessage);

const validateOpen = (open) => {
  const regex = /^(true|false)$/;
  
  return regex.test(open);
};

const validateImportant = (important) => {
  const regex = /^(true|false)$/;

  return regex.test(important);
};

const validateSectorID = (sectorID) => {
  const errors = [];
  if (!sectorID) 
    addError('Sector Id is invalid');
  
  return errors;
};

const validateCategory = (name, description, color) => {
  const errors = [];

  if (!name)
    addError('invalid name');

  if (!description)
    addError('invalid description');

  if (!color)
    addError('invalid color');

  return errors;
};

const validateAlert = (name, description, date, demandID, sectorID) => {
  const errors = [];

  if (!name)
    addError('Name is invalid');

  if (!description)
    addError('Description is invalid');

  if (!date)
    addError('Date is invalid');

  if (!demandID)
    addError('Demand Id is invalid');

  if (!sectorID)
    addError('Sector Id is invalid');
  
  return errors;
};

const validateDemand = (
  name, description, categoryID, sectorID, clientID, userID
) => {
  const errors = [];

  if (!name)
    addError('Name is invalid');
   
  if (!description)
    addError('Description is invalid');
   
  if (categoryID.length === 0)
    addError('Category Id invalid');
   
  if (!sectorID)
    addError('Sector Id is invalid');
   
  if (!clientID)
    addError('Client Id is invalid');
   
  if (!userID)
    addError('User Id is invalid');

  return errors;
};

const validateDemandUpdate = (
  userName, description, visibilityRestriction, userSector, userID, important
) => {
  const errors = [];

  if (!userName) 
    addError('User name is invalid');

  if (!description) 
    addError('Description is invalid');
  
  if (!validateOpen(visibilityRestriction)) 
    addError('Visibility restriction is invalid');
  
  if (!userSector)
    addError('User sector is invalid');
   
  if (!userID)
    addError('User ID is invalid');
   
  if (!validateImportant(important))
    addError('Important is invalid');
  
  return errors;
};

module.exports = {
  validateCategory,
  validateAlert,
  validateDemand,
  validateOpen,
  validateDemandUpdate,
  validateSectorID,
};
