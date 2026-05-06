import { useEditor } from '../state/store';
import { translate, type Lang } from './dict';

export const useT = () => {
  const lang = useEditor((s) => s.language);
  return (key: string) => translate(lang, key);
};

export const useLang = (): Lang => useEditor((s) => s.language);
