import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon="info"
        title="页面不存在"
        description="你访问的页面走丢了。"
        action={<Button onClick={() => navigate('/')}>返回首页</Button>}
      />
    </div>
  );
}
