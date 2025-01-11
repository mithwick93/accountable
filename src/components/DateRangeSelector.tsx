import { SelectChangeEvent } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { ColumnFilter } from '@tanstack/table-core/src/features/ColumnFiltering';
import {
  addMonths,
  addYears,
  format,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getStartEndDate } from '../utils/common';

const DateRangeSelector = () => {
  const { settings, update } = useSettings();
  const { startDate, endDate } = getStartEndDate(settings);

  const predefinedRanges = useMemo(() => {
    const now = new Date();
    return [
      { label: 'Custom', value: 'custom' },
      { label: 'All', value: 'all', start: null, end: null },
      {
        label: format(now, 'MMMM yyyy'),
        value: `${startOfMonth(now).toISOString()}|${startOfMonth(
          addMonths(now, 1),
        ).toISOString()}`,
        start: startOfMonth(now),
        end: startOfMonth(addMonths(now, 1)),
      },
      {
        label: format(addMonths(now, 1), 'MMMM yyyy'),
        value: `${startOfMonth(addMonths(now, 1)).toISOString()}|${startOfMonth(
          addMonths(now, 2),
        ).toISOString()}`,
        start: startOfMonth(addMonths(now, 1)),
        end: startOfMonth(addMonths(now, 2)),
      },
      {
        label: format(addMonths(now, -1), 'MMMM yyyy'),
        value: `${startOfMonth(
          addMonths(now, -1),
        ).toISOString()}|${startOfMonth(now).toISOString()}`,
        start: startOfMonth(addMonths(now, -1)),
        end: startOfMonth(now),
      },
      {
        label: format(addMonths(now, -2), 'MMMM yyyy'),
        value: `${startOfMonth(
          addMonths(now, -2),
        ).toISOString()}|${startOfMonth(addMonths(now, -1)).toISOString()}`,
        start: startOfMonth(addMonths(now, -2)),
        end: startOfMonth(addMonths(now, -1)),
      },
      {
        label: format(now, 'yyyy'),
        value: `${startOfYear(now).toISOString()}|${startOfYear(
          addYears(now, 1),
        ).toISOString()}`,
        start: startOfYear(now),
        end: startOfYear(addYears(now, 1)),
      },
      {
        label: format(addYears(now, -1), 'yyyy'),
        value: `${startOfYear(addYears(now, -1)).toISOString()}|${startOfYear(
          now,
        ).toISOString()}`,
        start: startOfYear(addYears(now, -1)),
        end: startOfYear(now),
      },
      {
        label: format(addYears(now, -2), 'yyyy'),
        value: `${startOfYear(addYears(now, -2)).toISOString()}|${startOfYear(
          addYears(now, -1),
        ).toISOString()}`,
        start: startOfYear(addYears(now, -2)),
        end: startOfYear(addYears(now, -1)),
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
  }, [startDate, endDate]);

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
  };

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
