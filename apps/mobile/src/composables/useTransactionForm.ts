import { ref } from 'vue';
import { transactionApi, type TransactionPayload } from '@/api/transactions';
import type { TransactionType } from '@/types/domain';

export function useTransactionForm(onSaved?: () => Promise<void> | void) {
  const visible = ref(false);
  const saving = ref(false);
  const form = ref<TransactionPayload>({
    type: 'expense',
    amount: 0,
    categoryId: '',
    occurredAt: new Date().toISOString(),
    remark: '',
    tags: []
  });

  const open = (type: TransactionType = 'expense') => {
    form.value = {
      type,
      amount: 0,
      categoryId: '',
      occurredAt: new Date().toISOString(),
      remark: '',
      tags: []
    };
    visible.value = true;
  };

  const save = async () => {
    saving.value = true;
    try {
      await transactionApi.create(form.value);
      visible.value = false;
      uni.showToast({ title: '记账成功', icon: 'success' });
      await onSaved?.();
    } catch (e: any) {
      console.error('[save] failed:', e);
      uni.showToast({ title: e?.message || '保存失败，请重试', icon: 'none' });
    } finally {
      saving.value = false;
    }
  };

  return {
    visible,
    saving,
    form,
    open,
    save
  };
}
