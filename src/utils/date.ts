import { format, setDate } from 'date-fns';

export const calculateLiabilityDates = (
  currentDate: Date,
  dueDay: number,
  statementDay?: number,
): {
  statementDate?: string;
  dueDate: string;
} => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  const getDateForDay = (monthOffset: number, day: number): Date =>
    setDate(new Date(currentYear, currentMonth + monthOffset), day);

  let statementDate: Date | undefined;
  let dueDate: Date;

  if (statementDay) {
    if (currentDay <= statementDay) {
      statementDate = getDateForDay(0, statementDay);
      dueDate = getDateForDay(statementDay < dueDay ? 0 : 1, dueDay);
    } else if (currentDay > dueDay) {
      statementDate = getDateForDay(1, statementDay);
      dueDate = getDateForDay(statementDay < dueDay ? 1 : 2, dueDay);
    } else {
      statementDate = getDateForDay(0, statementDay);
      dueDate = getDateForDay(statementDay < dueDay ? 0 : 1, dueDay);
    }
  } else {
    dueDate = getDateForDay(currentDay > dueDay ? 1 : 0, dueDay);
  }

  return {
    statementDate: statementDate
      ? format(statementDate, 'dd/MM/yyyy')
      : undefined,
    dueDate: format(dueDate, 'dd/MM/yyyy'),
  };
};
