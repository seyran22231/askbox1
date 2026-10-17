// Простой фильтр мата и угроз. Включается/выключается блогером в кабинете.
// Это первая линия защиты, а не идеальная модерация: блогер всё равно
// может удалить любой вопрос вручную.

const LATIN_TO_CYR = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', k: 'к', m: 'м', t: 'т', b: 'в', h: 'н', '3': 'з', '0': 'о', '6': 'б' };

const START = '(?:^|[^а-яa-z])';

const PATTERNS = [
  // мат (с проверкой начала слова там, где корень встречается в обычных словах)
  new RegExp(`${START}(?:на|по|от|ни|охуе|о)?ху[йеяюи]`, 'u'),
  /пизд/u,
  new RegExp(`${START}(?:за|вы|у|до|на|по|от|раз|разъ|съ|при|об|объ|долбо|долба)?[её]б(?:а|у|л|ну|ан|ат|ош|ыв|ли|ись)`, 'u'),
  new RegExp(`${START}бл(?:ять|яд|я(?:[^а-я]|$))`, 'u'),
  new RegExp(`${START}сук(?:а|и|у|ой|ам)(?:[^а-я]|$)`, 'u'),
  /мудак|мудил|пид[оа]р|гандон|шлюх|долбо[её]б|уеб[аи]щ/u,
  // угрозы и призывы к самоповреждению
  /сдохни|убей\s*себя|убейся|выпились|повесься|вскройся/u,
  // английский
  /\b(?:fuck|bitch|cunt|whore|faggot|nigg)/i,
  /\bkys\b|kill\s*your\s*self/i,
];

function toCyrillicLookalike(text) {
  return text.replace(/[aeopcxykmtbh306]/g, (ch) => LATIN_TO_CYR[ch] ?? ch);
}

export function isOffensive(text) {
  const lower = String(text).toLowerCase().replace(/ё/g, 'е');
  const variants = [lower, toCyrillicLookalike(lower)];
  return variants.some((v) => PATTERNS.some((re) => re.test(v)));
}
