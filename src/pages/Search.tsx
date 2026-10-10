import { PageContainer } from '@/components/layout/PageContainer';
import { SearchBody } from '@/components/search/SearchPanel';

export function Search() {
  return (
    <PageContainer title="搜索" subtitle="查找单词、词根与词缀">
      <SearchBody />
    </PageContainer>
  );
}
