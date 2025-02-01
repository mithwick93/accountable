export const defaultUserSettings = {
  currency: 'SEK',
  transactions: {
    updateAccounts: false,
    search: {
      parameters: {
        userIds: null,
        dateFrom: null,
        dateTo: null,
        types: null,
        categoryIds: null,
        fromAssetIds: null,
        toAssetIds: null,
        fromPaymentSystemIds: null,
        toPaymentSystemIds: null,
        fromLiabilityIds: null,
        toLiabilityIds: null,
        hasPendingSettlements: null,
        hasSharedTransactions: null,
        pageIndex: 0,
        pageSize: 25,
        sorting: ['date,desc'],
      },
    },
  },
};
