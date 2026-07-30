'use client';

import { useState, use } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const JOB_TYPES = ['Electrical','Plumbing','HVAC','Roofing','General Repair','Renovation','Inspection','Quote Visit','Other'];

function pad(n: number) { return n.toString().padStart(2, '0'); }

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${pad(m)} ${ampm}`;
}

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return { first, days };
}

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [step, setStep] = useState<'date' | 'time' | 'details' | 'done'>('date');
  const [notFound, setNotFound] = useState(false);

  // Calendar
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState('');

  // Slots
  const [slots, setSlots]           = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [noSlotsReason, setNoSlotsReason] = useState('');

  // Form
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', jobType: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function pickDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTime('');
    setNoSlotsReason('');
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/booking/${slug}/availability?date=${dateStr}`);
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json();
      if (data.slots && data.slots.length > 0) {
        setSlots(data.slots);
        setStep('time');
      } else {
        setSlots([]);
        setNoSlotsReason(data.reason || 'no_slots');
        setStep('time');
      }
    } catch {
      setSlots([]);
      setNoSlotsReason('error');
      setStep('time');
    } finally {
      setLoadingSlots(false);
    }
  }

  async function submit() {
    if (!form.customerName.trim() || !form.jobType) { setSubmitError('Name and job type are required.'); return; }
    setSubmitting(true);
    setSubmitError('');
    const res = await fetch(`/api/booking/${slug}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, time: selectedTime, ...form }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error || 'Booking failed. Please try again.');
      if (res.status === 409) { setStep('time'); setSelectedTime(''); }
    } else {
      setStep('done');
    }
    setSubmitting(false);
  }

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Booking unavailable</p>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>This contractor hasn't enabled online booking yet.</p>
      </div>
    </div>
  );

  const { first, days } = buildCalendar(calYear, calMonth);
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);

  const displayDate = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#0f0f0f', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="4" height="16" fill="#ffffff" />
          <rect x="2" y="18" width="20" height="4" fill="#ffffff" />
          <rect x="6" y="18" width="4" height="4" fill="#16a34a" />
        </svg>
        <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '15px', letterSpacing: '-0.3px' }}>TradeDesk</span>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 20px 60px' }}>

        {/* Step indicator */}
        {step !== 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
            {(['date', 'time', 'details'] as const).map((s, i) => {
              const stepIdx = ['date','time','details'].indexOf(step);
              const done = i < stepIdx;
              const active = s === step;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: active ? '#16a34a' : done ? '#16a34a' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: active || done ? 'white' : '#9ca3af' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '12px', color: active ? '#111' : '#9ca3af', fontWeight: active ? '600' : '400', textTransform: 'capitalize' }}>
                    {s === 'date' ? 'Pick a date' : s === 'time' ? 'Pick a time' : 'Your details'}
                  </span>
                  {i < 2 && <div style={{ width: '24px', height: '1px', background: '#e5e7eb' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 1: Date picker */}
        {step === 'date' && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Book an appointment</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 24px' }}>Select a date to see available times.</p>

            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}
              >‹</button>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>{MONTHS[calMonth]} {calYear}</span>
              <button
                onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}
              >›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#9ca3af', padding: '4px 0' }}>{d}</div>)}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: days }).map((_, i) => {
                const d = i + 1;
                const dateStr = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
                const isPast = dateStr < todayStr;
                const isTooFar = new Date(dateStr + 'T12:00:00') > maxDate;
                const disabled = isPast || isTooFar;
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={d}
                    onClick={() => !disabled && pickDate(dateStr)}
                    disabled={disabled || loadingSlots}
                    style={{
                      border: 'none', borderRadius: '8px', padding: '8px 4px',
                      fontSize: '13px', fontWeight: isSelected ? '700' : '400',
                      background: isSelected ? '#16a34a' : 'transparent',
                      color: isSelected ? 'white' : disabled ? '#d1d5db' : '#111',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                    }}
                  >{d}</button>
                );
              })}
            </div>
            {loadingSlots && <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '16px' }}>Checking availability...</p>}
          </div>
        )}

        {/* STEP 2: Time slots */}
        {step === 'time' && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <button onClick={() => { setStep('date'); setSelectedTime(''); }} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← Back
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 4px' }}>Available times</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px' }}>{displayDate}</p>

            {slots.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', background: '#f9fafb', borderRadius: '10px' }}>
                <p style={{ color: '#374151', fontWeight: '600', fontSize: '14px', margin: '0 0 4px' }}>No availability on this day</p>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 16px' }}>
                  {noSlotsReason === 'not_working_day' ? 'This is not a working day.' : 'All slots are fully booked.'}
                </p>
                <button onClick={() => setStep('date')} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Try another date
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      style={{
                        padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        border: selectedTime === slot ? '2px solid #16a34a' : '1px solid #e5e7eb',
                        background: selectedTime === slot ? '#f0fdf4' : 'white',
                        color: selectedTime === slot ? '#15803d' : '#374151',
                      }}
                    >
                      {fmt12(slot)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => selectedTime && setStep('details')}
                  disabled={!selectedTime}
                  style={{ width: '100%', padding: '12px', background: selectedTime ? '#16a34a' : '#e5e7eb', color: selectedTime ? 'white' : '#9ca3af', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: selectedTime ? 'pointer' : 'not-allowed' }}
                >
                  Continue {selectedTime ? `— ${fmt12(selectedTime)}` : ''}
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 3: Details form */}
        {step === 'details' && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <button onClick={() => setStep('time')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← Back
            </button>

            {/* Summary */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#15803d' }}>{displayDate}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#16a34a' }}>{fmt12(selectedTime)}</p>
              </div>
              <button onClick={() => setStep('time')} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 20px' }}>Your details</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Full Name *</label>
                <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="John Smith" style={inp} />
              </div>
              <div>
                <label style={lbl}>Job Type *</label>
                <select value={form.jobType} onChange={e => setForm(f => ({ ...f, jobType: e.target.value }))} style={inp}>
                  <option value="">Select type of work...</option>
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="(416) 555-0100" type="tel" style={inp} />
              </div>
              <div>
                <label style={lbl}>Email <span style={{ color: '#9ca3af', fontWeight: '400' }}>(for confirmation)</span></label>
                <input value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="you@email.com" type="email" style={inp} />
              </div>
              <div>
                <label style={lbl}>Describe the work</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Brief description of what needs to be done..." rows={3} style={{ ...inp, resize: 'vertical', lineHeight: '1.6' }} />
              </div>
            </div>

            {submitError && <p style={{ color: '#dc2626', fontSize: '13px', margin: '12px 0 0' }}>{submitError}</p>}

            <button
              onClick={submit}
              disabled={submitting}
              style={{ width: '100%', marginTop: '20px', padding: '13px', background: submitting ? '#86efac' : '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === 'done' && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '48px 28px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '56px', height: '56px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: '0 0 8px', letterSpacing: '-0.3px' }}>You're booked!</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>{displayDate} at {fmt12(selectedTime)}</p>
            {form.customerEmail && <p style={{ fontSize: '13px', color: '#9ca3af', margin: '12px 0 0' }}>A confirmation has been sent to {form.customerEmail}</p>}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '28px' }}>
          Powered by TradeDesk — Business software for Ontario contractors
        </p>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '700',
  color: '#374151', marginBottom: '6px',
};
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
  borderRadius: '8px', fontSize: '13px', color: '#111',
  background: 'white', boxSizing: 'border-box', outline: 'none',
};
