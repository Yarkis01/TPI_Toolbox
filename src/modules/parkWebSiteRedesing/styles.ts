/**
 * CSS styles for the Park Website Redesign module.
 * Includes Light and Dark theme support with CSS variables.
 */
export const STYLES = `
/* Theme Variables */
:root {
    --park-bg-primary: #0a0e1a;
    --park-bg-secondary: #141927;
    --park-bg-card: rgba(20, 25, 39, 0.8);
    --park-bg-card-hover: rgba(30, 35, 49, 0.9);
    --park-text-primary: #e8eaf0;
    --park-text-secondary: #a8afc7;
    --park-text-muted: #6b7280;
    --park-accent-primary: #3b82f6;
    --park-accent-secondary: #8b5cf6;
    --park-border-color: rgba(255, 255, 255, 0.1);
    --park-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    --park-status-open: #10b981;
    --park-status-closed: #ef4444;
    --park-overlay: rgba(0, 0, 0, 0.5);
}

[data-theme="light"] {
    --park-bg-primary: #f3f4f6;
    --park-bg-secondary: #ffffff;
    --park-bg-card: #ffffff;
    --park-bg-card-hover: #f9fafb;
    --park-text-primary: #111827;
    --park-text-secondary: #4b5563;
    --park-text-muted: #9ca3af;
    --park-accent-primary: #2563eb;
    --park-accent-secondary: #7c3aed;
    --park-border-color: #e5e7eb;
    --park-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --park-status-open: #059669;
    --park-status-closed: #dc2626;
    --park-overlay: rgba(0, 0, 0, 0.3);
}

/* Global Styles */
.park-website {
    background-color: var(--park-bg-primary);
    color: var(--park-text-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* Hero Section */
.park-hero {
    position: relative;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 0 24px 24px;
    overflow: hidden;
    margin-bottom: 3rem;
}

.park-hero__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        135deg,
        var(--park-overlay) 0%,
        var(--park-accent-primary) 100%
    );
    opacity: 0.8;
    backdrop-filter: blur(4px);
}

.park-hero__content {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 2rem;
}

.park-hero__title {
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: #ffffff;
    text-shadow: 2px 4px 8px rgba(0, 0, 0, 0.3);
    letter-spacing: -0.02em;
}

.park-hero__since,
.park-hero__location {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.park-status {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.park-status--open {
    background-color: var(--park-status-open);
    color: #ffffff;
}

.park-status--closed {
    background-color: var(--park-status-closed);
    color: #ffffff;
}

/* Sections */
.park-section__title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: var(--park-text-primary);
    text-align: center;
    letter-spacing: -0.01em;
}

.container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
}

/* Attractions Section */
.park-attractions {
    background-color: var(--park-bg-secondary);
    padding: 3rem 0;
    transition: background-color 0.3s ease;
}

.park-attractions__slider-wrapper {
    position: relative;
}

.park-attractions__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    transition: transform 0.3s ease;
}

.park-attraction-card {
    background: var(--park-bg-card);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--park-border-color);
    box-shadow: var(--park-shadow);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

[data-theme="dark"] .park-attraction-card {
    background: rgba(20, 25, 39, 0.6);
    backdrop-filter: blur(16px);
}

.park-attraction-card:hover {
    transform: translateY(-4px);
    background: var(--park-bg-card-hover);
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
    border-color: var(--park-accent-primary);
}

.park-attraction-card__image {
    height: 200px;
    overflow: hidden;
    position: relative;
}

.park-attraction-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.park-attraction-card:hover .park-attraction-card__image img {
    transform: scale(1.05);
}

.park-attraction-card__content {
    padding: 1.25rem;
}

.park-attraction-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.park-attraction-card__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--park-text-primary);
    margin: 0;
    flex: 1;
}

.park-attraction-card__status {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.park-attraction-card__status--open {
    background-color: var(--park-status-open);
    color: #ffffff;
}

.park-attraction-card__status--closed {
    background-color: var(--park-status-closed);
    color: #ffffff;
}

.park-attraction-card__badges {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.park-attraction-card__badge {
    padding: 0.375rem 0.875rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    background: linear-gradient(135deg, var(--park-accent-primary), var(--park-accent-secondary));
    color: #ffffff;
}

.park-attraction-card__details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.park-attraction-card__detail {
    font-size: 0.875rem;
    color: var(--park-text-primary);
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
}

[data-theme="light"] .park-attraction-card__detail {
    background: rgba(37, 99, 235, 0.08);
    border-color: rgba(37, 99, 235, 0.15);
    color: var(--park-text-primary);
}

/* Restaurants Section */
.park-restaurants {
    background-color: var(--park-bg-primary);
    padding: 3rem 0;
}

.park-restaurants__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.park-restaurant-card {
    background: var(--park-bg-card);
    border-radius: 12px;
    border: 1px solid var(--park-border-color);
    box-shadow: var(--park-shadow);
    transition: all 0.3s ease;
}

[data-theme="dark"] .park-restaurant-card {
    background: rgba(20, 25, 39, 0.6);
    backdrop-filter: blur(16px);
}

.park-restaurant-card:hover {
    transform: translateY(-2px);
    background: var(--park-bg-card-hover);
    border-color: var(--park-accent-primary);
}

.park-restaurant-card__content {
    padding: 1.25rem;
}

.park-restaurant-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
}

.park-restaurant-card__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--park-text-primary);
    margin: 0;
}

.park-restaurant-card__status {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.park-restaurant-card__status--open {
    background-color: var(--park-status-open);
    color: #ffffff;
}

.park-restaurant-card__status--closed {
    background-color: var(--park-status-closed);
    color: #ffffff;
}

.park-restaurant-card__type {
    font-size: 0.875rem;
    color: var(--park-text-muted);
    margin-bottom: 0.75rem;
}

.park-restaurant-card__details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.park-restaurant-card__detail {
    font-size: 0.875rem;
    color: var(--park-text-primary);
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-weight: 500;
}

[data-theme="light"] .park-restaurant-card__detail {
    background: rgba(37, 99, 235, 0.08);
    border-color: rgba(37, 99, 235, 0.15);
    color: var(--park-text-primary);
}

/* Stats Section */
.park-stats-section {
    position: relative;
    padding: 4rem 0;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}

.park-stats-section__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        135deg,
        var(--park-overlay) 0%,
        var(--park-accent-secondary) 100%
    );
    opacity: 0.9;
}

.park-stats-section > .container {
    position: relative;
    z-index: 1;
}

.park-stats-section__title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: #ffffff;
    text-align: center;
}

.park-stats-section__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.park-stats-section__card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
}

.park-stats-section__card:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.park-stats-section__card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.park-stats-section__card-value {
    font-size: 2rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
}

.park-stats-section__chart {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.park-stats-section__chart-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 1rem;
}

.park-stats-section__chart-toggle {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.park-stats-section__chart-btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.park-stats-section__chart-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.park-stats-section__chart-btn--active {
    background: var(--park-accent-primary);
    border-color: var(--park-accent-primary);
}

/* Footer */
.park-footer {
    background-color: var(--park-bg-secondary);
    padding: 2rem 0;
    text-align: center;
    border-top: 1px solid var(--park-border-color);
}

.park-footer__text {
    color: var(--park-text-muted);
    font-size: 0.875rem;
    margin: 0.25rem 0;
}

/* Arrows - Hidden since all attractions are displayed */
.park-attractions__arrow {
    display: none !important;
}

/* Show More Button */
.park-restaurants__show-more-btn {
    margin-top: 1.5rem;
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, var(--park-accent-primary), var(--park-accent-secondary));
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.park-restaurants__show-more-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

/* Theme Toggle Button */
#tpi-theme-toggle {
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--park-accent-primary), var(--park-accent-secondary));
    color: #ffffff;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

#tpi-theme-toggle:hover {
    transform: scale(1.1) rotate(15deg);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5);
}

#tpi-theme-toggle:active {
    transform: scale(0.95);
}
`;
