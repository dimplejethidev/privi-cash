export const getItem = (key: string, defaultValue: any) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

export const storeItem = (key: string, value: any) => {
  return localStorage.setItem(key, JSON.stringify(value));
};
