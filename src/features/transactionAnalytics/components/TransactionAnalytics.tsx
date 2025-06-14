import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import DateRangeSelector from '../../../components/DateRangeSelector';

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

class CustomTabPanel extends React.Component<TabPanelProps> {
  render() {
    const { children, value, index, ...other } = this.props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }
}

const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  'aria-controls': `simple-tabpanel-${index}`,
});

const TransactionAnalytics: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="transactions summary"
        >
          <Tab label="summary" {...a11yProps(0)} />\
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
          <Typography variant="h6">Billing Period:</Typography>
          <DateRangeSelector />
        </Box>
      </CustomTabPanel>
    </Box>
  );
};

export default TransactionAnalytics;
