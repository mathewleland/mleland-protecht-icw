import { configureICW } from '../api/httpClient';
import { createIcon, translateLink } from './utils';
import { baseStyles, loadingStyles } from '../styles/styles';
import { ConfigureRequest, ICWResponse } from '../api/types';

interface ICWConfig {
  containerId: string;
  apiKey: string;
  currency: string;
  items: Array<{ unit_cost: string; quantity?: number }>;
  locale?: string;
  onProtectionToggle?: (isChecked: boolean) => void;
  lazy?: boolean; // Add lazy loading option
}

export class ICWWidget extends HTMLElement {
  protected shadow: ShadowRoot;
  private config!: ICWConfig;
  private data?: ICWResponse;
  private isLoading = false;
  private retryCount = 0;
  private maxRetries = 3;
  private observer?: IntersectionObserver;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this.config?.lazy) {
      this.setupLazyLoading();
    } else {
      this.loadWidget();
    }
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  private setupLazyLoading() {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadWidget();
        this.observer?.disconnect();
      }
    }, { threshold: 0.1 });
    
    this.observer.observe(this);
  }

  private loadWidget() {
    if (this.isLoading) return;
    this.renderLoading();
    this.fetchAndRender().catch((err) => this.handleError(err));
  }

  public initialize(config: ICWConfig) {
    this.config = {
      locale: config.locale || 'en_US',
      lazy: config.lazy || false,
      onProtectionToggle: config.onProtectionToggle || (() => { }),
      ...config,
    };
  }

  private renderLoading() {
    this.shadow.innerHTML = `${loadingStyles}<div class="loading">Loading protection options...</div>`;
  }

  private handleError(err: Error) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => this.fetchAndRender().catch(() => this.renderError(err)), 1000 * this.retryCount);
    } else {
      this.renderError(err);
    }
  }

  private renderError(err: Error) {
    this.shadow.innerHTML = `${loadingStyles}<div class="loading">Unable to load protection options</div>`;
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching data:', err);
    }
  }

  private async fetchAndRender() {
    if (this.isLoading) return;
    this.isLoading = true;
    
    try {
      const { apiKey, currency, items, locale } = this.config;
      const payload: ConfigureRequest = { currency, items, locale: locale! };
      const resp = await configureICW(apiKey, payload);
      this.data = resp;
      this.renderWidget();
    } finally {
      this.isLoading = false;
    }
  }

  private renderWidget() {
    if (!this.data) {
      this.renderError(new Error('No data received from API'));
      return;
    }
    
    const { quote_literal, perils, links, underwriter } = this.data;

    // Use template literals more efficiently
    const perilsHTML = perils.length > 0 
      ? `<strong>Perils:</strong><div class="perils-icons">${perils
          .map(p => `<div class="peril-item">${createIcon(p.icon, p.name)}</div>`)
          .join('')}</div>`
      : `<em>No perils available</em>`;

    const linksHTML = `<strong>${createIcon('Link')}</strong><div class="links-list">${links
      .map(l => `<div class="link-item"><a href="${l.url}" target="_blank" rel="noopener noreferrer">${translateLink[l.type] || l.type}</a></div>`)
      .join('')}</div>`;

    const underwriterHTML = `<strong>Underwriter </strong><div class="underwriter-name">${underwriter.name} (${underwriter.legal_name})</div>`;

    this.shadow.innerHTML = `
      ${baseStyles}
      <h2>Total: ${quote_literal}</h2>
      <div class="protection-toggle">
        <label for="protection-checkbox" id="protection-label">Protect my purchase</label>
        <input type="checkbox" id="protection-checkbox" />
      </div>
      <div class="section">${perilsHTML}</div>
      <div class="section">${linksHTML}</div>
      <div class="section">${underwriterHTML}</div>
    `;

    // Set up checkbox behavior
    const checkbox = this.shadow.querySelector('#protection-checkbox') as HTMLInputElement;
    if (checkbox && this.config.onProtectionToggle) {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.config.onProtectionToggle!(target.checked);
      });
    }
  }
}

// Use a WeakMap to prevent memory leaks
const widgetInstances = new WeakMap<HTMLElement, ICWWidget>();

if (!customElements.get('protecht-icw')) {
  customElements.define('protecht-icw', ICWWidget);
}

export function createICWWidget(config: ICWConfig) {
  const container = document.getElementById(config.containerId);
  if (!container) {
    throw new Error(`Container "${config.containerId}" not found.`);
  }

  let widgetElement = container.querySelector('protecht-icw') as ICWWidget;
  if (!widgetElement) {
    widgetElement = document.createElement('protecht-icw') as ICWWidget;
    widgetElement.setAttribute('data-container', config.containerId);
    widgetElement.initialize(config);
    container.appendChild(widgetElement);
    widgetInstances.set(container, widgetElement);
  } else {
    widgetElement.initialize(config);
  }
  
  return widgetElement;
}