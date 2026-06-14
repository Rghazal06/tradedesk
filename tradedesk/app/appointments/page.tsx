'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  job_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  notes: string;
  reminder_sent: boolean;
}

const JOB_TYPES = ['Electrical', 'Plumbing', 'HVAC', 'Roofing', 'General Repair', 'Renovation', 'Inspection', 'Quote Visit', 'Other'];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: '#fefce8', text: '#854d0e', border: '#fde047' },
  confirmed: { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  completed: { bg: '#f0f9ff', text: '#0369a1', border: '#7dd3fc' },
  cancelled: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    job_type: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '09:00',
    duration_minutes: '60',
    notes: '',
  });

  useEffect(() => { loadAppointments(); }, []);

  async function loadAppointments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  }

  async function saveAppointment() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('appointments').insert({
      user_id: user.id,
      ...form,
      duration_minutes: parseInt(form.duration_minutes),
      status: 'pending',
    });
    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Appointment booked!');
      setShowForm(false);
      setForm({ customer_name: '', customer_phone: '', customer_email: '', job_type: '', scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '09:00', duration_minutes: '60', notes: '' });
      loadAppointments();
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    loadAppointments();
  }

  async function sendReminder(appointment: Appointment) {
    if (!appointment.customer_phone) {
      alert('No phone number for this customer.');
      return;
    }
    const res = await fetch('/api/send-review-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerPhone: appointment.customer_phone,
        customerName: appointment.customer_name,
        contractorName: 'Your Contractor',
        googleReviewLink: `Reminder: You have an appointment on ${appointment.scheduled_date} at ${appointment.scheduled_time}. See you then!`,
      }),
    });
    const data = await res.json();
    if (data.success) {
      await supabase.from('appointments').update({ reminder_sent: true }).eq('id', appointment.id);
      loadAppointments();
      alert('Reminder sent!');
    } else {
      alert('Failed: ' + data.error);
    }
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Delete this appointment?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    loadAppointments();
  }

  const todayAppointments = appointments.filter(a => a.scheduled_date === new Date().toISOString().split('T')[0]);
  const upcomingAppointments = appointments.filter(a => a.scheduled_date > new Date().toISOString().split('T')[0]);
  const selectedDateAppointments = appointments.filter(a => a.scheduled_date === selectedDate);

  const getDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDay, year, month };
  };

  const { daysInMonth, firstDay, year, month } = getDaysInMonth();
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.scheduled_date === dateStr);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/appointments" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Appointments</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Schedule and manage customer appointments</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
              {(['list', 'calendar'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: view === v ? 'white' : 'transparent',
                  color: view === v ? '#111' : '#6b7280',
                  fontWeight: view === v ? '600' : '400',
                  fontSize: '13px',
                  boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>
                  {v === 'list' ? '☰ List' : '📅 Calendar'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowForm(!showForm)} style={{
              padding: '10px 20px', background: '#16a34a', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            }}>
              + Book Appointment
            </button>
          </div>
        </div>

        <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
          
          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {message}
            </div>
          )}

          {/* Book Form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Book New Appointment</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Customer Name', key: 'customer_name', placeholder: 'John Smith', type: 'text' },
                  { label: 'Phone Number', key: 'customer_phone', placeholder: '519-555-0000', type: 'text' },
                  { label: 'Email', key: 'customer_email', placeholder: 'john@email.com', type: 'email' },
                  { label: 'Date', key: 'scheduled_date', placeholder: '', type: 'date' },
                  { label: 'Time', key: 'scheduled_time', placeholder: '', type: 'time' },
                  { label: 'Duration (minutes)', key: 'duration_minutes', placeholder: '60', type: 'number' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Type</label>
                  <select value={form.job_type} onChange={e => setForm({ ...form, job_type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb' }}>
                    <option value="">Select job type</option>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={saveAppointment} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Booking...' : 'Book Appointment'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {view === 'list' ? (
            <>
              {/* Today */}
              {todayAppointments.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {todayAppointments.map(apt => <AppointmentCard key={apt.id} apt={apt} onStatusChange={updateStatus} onReminder={sendReminder} onDelete={deleteAppointment} />)}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcomingAppointments.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {upcomingAppointments.map(apt => <AppointmentCard key={apt.id} apt={apt} onStatusChange={updateStatus} onReminder={sendReminder} onDelete={deleteAppointment} />)}
                  </div>
                </div>
              )}

              {appointments.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#374151', margin: '0 0 8px' }}>No appointments yet</h3>
                  <p style={{ margin: '0 0 20px' }}>Book your first appointment to get started</p>
                  <button onClick={() => setShowForm(true)} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    + Book Appointment
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Calendar View */
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: 0 }}>{monthName} {year}</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{day}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ height: '100px', borderRight: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayApts = getAppointmentsForDay(day);
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  const isSelected = dateStr === selectedDate;
                  return (
                    <div key={day} onClick={() => setSelectedDate(dateStr)} style={{
                      height: '100px', borderRight: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6',
                      padding: '8px', cursor: 'pointer',
                      background: isSelected ? '#f0fdf4' : 'white',
                      transition: 'background 0.1s',
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isToday ? '#16a34a' : 'transparent',
                        color: isToday ? 'white' : '#111',
                        fontSize: '13px', fontWeight: isToday ? '700' : '400', marginBottom: '4px',
                      }}>{day}</div>
                      {dayApts.slice(0, 2).map(apt => (
                        <div key={apt.id} style={{ fontSize: '10px', background: '#f0fdf4', color: '#15803d', borderRadius: '4px', padding: '2px 6px', marginBottom: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {apt.scheduled_time?.slice(0, 5)} {apt.customer_name}
                        </div>
                      ))}
                      {dayApts.length > 2 && <div style={{ fontSize: '10px', color: '#6b7280' }}>+{dayApts.length - 2} more</div>}
                    </div>
                  );
                })}
              </div>
              {/* Selected day appointments */}
              {selectedDateAppointments.length > 0 && (
                <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: '0 0 12px' }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDateAppointments.map(apt => <AppointmentCard key={apt.id} apt={apt} onStatusChange={updateStatus} onReminder={sendReminder} onDelete={deleteAppointment} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({ apt, onStatusChange, onReminder, onDelete }: {
  apt: Appointment;
  onStatusChange: (id: string, status: string) => void;
  onReminder: (apt: Appointment) => void;
  onDelete: (id: string) => void;
}) {
  const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.pending;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <div style={{ textAlign: 'center', minWidth: '52px' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111' }}>{apt.scheduled_time?.slice(0, 5)}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>{apt.duration_minutes}min</div>
        </div>
        <div style={{ width: '3px', height: '40px', background: colors.border, borderRadius: '2px' }}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>{apt.customer_name}</span>
            <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '100px', padding: '2px 10px', fontSize: '11px', fontWeight: '600' }}>{apt.status}</span>
            {apt.job_type && <span style={{ background: '#f3f4f6', color: '#374151', borderRadius: '100px', padding: '2px 10px', fontSize: '11px' }}>{apt.job_type}</span>}
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
            {apt.customer_phone && <span>📞 {apt.customer_phone}</span>}
            {apt.customer_email && <span>✉️ {apt.customer_email}</span>}
            {apt.notes && <span>📝 {apt.notes}</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        {apt.status === 'pending' && (
          <button onClick={() => onStatusChange(apt.id, 'confirmed')} style={{ padding: '6px 14px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            Confirm
          </button>
        )}
        {apt.status === 'confirmed' && (
          <button onClick={() => onStatusChange(apt.id, 'completed')} style={{ padding: '6px 14px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            Complete
          </button>
        )}
        <button onClick={() => onReminder(apt)} style={{ padding: '6px 14px', background: '#fefce8', color: '#854d0e', border: '1px solid #fde047', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
          {apt.reminder_sent ? '✓ Reminded' : '📱 Remind'}
        </button>
        <button onClick={() => onDelete(apt.id)} style={{ padding: '6px 10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
          Delete
        </button>
      </div>
    </div>
  );
}
