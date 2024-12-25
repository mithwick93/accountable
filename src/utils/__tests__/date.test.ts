import { calculateLiabilityDates } from '../date';

describe('calculateLiabilityDates', () => {
  it('should calculate correct dates when current day is before statement day', () => {
    const currentDate = new Date(2023, 9, 10); // October 10, 2023
    const dueDay = 20;
    const statementDay = 15;

    const result = calculateLiabilityDates(currentDate, dueDay, statementDay);

    expect(result.statementDate).toBe('15/10/2023');
    expect(result.dueDate).toBe('20/10/2023');
  });

  it('should calculate correct dates when current day is after statement day but before due day', () => {
    const currentDate = new Date(2023, 9, 16); // October 16, 2023
    const dueDay = 20;
    const statementDay = 15;

    const result = calculateLiabilityDates(currentDate, dueDay, statementDay);

    expect(result.statementDate).toBe('15/10/2023');
    expect(result.dueDate).toBe('20/10/2023');
  });

  it('should calculate correct dates when current day is after due day', () => {
    const currentDate = new Date(2023, 9, 21); // October 21, 2023
    const dueDay = 20;
    const statementDay = 15;

    const result = calculateLiabilityDates(currentDate, dueDay, statementDay);

    expect(result.statementDate).toBe('15/11/2023');
    expect(result.dueDate).toBe('20/11/2023');
  });

  it('should calculate correct dates when statement day is not provided', () => {
    const currentDate = new Date(2023, 9, 10); // October 10, 2023
    const dueDay = 20;

    const result = calculateLiabilityDates(currentDate, dueDay);

    expect(result.statementDate).toBeUndefined();
    expect(result.dueDate).toBe('20/10/2023');
  });

  it('should calculate correct dates when current day is after due day and statement day is not provided', () => {
    const currentDate = new Date(2023, 9, 21); // October 21, 2023
    const dueDay = 20;

    const result = calculateLiabilityDates(currentDate, dueDay);

    expect(result.statementDate).toBeUndefined();
    expect(result.dueDate).toBe('20/11/2023');
  });
});
