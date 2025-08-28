import React, { useState, useRef, useEffect } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { createPortal } from 'react-dom';

export default function CalendarMonthCellIcons({ date, events, onEventClick }) {
  const [showAll, setShowAll] = useState(false);
  const iconRef = useRef(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  // Helper: format date as 'Wednesday, July 30'
  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
  // Helper: chunk events into rows of 2
  function chunk(arr, size) {
    const res = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  }

  // Only one icon and one '+N more' for 3+ events
  useEffect(() => {
    if (showAll && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      let top = rect.bottom + 8 + scrollY;
      let left = rect.left + rect.width / 2 + scrollX;
      // If not enough space below, show above
      const popupHeight = 120 + Math.ceil(events.length / 2) * 36;
      if (top + popupHeight > window.innerHeight + scrollY) {
        top = rect.top - popupHeight + scrollY;
      }
      setPopupPos({ top, left });
    }
  }, [showAll, events.length]);

  if (!events || events.length === 0) return null;
  if (events.length === 1) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <span
          className="calendar-event-icon"
          title={events[0].title || events[0].meeting_title}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: '50%',
            backgroundColor: events[0].color,
            color: '#fff',
            cursor: onEventClick ? 'pointer' : undefined
          }}
          onClick={onEventClick ? (e) => onEventClick(events[0], e) : undefined}
        >
          <FaCalendarAlt style={{ color: '#fff', fontSize: 12 }} />
        </span>
      </div>
    );
  }
  if (events.length === 2) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 6 }}>
        {events.map((ev, idx) => (
          <span
            key={ev.id || idx}
            className="calendar-event-icon"
            title={ev.title || ev.meeting_title}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: ev.color,
              color: '#fff',
              cursor: onEventClick ? 'pointer' : undefined
            }}
            onClick={onEventClick ? (e) => onEventClick(ev, e) : undefined}
          >
            <FaCalendarAlt style={{ color: '#fff', fontSize: 12 }} />
          </span>
        ))}
      </div>
    );
  }
  // 3 or more events: show first icon, then '+N more' below
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span
        className="calendar-event-icon"
        title={events[0].title || events[0].meeting_title}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          backgroundColor: events[0].color,
          color: '#fff',
          cursor: onEventClick ? 'pointer' : undefined
        }}
        onClick={onEventClick ? (e) => onEventClick(events[0], e) : undefined}
      >
        <FaCalendarAlt style={{ color: '#fff', fontSize: 12 }} />
      </span>
              <span
          style={{
            fontSize: 12,
            color: '#1976d2',
            marginTop: 1,
            fontWeight: 600,
            display: 'block',
            cursor: 'pointer',
            textDecoration: 'none', // Remove underline
          }}
        onClick={e => {
          e.stopPropagation();
          // Calculate popup position based on the clicked element, display above
          const rect = e.currentTarget.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;
          const popupHeight = 120 + Math.ceil(events.length / 2) * 36;
          let top = rect.top - popupHeight + scrollY;
          let left = rect.left + rect.width / 2 + scrollX;
          setPopupPos({ top, left });
          setShowAll(true);
        }}
      >
        +{events.length - 1} more
      </span>
      {showAll && createPortal(
        <div
          style={{
            position: 'absolute',
            zIndex: 2000,
            left: popupPos.left,
            top: popupPos.top,
            transform: 'translate(-50%, 0)',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            padding: 16,
            minWidth: 180,
            minHeight: 60,
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>{formatDate(date)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {chunk(events, 2).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {row.map((ev, idx) => (
                  <span
                    key={ev.id || idx}
                    className="calendar-event-icon"
                    title={ev.title || ev.meeting_title}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: ev.color,
                      color: '#fff',
                      cursor: 'pointer', // Always pointer for clickable icons
                      marginBottom: 2,
                    }}
                    onClick={onEventClick ? (e) => onEventClick(ev, e) : undefined}
                  >
                    <FaCalendarAlt style={{ color: '#fff', fontSize: 12 }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
          <button
            style={{ marginTop: 12, fontSize: 12, color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); setShowAll(false); }}
          >
            Close
          </button>
        </div>,
        document.body
      )}
    </div>
  );
} 