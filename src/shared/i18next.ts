import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// 获取当前文件的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 初始化国际化（i18next）设置
 *
 * 此函数使用默认区域设置和人民币货币格式化来检查当前环境是否为中文环境。
 * 然后，它初始化 i18next 并加载英文和中文的本地化资源。
 * 最后，它根据用户的语言环境设置更改 i18next 的语言。
 *
 * @returns {Promise<void>} 当 i18next 初始化完成后，返回一个 Promise
 */
export async function initI18next() {
  await i18next.use(Backend).init({
    lng: 'en',
    fallbackLng: 'en',
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/translation.json'),
    },
    preload: ['en', 'vi'],
    debug: false,
  })
  const lang = isVietnameseEnvironment() ? 'vi' : 'en';
  i18next.changeLanguage(lang);
}

/**
 * 检查当前环境是否为中文环境
 * 通过检查使用默认区域设置和人民币货币格式化的数字是否包含人民币符号（¥）来判断
 *
 * @returns {boolean} 如果当前环境是中文环境，返回 true，否则返回 false
 */
export function isVietnameseEnvironment() {
  const currencyFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(100);
  return currencyFormat.includes('₫');
}