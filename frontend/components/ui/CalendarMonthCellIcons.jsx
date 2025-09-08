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
      
      // Calculate popup dimensions
      const popupHeight = 120 + Math.ceil(events.length / 2) * 36;
      const popupWidth = Math.max(200, events.length * 30);
      
      // Mobile-friendly positioning
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // On mobile, center the popup and ensure it fits on screen
        left = Math.max(10, Math.min(window.innerWidth - popupWidth - 10, left - popupWidth / 2));
        top = Math.max(10, Math.min(window.innerHeight - popupHeight - 10, rect.top - popupHeight + scrollY));
      } else {
        // Desktop positioning
        if (top + popupHeight > window.innerHeight + scrollY) {
          top = rect.top - popupHeight + scrollY;
        }
        left = left - popupWidth / 2;
      }
      
      setPopupPos({ top, left });
    }
  }, [showAll, events.length]);

  // Add backdrop click handler to close popup
  useEffect(() => {
    const handleBackdropClick = (e) => {
      if (showAll && !e.target.closest('[data-popup-content]')) {
        setShowAll(false);
      }
    };

    if (showAll) {
      document.addEventListener('mousedown', handleBackdropClick);
      document.addEventListener('touchstart', handleBackdropClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleBackdropClick);
      document.removeEventListener('touchstart', handleBackdropClick);
    };
  }, [showAll]);

  // Add touch handling for better mobile support
  const handleTouchClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAll(true);
  };

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
    <div style={{ 
      position: 'relative', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      touchAction: 'manipulation',
      pointerEvents: 'auto'
    }}>
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
              <div
          ref={iconRef}
          style={{
            fontSize: window.innerWidth < 768 ? 14 : 12,
            color: '#1976d2',
            marginTop: 1,
            fontWeight: 600,
            display: 'block',
            cursor: 'pointer',
            textDecoration: 'none', // Remove underline
            padding: window.innerWidth < 768 ? '6px 8px' : '2px 4px',
            borderRadius: '4px',
            transition: 'background-color 0.2s, transform 0.1s',
            userSelect: 'none',
            touchAction: 'manipulation',
            minHeight: window.innerWidth < 768 ? '32px' : '20px',
            minWidth: window.innerWidth < 768 ? '60px' : '40px',
            textAlign: 'center',
            lineHeight: window.innerWidth < 768 ? '20px' : '16px',
            position: 'relative',
            zIndex: 10,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            KhtmlUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f8ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.currentTarget.style.transform = 'scale(0.95)';
            e.currentTarget.style.backgroundColor = '#e3f2fd';
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'transparent';
            handleTouchClick(e);
          }}
          onTouchMove={(e) => {
            // Don't prevent default to allow scrolling
          }}
        onClick={e => {
          e.stopPropagation();
          setShowAll(true);
        }}
      >
        +{events.length - 1} more
      </div>
      {showAll && createPortal(
        <div
          data-popup-content
          style={{
            position: 'absolute',
            zIndex: 2000,
            left: popupPos.left,
            top: popupPos.top,
            transform: window.innerWidth < 768 ? 'translate(0, 0)' : 'translate(-50%, 0)',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: window.innerWidth < 768 ? 12 : 10,
            boxShadow: window.innerWidth < 768 ? '0 4px 20px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.12)',
            padding: window.innerWidth < 768 ? 20 : 16,
            minWidth: window.innerWidth < 768 ? 280 : 180,
            maxWidth: window.innerWidth < 768 ? window.innerWidth - 20 : 'none',
            minHeight: 60,
            textAlign: 'center',
            touchAction: 'manipulation',
          }}
        >
          <div style={{ 
            fontWeight: 600, 
            marginBottom: window.innerWidth < 768 ? 15 : 10, 
            fontSize: window.innerWidth < 768 ? 16 : 14,
            color: '#374151'
          }}>
            {formatDate(date)}
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: window.innerWidth < 768 ? 10 : 6 
          }}>
            {chunk(events, window.innerWidth < 768 ? 3 : 2).map((row, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: window.innerWidth < 768 ? 12 : 8,
                flexWrap: 'wrap'
              }}>
                {row.map((ev, idx) => (
                  <span
                    key={ev.id || idx}
                    className="calendar-event-icon"
                    title={ev.title || ev.meeting_title}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: window.innerWidth < 768 ? 28 : 22,
                      height: window.innerWidth < 768 ? 28 : 22,
                      borderRadius: '50%',
                      backgroundColor: ev.color,
                      color: '#fff',
                      cursor: 'pointer',
                      marginBottom: 2,
                      transition: 'transform 0.1s',
                      touchAction: 'manipulation',
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.9)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onClick={onEventClick ? (e) => onEventClick(ev, e) : undefined}
                  >
                    <FaCalendarAlt style={{ 
                      color: '#fff', 
                      fontSize: window.innerWidth < 768 ? 14 : 12 
                    }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
          <button
            style={{ 
              marginTop: window.innerWidth < 768 ? 16 : 12, 
              fontSize: window.innerWidth < 768 ? 14 : 12, 
              color: '#1976d2', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: window.innerWidth < 768 ? '8px 16px' : '4px 8px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              touchAction: 'manipulation',
              minHeight: window.innerWidth < 768 ? '44px' : 'auto',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f8ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.backgroundColor = '#e3f2fd';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
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