/** 与后端批量问候缓存对齐的日历日（上海时区 YYYY-MM-DD） */
export function formatShanghaiYmd(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
