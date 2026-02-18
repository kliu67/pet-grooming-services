export function validateServiceInput({ name, base_price }) {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Name cannot be empty");
  }

  if (name && name.length > 60) {
    errors.push("Name must be 60 characters or fewer");
  }

  if (base_price === undefined || base_price === null || isNaN(Number(base_price))) {
    errors.push("Base price must be a valid number");
  }

  if (Number(base_price) <= 0) {
    errors.push("Base price must be positive");
  }

  if (errors.length > 0) {
    const error = new Error("Validation failed");
    error.details = errors;
    throw error;
  }
}

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

