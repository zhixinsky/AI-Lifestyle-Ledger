export function useMoney() {
  const formatMoney = (value = 0) => `¥ ${Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const formatSignedMoney = (value = 0, type: 'expense' | 'income') => `${type === 'expense' ? '-' : '+'} ${formatMoney(value)}`;

  return {
    formatMoney,
    formatSignedMoney
  };
}
