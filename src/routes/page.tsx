import { useNavigate } from '@modern-js/runtime/router';
import { GATE_TEMPLATES, SSU_TEMPLATES, TURRET_TEMPLATES } from '@/templates';
import type { AssemblyTemplate } from '@/templates/types';

const ASSEMBLY_GROUPS = [
  { icon: '🛡️', label: 'Smart Gate', templates: GATE_TEMPLATES },
  { icon: '📦', label: 'Storage Unit', templates: SSU_TEMPLATES },
  { icon: '🔫', label: 'Turret', templates: TURRET_TEMPLATES },
];

function TemplateCard({
  template,
  onClick,
}: {
  template: AssemblyTemplate;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        width: '100%',
        padding: '20px 24px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid #30363d',
        borderRadius: '10px',
        color: '#e6edf3',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          'rgba(68,147,248,0.08)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#4493f8';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          'rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363d';
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#e6edf3',
          letterSpacing: '0.2px',
        }}
      >
        {template.label}
      </span>
      <span style={{ fontSize: '12px', color: '#8b949e', lineHeight: '1.5' }}>
        {template.description}
      </span>
      <span
        style={{
          marginTop: '4px',
          fontSize: '11px',
          color: '#4493f8',
          fontWeight: 500,
        }}
      >
        Open in Playground →
      </span>
    </button>
  );
}

export default function IndexPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d1117',
        color: '#e6edf3',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 24px 80px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '56px', maxWidth: '600px' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#4493f8',
            background: 'rgba(68,147,248,0.1)',
            border: '1px solid rgba(68,147,248,0.2)',
            borderRadius: '100px',
            padding: '4px 14px',
            marginBottom: '20px',
          }}
        >
          EVE Frontier
        </div>
        <h1
          style={{
            fontSize: '42px',
            fontWeight: 700,
            margin: '0 0 14px',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #e6edf3 0%, #8b949e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          EasyAssemblies
        </h1>
        <p style={{ fontSize: '16px', color: '#8b949e', margin: 0, lineHeight: '1.6' }}>
          Deploy smart assemblies in clicks, not code.
        </p>
      </div>

      {/* Template Groups */}
      <div style={{ width: '100%', maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {ASSEMBLY_GROUPS.map((group) => (
          <section key={group.label}>
            {/* Group Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #21262d',
              }}
            >
              <span style={{ fontSize: '18px' }}>{group.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3' }}>
                {group.label}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: '#8b949e',
                  background: '#21262d',
                  borderRadius: '100px',
                  padding: '1px 8px',
                }}
              >
                {group.templates.length}
              </span>
            </div>

            {/* Template Cards or Empty State */}
            {group.templates.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '12px',
                }}
              >
                {group.templates.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    onClick={() => navigate(`/playground?template=${tpl.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '24px',
                  border: '1px dashed #21262d',
                  borderRadius: '10px',
                  textAlign: 'center',
                  color: '#8b949e',
                  fontSize: '13px',
                }}
              >
                Coming in Phase 5…
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
