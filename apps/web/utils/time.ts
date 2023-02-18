import dayjs from 'dayjs';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const formatDate = (date: Date | number) => dayjs(date).format('DD MMM, hh:mm A');
