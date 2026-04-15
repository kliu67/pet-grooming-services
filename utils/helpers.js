import { validate as isUuid } from "uuid";

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const isNumbersOnly = (str)=> {
  return /^\d+$/.test(str);
}

export const isValidUUID = (id) => {
  return isUuid(id);
}

export const isValidId = (id) => {
  const sanitizedId = Number(id);
  return sanitizedId !== NaN && sanitizedId > 0;
}

export const isValidPrice = (price) =>{
  return price >= 0;
}

export const computeBuffer = (serviceName) =>{
  let buffer = 0;
  switch(serviceName){
    case 'Bath':
    case 'Full grooming':
    case 'Basic grooming':
      buffer = 20;
      break;
    default:
      buffer = 10;
  }
  return buffer;
}