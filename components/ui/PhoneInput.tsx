'use client';
import { useState, useRef, useEffect } from 'react';
import { normalizeIntl } from '@/lib/validation';

const COUNTRIES = [
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China' },
  { code: 'JP', dial: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: 'KR', dial: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: 'AR', dial: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'ZA', dial: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: 'EG', dial: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'PK', dial: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'LK', dial: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: 'PH', dial: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: 'VN', dial: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: 'TH', dial: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: 'ID', dial: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: 'MY', dial: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: 'HK', dial: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: 'TW', dial: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: 'BE', dial: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: 'CH', dial: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: 'AT', dial: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: 'SE', dial: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: 'NO', dial: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: 'DK', dial: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: 'PL', dial: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: 'RU', dial: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Ukraine' },
];

interface Props {
  value: string;       // full phone like "+1 8565550123"
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, disabled }: Props) {
  const [country, setCountry] = useState(COUNTRIES[0]); // default US
  const [number, setNumber]   = useState('');
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync internal state with parent value
  function update(c: typeof country, n: string) {
    setCountry(c); setNumber(n);
    onChange(n ? `${c.dial} ${n}` : '');
  }

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        gap: 8,
        background: 'rgba(18,36,28,0.04)',
        border: '1px solid rgba(18,36,28,0.09)',
        borderRadius: 10,
        height: 42,
        overflow: 'hidden',
      }}>
        {/* Country selector */}
        <button
          type="button"
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 12px',
            background: 'rgba(18,36,28,0.04)',
            border: 'none',
            borderRight: '1px solid rgba(18,36,28,0.09)',
            color: 'var(--white)',
            fontSize: 14,
            cursor: disabled ? 'not-allowed' : 'pointer',
            minWidth: 110,
          }}
        >
          <span style={{ fontSize: 18 }}>{country.flag}</span>
          <span style={{ fontWeight: 600 }}>{country.dial}</span>
          <span style={{ fontSize: 10, marginLeft: 'auto', opacity: 0.6 }}>▼</span>
        </button>

        {/* Phone number */}
        <input
          type="tel"
          value={number}
          onChange={e => update(country, normalizeIntl(e.target.value))}
          disabled={disabled}
          placeholder="5551234567"
          maxLength={14}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--white)',
            fontSize: 14,
            padding: '0 14px',
          }}
        />
      </div>

      {/* Country dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          width: 320,
          background: 'var(--navy2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          maxHeight: 320,
          overflow: 'hidden',
          zIndex: 50,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Search box */}
          <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country or code…"
              style={{
                width: '100%',
                height: 34,
                padding: '0 12px',
                background: 'rgba(18,36,28,0.04)',
                border: '1px solid rgba(18,36,28,0.09)',
                borderRadius: 8,
                color: 'var(--white)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>No match</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { update(c, number); setOpen(false); setSearch(''); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: country.code === c.code ? 'rgba(18,161,80,0.08)' : 'transparent',
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(18,36,28,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = country.code === c.code ? 'rgba(18,161,80,0.08)' : 'transparent'}
                >
                  <span style={{ fontSize: 18 }}>{c.flag}</span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}