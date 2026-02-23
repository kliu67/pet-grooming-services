export function isIdValidNumeric(id) {
  //number cannot be undefined or null
   if (id === undefined || id === null) {
    return false;
  }

  const numericId = Number(id);

  //id must be an integer greater than 0
  if (Number.isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) 
    {
    return false;
    }

  return true;
}
export function validateNumericId(id) {
  if (id === undefined || id === null) {
    throw new Error("ID is required");
  }

  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    throw new Error("ID must be a number");
  }

  if (!Number.isInteger(numericId)) {
    throw new Error("ID must be an integer");
  }

  if (numericId <= 0) {
    throw new Error("ID must be greater than 0");
  }

  return numericId; // return sanitized value
}
