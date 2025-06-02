import { configureICW } from '../api/httpClient';
import { createMaterialIcon, translateLink } from './utils';
import { baseStyles, loadingStyles } from '../styles/styles';
import { ConfigureRequest, ICWResponse } from '../api/types';

interface ICWConfig {
  containerId: string;
  apiKey: string;
  currency: string;
  items: Array<{ unit_cost: string; quantity?: number }>;
  locale?: string;
  onProtectionToggle?: (isChecked: boolean) => void; // custom callback for toggle
}

class ICWWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private config!: ICWConfig;
  private data?: ICWResponse;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { // fires when the element is added to the DOM
    this.renderLoading();
    this.fetchAndRender().catch((err) => this.renderError(err));
  }

  public initialize(config: ICWConfig) {
    this.config = {
      locale: config.locale || 'en_US',
      onProtectionToggle: config.onProtectionToggle || (() => { }),
      ...config,
    };
    console.log('config', this.config);
  }

  private renderLoading() {
    this.shadow.innerHTML = `${loadingStyles}<div class="loading">Fetching Protecht-ions...</div>`;
  }

  private renderError(err: Error) {
    this.shadow.innerHTML = `${loadingStyles}<div class="loading"">Error: ${err.message}</div>`; // could also do empty div here to fail invisibly
    console.error('Error fetching data:', err);
  }

  private async fetchAndRender() {
    const { apiKey, currency, items, locale } = this.config;
    const payload: ConfigureRequest = { currency, items, locale: locale! };
    const resp = await configureICW(apiKey, payload);
    this.data = resp;
    this.renderWidget();
  }

  private renderWidget() {
    if (!this.data) {
      this.renderError(new Error('No data received from API'));
      return;
    }
    const { quote_literal, perils, links, underwriter } = this.data;

    this.shadow.innerHTML = `
      ${baseStyles}
      <h2>Total: ${quote_literal}</h2>
      <div class="protection-toggle">
      <label for="protection-checkbox" id="protection-label">Protecht my purchase</label>
        <input type="checkbox" id="protection-checkbox" />
      </div>
      <div class="section" id="perils"></div>
      <div class="section" id="links"></div>
      <div class="section" id="underwriter"></div>
    `;

    // RENDER PERILS
    const perilsContainer = this.shadow.querySelector('#perils')!;
    if (perils.length > 0) {
      perilsContainer.innerHTML = `<strong>Perils:</strong><div class="perils-icons">${perils
        .map((p) => {
          const icon = p.icon
          return `<div class="peril-item">${createMaterialIcon(icon, p.name)}</div>`;
        })
        .join('')}</div>`;
    } else {
      perilsContainer.innerHTML = `<em>No perils available</em>`;
    }

    // RENDER LINKS
    const linksContainer = this.shadow.querySelector('#links')!;
    linksContainer.innerHTML = `<strong>${createMaterialIcon('Link')}</strong><div class="links-list">${links
      .map((l) => `<div class="link-item"><a href="${l.url}" target="_blank">${translateLink[l.type] || l.type}</a></div>`)
      .join('')}</div>`;

    // RENDER UNDERWRITER
    const underwriterContainer = this.shadow.querySelector('#underwriter')!;
    underwriterContainer.innerHTML = `
      <strong>Underwriter </strong>
      <div class="underwriter-name">${underwriter.name} (${underwriter.legal_name})</div>
    `;

    // checkbox behavior
    const checkbox = this.shadow.querySelector('#protection-checkbox') as HTMLInputElement;
    if (checkbox && this.config.onProtectionToggle) {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.config.onProtectionToggle!(target.checked);
      });
    }
  }
}

if (!customElements.get('protecht-icw')) {
  customElements.define('protecht-icw', ICWWidget);
}

export function createICWWidget(config: ICWConfig) {
  const container = document.getElementById(config.containerId);
  if (!container) {
    throw new Error(`Container "${config.containerId}" not found.`);
  }

  let widgetElement = document.querySelector(`protecht-icw[data-container="${config.containerId}"]`) as ICWWidget;
  if (!widgetElement) {
    widgetElement = document.createElement('protecht-icw') as ICWWidget;
    widgetElement.setAttribute('data-container', config.containerId);
    widgetElement.initialize(config); // init BEFORE appending
    container.appendChild(widgetElement);
  } else {
    widgetElement.initialize(config); // Re-init if reusing
  }
}