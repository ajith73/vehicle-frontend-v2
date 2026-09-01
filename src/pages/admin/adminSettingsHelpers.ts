import type { SubscriptionPlan } from '../../types';

export const adminSettingsTabs = [
  { id: 'types', label: 'Vehicle & Service Types' },
  { id: 'specific', label: 'Specific Services' },
  { id: 'membership', label: 'Membership Plans' }
] as const;

export type AdminSettingsTab = typeof adminSettingsTabs[number]['id'];

export const createEmptyPlanForm = () => ({
  name: '',
  tier: '',
  description: '',
  priceAmount: '0',
  billingCycle: 'MONTHLY',
  platformFeeDiscountPercent: '0',
  prioritySupport: false,
  priorityDispatch: false,
  trustedOnlyAccess: false,
  isActive: true,
});

export const mapPlanToForm = (plan: SubscriptionPlan) => ({
  name: plan.name,
  tier: plan.tier,
  description: plan.description || '',
  priceAmount: String(plan.priceAmount ?? 0),
  billingCycle: plan.billingCycle || 'MONTHLY',
  platformFeeDiscountPercent: String(plan.platformFeeDiscountPercent ?? 0),
  prioritySupport: Boolean(plan.prioritySupport),
  priorityDispatch: Boolean(plan.priorityDispatch),
  trustedOnlyAccess: Boolean(plan.trustedOnlyAccess),
  isActive: Boolean(plan.isActive),
});

export const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const toFeatureOptions = (items: any[]) =>
  items
    .filter((item: any) => item.isFeatured)
    .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
    .map((item: any) => ({ value: item.id, label: item.name }));

export const toSelectOptions = (items: any[]) => items.map((item: any) => ({ value: item.id, label: item.name }));

export const selectThemeStyles = {
  control: (base: any) => ({ ...base, backgroundColor: 'transparent', borderColor: 'hsl(var(--border))' }),
  menu: (base: any) => ({ ...base, backgroundColor: 'hsl(var(--card))' }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'hsl(var(--secondary))' : 'hsl(var(--background))',
    color: 'hsl(var(--foreground))'
  }),
  multiValue: (base: any) => ({ ...base, backgroundColor: 'hsl(var(--primary))', opacity: 0.9 }),
  multiValueLabel: (base: any) => ({ ...base, color: 'hsl(var(--primary-foreground))' }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: 'hsl(var(--primary-foreground))',
    ':hover': { backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }
  }),
  input: (base: any) => ({ ...base, color: 'hsl(var(--foreground))' })
};
