import { useEffect } from 'react';
import { useNavigate } from '@modern-js/runtime/router';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // 自动重定向到 playground 并加载默认的 mock 模板
    navigate('/playground?template=gate_tribe_permit', { replace: true });
  }, [navigate]);

  return (
    <div style={{ padding: '24px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
      Redirecting to Assembly Forge Playground...
    </div>
  );
}
