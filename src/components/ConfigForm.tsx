import { useState } from 'react';
import type { ConfigField } from '@/templates/types';

export interface ConfigFormProps {
  fields: ConfigField[];
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
  templateLabel: string;
}

export function ConfigForm({
  fields,
  onSubmit,
  onCancel,
  templateLabel,
}: ConfigFormProps) {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {};
    for (const f of fields) {
      init[f.key] = f.defaultValue;
    }
    return init;
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleChange = (key: string, raw: string, field: ConfigField) => {
    const parsed: string | number =
      field.type === 'number' ? (raw === '' ? '' as unknown as number : Number(raw)) : raw;
    setValues(prev => ({ ...prev, [key]: parsed }));
    if (field.validate) {
      setErrors(prev => ({ ...prev, [key]: field.validate!(parsed) }));
    }
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string | null> = {};
    let hasError = false;
    for (const f of fields) {
      const err = f.validate?.(values[f.key]) ?? null;
      nextErrors[f.key] = err;
      if (err) hasError = true;
    }
    setErrors(nextErrors);
    if (hasError) return;
    onSubmit(values as Record<string, unknown>);
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#e6edf3' }}>
            Configure Template
          </span>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>{templateLabel}</span>
        </div>

        <div style={bodyStyle}>
          {fields.map(field => (
            <label key={field.key} style={fieldWrapStyle}>
              <span style={labelStyle}>{field.label}</span>
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={values[field.key] ?? ''}
                placeholder={field.placeholder}
                onChange={e => handleChange(field.key, e.target.value, field)}
                style={{
                  ...inputStyle,
                  borderColor: errors[field.key] ? '#f87171' : '#444',
                }}
              />
              {errors[field.key] && (
                <span style={errorStyle}>{errors[field.key]}</span>
              )}
            </label>
          ))}
        </div>

        <div style={footerStyle}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} style={submitBtnStyle}>
            Open in Playground
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.6)',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '20px 24px 16px',
  borderBottom: '1px solid #21262d',
};

const bodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '20px 24px',
  maxHeight: '60vh',
  overflowY: 'auto',
};

const fieldWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: '#8b949e',
  letterSpacing: '0.3px',
};

const inputStyle: React.CSSProperties = {
  height: '36px',
  padding: '0 12px',
  borderRadius: '6px',
  border: '1px solid #444',
  backgroundColor: '#0d1117',
  color: '#e6edf3',
  fontSize: '13px',
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  transition: 'border-color 0.15s',
};

const errorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#f87171',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  padding: '16px 24px',
  borderTop: '1px solid #21262d',
};

const cancelBtnStyle: React.CSSProperties = {
  height: '34px',
  padding: '0 16px',
  borderRadius: '6px',
  border: '1px solid #30363d',
  backgroundColor: 'transparent',
  color: '#8b949e',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};

const submitBtnStyle: React.CSSProperties = {
  height: '34px',
  padding: '0 20px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#6366f1',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};
