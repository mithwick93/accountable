import ContentCopy from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Payment from 'payment';
import React, { useState } from 'react';
import type { IconType } from 'react-icons';
import {
  LiaCcAmex,
  LiaCcMastercard,
  LiaCcVisa,
  LiaCreditCardSolid,
} from 'react-icons/lia';
import { toast } from 'react-toastify';
import {
  formatCreditCardNumber,
  formatCVC,
  formatExpirationDate,
  isCardExpired,
} from '../utils/cardUtils';

const cardTypeLogos: Record<string, IconType> = {
  amex: LiaCcAmex,
  mastercard: LiaCcMastercard,
  visa: LiaCcVisa,
  default: LiaCreditCardSolid,
};

type CardDetailsProps = {
  card: {
    cardHolderName: string;
    cardNumber: string;
    securityCode: string;
    expiryDate: string;
    additionalNote: string | null;
  };
};

const getCardLogo = (cardNumber: string) => {
  const issuer = Payment.fns.cardType(cardNumber);
  return cardTypeLogos[issuer] || cardTypeLogos.default;
};

const CardField: React.FC<{
  label: string;
  value: string;
  maskedValue?: string;
  showSensitive: boolean;
  onCopy: () => void;
  startAdornment?: React.ReactNode;
}> = ({ label, value, maskedValue, showSensitive, onCopy, startAdornment }) => (
  <Box mb={2}>
    <Typography variant="body2" color="textSecondary">
      {label}
    </Typography>
    <TextField
      variant="outlined"
      value={showSensitive ? value : maskedValue || value}
      fullWidth
      size="small"
      disabled
      slotProps={{
        input: {
          startAdornment: startAdornment && (
            <InputAdornment position="start">{startAdornment}</InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={`Copy ${label}`}>
                <IconButton onClick={onCopy} size="small">
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  </Box>
);

const CardDetails: React.FC<CardDetailsProps> = ({ card }) => {
  const [showSensitive, setShowSensitive] = useState(false);

  const handleToggleShow = () => setShowSensitive(!showSensitive);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied to clipboard`);
  };

  const cardExpired = isCardExpired(card.expiryDate);
  const maskedCardNumber = `**** **** **** ${card.cardNumber.slice(-4)}`;
  const maskedCVV = '***';
  const IssuerLogo = getCardLogo(card.cardNumber);

  return (
    <Card sx={{ maxWidth: 350, marginTop: 2 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Card Details</Typography>
          {cardExpired && <Chip label="Expired" color="error" />}
          <Tooltip title={showSensitive ? 'Hide' : 'Show'}>
            <IconButton onClick={handleToggleShow}>
              {showSensitive ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
        </Box>

        <CardField
          label="Cardholder Name"
          value={card.cardHolderName}
          showSensitive
          onCopy={() => handleCopy(card.cardHolderName)}
        />
        <CardField
          label="Card Number"
          value={formatCreditCardNumber(card.cardNumber)}
          maskedValue={maskedCardNumber}
          showSensitive={showSensitive}
          onCopy={() => handleCopy(card.cardNumber)}
          startAdornment={
            <IssuerLogo size="2em" style={{ marginInlineEnd: 5 }} />
          }
        />
        <Box display="flex" alignItems="center" gap={2}>
          <CardField
            label="Expiry Date"
            value={formatExpirationDate(card.expiryDate)}
            showSensitive
            onCopy={() => handleCopy(card.expiryDate)}
          />
          <CardField
            label="CVV"
            value={formatCVC(card.securityCode, card.cardNumber)}
            maskedValue={maskedCVV}
            showSensitive={showSensitive}
            onCopy={() => handleCopy(card.securityCode)}
          />
        </Box>
        <CardField
          label="Additional note"
          value={card.additionalNote || ''}
          maskedValue="*****"
          showSensitive={showSensitive}
          onCopy={() => handleCopy(card.additionalNote || '')}
        />
      </CardContent>
    </Card>
  );
};

export default CardDetails;
