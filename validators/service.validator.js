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
