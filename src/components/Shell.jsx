import { useState } from 'react'
import { useStore, notificationsFor, unreadCount, profileOf } from '../lib/store'
import { useI18n } from '../lib/i18n'
import { Avatar, Icon, Modal } from './ui'
import { timeAgo, cx } from '../lib/util'

export function Shell({ title, nav, active, onNav, children, actions }) {
  const { db, session, logout, markRead, resetDemo } = useStore()
  const { lang, setLang, t, languages } = useI18n()
  const user = db.users[session.userId]
  const profile = profileOf(db, session.userId)
  const unread = unreadCount(db, session.userId)
  const [showNotif, setShowNotif] = useState(false)
  const [fontSize, setFontSize] = useState('normal') // normal | lg | xl
  const notifs = notificationsFor(db, session.userId)

  const roleLabels = {
    student: t('studentRole', 'Student'),
    faculty: t('facultyRole', 'Faculty'),
    institute: t('instituteRole', 'Institute'),
    industry: t('industryRole', 'Industry')
  }

  const translateNavLabel = (key, fallback) => {
    return t(key, fallback)
  }

  return (
    <div className={`shell font-size-${fontSize}`}>
      {/* 🇮🇳 National Tricolor Top Ribbon */}
      <div className="goi-tricolor-bar" />

      {/* Official GOI Utility Top Strip */}
      <div className="goi-utility-bar">
        <div className="goi-utility-left">
          <span className="goi-flag">🇮🇳</span>
          <span className="goi-text"><b>{t('govIndia')}</b></span>
        </div>
        <div className="goi-utility-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="goi-util-btn" onClick={() => setFontSize('normal')}>A-</button>
          <button className="goi-util-btn" onClick={() => setFontSize('lg')}>A</button>
          <button className="goi-util-btn" onClick={() => setFontSize('xl')}>A+</button>
          <span className="goi-divider">|</span>

          {/* Regional Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13 }}>🌐</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="goi-lang-select"
              style={{
                background: 'rgba(255,255,255,0.95)',
                color: '#0d1b24',
                border: '1px solid #c8d3dc',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.native} ({l.name})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Indian Government Main Navigation Header */}
      <header className="topnav goi-topnav">
        <div className="topnav-left">
          <div className="brand" style={{ padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="SkillBridge" style={{ height: 42, background: '#ffffff', padding: '3px 8px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }} />
            <div className="brand-name">
              SkillBridge
              <span>{t('skillPortal')}</span>
            </div>
          </div>
        </div>

        <nav className="topnav-menu">
          {nav.map((n) => (
            <button key={n.key} className={cx('topnav-item goi-nav-item', active === n.key && 'active')} onClick={() => onNav(n.key)}>
              <Icon name={n.icon} size={16} />
              <span>{translateNavLabel(n.key, n.label)}</span>
              {n.badge > 0 && <span className="nav-dot">{n.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="topnav-right">
          <span className="badge green cloud-badge" style={{ background: '#138808', color: '#fff', border: 'none' }} title="Data is stored on Cloud and synchronized in real-time across devices">
            ☁️ {t('cloudSynced')}
          </span>

          <button className="topnav-btn" onClick={() => setShowNotif(true)} title="Notifications">
            <Icon name="bell" size={16} />
            {unread > 0 && <span className="nav-dot" style={{ position: 'absolute', top: -3, right: -3 }}>{unread}</span>}
          </button>

          <button className="topnav-btn" onClick={() => { if (confirm('Reset all demo data? This clears every change you made.')) resetDemo() }} title="Reset demo data">
            <Icon name="clock" size={16} />
          </button>

          <div className="topnav-user goi-user-card">
            <Avatar name={user?.name} src={profile.photo} size="sm" />
            <div className="u-info">
              <div className="u-name">{user?.name}</div>
              <div className="u-role">{roleLabels[user?.role] || user?.role}</div>
            </div>
          </div>

          <button className="topnav-btn logout-btn" onClick={logout} title="Sign out">
            <Icon name="logout" size={16} />
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="main-content">
        <div className="topbar goi-subtopbar">
          <h2>{title}</h2>
          <div className="topbar-right">
            {actions}
          </div>
        </div>
        <div className="page">{children}</div>
      </main>

      {/* Indian Government Portal Footer */}
      <footer className="goi-footer">
        <div className="goi-footer-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🇮🇳</span>
            <div>
              <b>SkillBridge — National Skill & Campus Placement Portal</b>
              <div className="small muted">Designed in accordance with Digital India & Ministry of Education Guidelines.</div>
            </div>
          </div>
          <div className="small muted">
            Content Managed by SkillBridge Authority · Verified AISHE & CIN Integration · ISO 27001 Compliant Cloud
          </div>
        </div>
      </footer>

      {/* Notifications Modal */}
      {showNotif && (
        <Modal title="Government Portal Notifications" onClose={() => { setShowNotif(false); markRead(session.userId) }}>
          {notifs.length === 0 && <p className="muted">No notifications yet.</p>}
          {notifs.map((n) => (
            <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon name={n.icon || 'bell'} size={16} className="muted" />
                <div>
                  <div style={{ fontSize: 13.5 }}>{n.text}</div>
                  <div className="small muted">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <span className="badge gold" style={{ marginLeft: 'auto' }}>New</span>}
              </div>
            </div>
          ))}
        </Modal>
      )}
    </div>
  )
}
