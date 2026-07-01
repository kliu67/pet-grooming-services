
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const isValidPhone = (phone) =>{
    return /^[0-9+\-()\s]{6,20}$/.test(phone);
}