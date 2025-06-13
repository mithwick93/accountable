import { SelectChangeEvent } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import { ColumnFilter } from '@tanstack/table-core/src/features/ColumnFiltering';
import {
  addMonths,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getStartEndDate } from '../utils/common';

export type DateRangeSelectorProps = {
  // eslint-disable-next-line no-unused-vars
  onRangeChange?: (range: string) => void;
};

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  onRangeChange,
}) => {
  const { settings, update, loading } = useSettings();
  const { startDate, endDate } = getStartEndDate(settings);

  const predefinedRanges = useMemo(() => {
    const now = new Date();
    return [
      { label: 'Custom', value: 'custom' },
      { label: 'All', value: 'all', start: null, end: null },
      {
        label: format(now, 'MMMM yyyy'),
        value: `${startOfMonth(now).toISOString()}|${endOfMonth(
          now,
        ).toISOString()}`,
        start: startOfMonth(now),
        end: endOfMonth(now),
      },
      {
        label: format(addMonths(now, -1), 'MMMM yyyy'),
        value: `${startOfMonth(addMonths(now, -1)).toISOString()}|${endOfMonth(
          addMonths(now, -1),
        ).toISOString()}`,
        start: startOfMonth(addMonths(now, -1)),
        end: endOfMonth(addMonths(now, -1)),
      },
      {
        label: format(addMonths(now, -2), 'MMMM yyyy'),
        value: `${startOfMonth(addMonths(now, -2)).toISOString()}|${endOfMonth(
          addMonths(now, -2),
        ).toISOString()}`,
        start: startOfMonth(addMonths(now, -2)),
        end: endOfMonth(addMonths(now, -2)),
      },
      {
        label: format(addMonths(now, -3), 'MMMM yyyy'),
        value: `${startOfMonth(addMonths(now, -3)).toISOString()}|${endOfMonth(
          addMonths(now, -3),
        ).toISOString()}`,
        start: startOfMonth(addMonths(now, -3)),
        end: endOfMonth(addMonths(now, -3)),
      },
      {
        label: format(addMonths(now, -4), 'MMMM yyyy'),
        value: `${startOfMonth(addMonths(now, -4)).toISOString()}|${endOfMonth(
          addMonths(now, -4),
        ).toISOString()}`,
        start: startOfMonth(addMonths(now, -4)),
        end: endOfMonth(addMonths(now, -4)),
      },
      {
        label: format(addMonths(now, -5), 'MMMM yyyy'),
        value: `${startOfMonth(addMonths(now, -5)).toISOString()}|${endOfMonth(
          addMonths(now, -5),
        ).toISOString()}`,
        start: startOfMonth(addMonths(now, -5)),
        end: endOfMonth(addMonths(now, -5)),
      },
      {
        label: format(addMonths(now, 1), 'MMMM yyyy'),
        value: `${startOfMonth(addMonths(now, 1)).toISOString()}|${endOfMonth(
          addMonths(now, 1),
        ).toISOString()}`,
        start: startOfMonth(addMonths(now, 1)),
        end: endOfMonth(addMonths(now, 1)),
      },
      {
        label: format(now, 'yyyy'),
        value: `${startOfYear(now).toISOString()}|${endOfYear(
          now,
        ).toISOString()}`,
        start: startOfYear(now),
        end: endOfYear(now),
      },
      {
        label: format(addYears(now, -1), 'yyyy'),
        value: `${startOfYear(addYears(now, -1)).toISOString()}|${endOfYear(
          addYears(now, -1),
        ).toISOString()}`,
        start: startOfYear(addYears(now, -1)),
        end: endOfYear(addYears(now, -1)),
      },
      {
        label: format(addYears(now, -2), 'yyyy'),
        value: `${startOfYear(addYears(now, -2)).toISOString()}|${endOfYear(
          addYears(now, -2),
        ).toISOString()}`,
        start: startOfYear(addYears(now, -2)),
        end: endOfYear(addYears(now, -2)),
      },
    ];
  }, []);

  const getInitialSelectedRange = useMemo(() => {
    if (startDate && endDate) {
      const matchedRange = predefinedRanges.find(
        (r) =>
          r.start?.getTime() === new Date(startDate).getTime() &&
          r.end?.getTime() === new Date(endDate).getTime(),
      );
      if (matchedRange) {
        return matchedRange.value;
      }
    }

    if (startDate || endDate) {
      return predefinedRanges[0].value;
    }

    return predefinedRanges[1].value;
  }, [predefinedRanges, startDate, endDate]);

  const [selectedRange, setSelectedRange] = useState<string>(
    getInitialSelectedRange,
  );

  useEffect(() => {
    setSelectedRange(getInitialSelectedRange);
  }, [getInitialSelectedRange]);

  const handleRangeChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    setSelectedRange(value);

    const newColumnFilters = (
      settings?.transactions?.search?.columnFilters || []
    ).filter((filter: ColumnFilter) => filter.id !== 'date');

    if (value !== 'all') {
      const [start, end] = value.split('|');
      newColumnFilters.push({
        id: 'date',
        value: [start || null, end || null],
      });
    }

    update({
      ...settings,
      transactions: {
        ...(settings?.transactions || {}),
        search: {
          ...(settings?.transactions?.search || {}),
          columnFilters: newColumnFilters,
        },
      },
    });

    if (onRangeChange) {
      onRangeChange(value);
    }
  };

  if (loading) {
    return <Skeleton variant="rounded" width={145} height={40} />;
  }

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <Select
        labelId="date-range-label"
        id="date-range"
        value={selectedRange}
        onChange={handleRangeChange}
      >
        {predefinedRanges.map((range) => (
          <MenuItem
            key={range.value}
            value={range.value}
            disabled={range.value === 'custom'}
          >
            {range.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DateRangeSelector;
