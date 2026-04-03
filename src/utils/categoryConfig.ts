/**
 * Category configuration mapping
 * Maps category IDs to their transfer target type
 * This allows the UI to respond to categories without hardcoding names
 *
 * IMPORTANT: Update these IDs to match your actual category IDs from the backend
 */

export type TransferTargetType = 'asset' | 'liability' | null;

interface CategoryTransferConfig {
  categoryIds: number[];
  targetType: TransferTargetType;
  description: string;
}

/**
 * Configuration for transfer categories
 * Organized by the target type they support
 *
 * NOTE: You should populate these IDs based on your actual backend categories
 * For now, they're placeholders - update them with your real category IDs
 */
export const TRANSFER_CATEGORY_CONFIG: CategoryTransferConfig[] = [
  {
    categoryIds: [16, 40],
    targetType: 'asset',
    description: 'Asset to Asset transfers',
  },
  {
    categoryIds: [17],
    targetType: 'liability',
    description: 'Liability Settlement transfers',
  },
];

/**
 * Get the transfer target type for a category ID
 * Returns 'asset' | 'liability' | null
 *
 * @param categoryId - The category ID to check
 * @returns The transfer target type or null if not a transfer category
 */
export const getTransferTargetType = (
  categoryId?: number,
): TransferTargetType => {
  if (!categoryId) {
    return null;
  }

  const config = TRANSFER_CATEGORY_CONFIG.find((c) =>
    c.categoryIds.includes(categoryId),
  );

  return config?.targetType ?? null;
};

/**
 * Check if a category should show the asset selector
 * @param categoryId - The category ID to check
 */
export const isAssetTransferCategory = (categoryId?: number): boolean =>
  getTransferTargetType(categoryId) === 'asset';

/**
 * Check if a category should show the liability selector
 * @param categoryId - The category ID to check
 */
export const isLiabilitySettlementCategory = (categoryId?: number): boolean =>
  getTransferTargetType(categoryId) === 'liability';
