import { configureICW } from '../api/httpClient';
import { ConfigureRequest, ICWResponse } from '../api/types';

interface ICWConfig {
    containerId: string;
    apiKey: string;
    currency: string;
    items: Array<{ unit_cost: string; quantity?: number }>;
    locale?: string;
    onProtectionToggle?: (isChecked: boolean) => void;
}

class ICWWidget extends HTMLElement {
    private shadow: ShadowRoot;
    private config!: ICWConfig;
    private data?: ICWResponse;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    // Called when element is added to DOM
    connectedCallback() {
        // Expect that `this.config` was set before appending
        this.renderLoading();
        this.fetchAndRender().catch((err) => this.renderError(err));
    }

    // Populate configuration
    public initialize(config: ICWConfig) {
        this.config = {
            ...config,
            apiKey: config.apiKey || 'pk_sandbox_fea992c0c535b522f2f5d8fae68725ac0c480da6',
            locale: config.locale || 'en_US',
            onProtectionToggle: config.onProtectionToggle || (() => { })
        };

        console.log('config', this.config);
    }

    private renderLoading() {
        this.shadow.innerHTML = `<div>Loading insurance quote…</div>`;
    }

    private renderError(err: Error) {
        this.shadow.innerHTML = `<div style="color: red;">Error: ${err.message}</div>`;
    }

    private async fetchAndRender() {
        const { apiKey, currency, items, locale } = this.config;
        const payload: ConfigureRequest = { currency, items, locale: locale! };
        const resp = await configureICW(apiKey, payload);
        this.data = resp;
        this.renderWidget();
    }

    private renderWidget() {
        if (!this.data) return;
        const { quote_literal, perils, links, underwriter } = this.data;

        // Base HTML + minimal styling (could move CSS to external file and import as string)
        this.shadow.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        
        :host {
          display: block;
          font-family: Arial, sans-serif;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          max-width: 350px;
          box-sizing: border-box;
        }
        h2 { margin: 0 0 12px; font-size: 1.25rem; }
        .quote { font-size: 1.5rem; font-weight: bold; margin-bottom: 12px; }
        .section { margin-bottom: 12px; }
        .peril-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .material-icons {
          margin-right: 8px;
          color: #666;
          font-size: 20px;
        }
        .protection-toggle {
          display: flex;
          align-items: center;
          margin-top: 16px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }
        .protection-toggle input[type="checkbox"] {
          margin-right: 8px;
          transform: scale(1.2);
        }
        .protection-toggle label {
          font-weight: 500;
          cursor: pointer;
          user-select: none;
        }
      </style>
      <h2>Quote Total</h2>
      <div class="quote">${quote_literal}</div>
      <div class="section" id="perils"></div>
      <div class="section" id="links"></div>
      <div class="section" id="underwriter"></div>
      <div class="protection-toggle">
        <input type="checkbox" id="protection-checkbox" />
        <label for="protection-checkbox">Protecht my purchase</label>
      </div>
    `;

        // Render perils if any
        const perilsContainer = this.shadow.querySelector('#perils')!;
        if (perils.length > 0) {
            perilsContainer.innerHTML = `<strong>Perils:</strong><ul>${perils
                .map((p) => {
                    return `<div class="peril-item">
                        <li> ${p.description} </li>
                    </div>`;
                })
                .join('')}</ul>`;
        } else {
            perilsContainer.innerHTML = `<em>No perils available</em>`;
        }

        // Render links
        const linksContainer = this.shadow.querySelector('#links')!;
        linksContainer.innerHTML = `<strong>Links:</strong><ul>${links
            .map((l) => `<li><a href="${l.url}" target="_blank">${l.type}</a></li>`)
            .join('')}</ul>`;

        // Render underwriter
        const underwriterContainer = this.shadow.querySelector('#underwriter')!;
        underwriterContainer.innerHTML = `
      <strong>Underwriter: </strong>
      <div>${underwriter.name} (${underwriter.legal_name})</div>
    `;

        // Add event listener for the protection checkbox
        const checkbox = this.shadow.querySelector('#protection-checkbox') as HTMLInputElement;
        if (checkbox && this.config.onProtectionToggle) {
            checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.config.onProtectionToggle!(target.checked);
            });
        }
    }
}

// Register the custom element if not already defined
if (!customElements.get('protecht-icw')) {
    customElements.define('protecht-icw', ICWWidget);
}

// Exported function for consumers
export function createICWWidget(config: ICWConfig) {
    const container = document.getElementById(config.containerId);
    if (!container) {
        throw new Error(`Container "${config.containerId}" not found.`);
    }

    // Create or reuse the custom element
    let widgetElement = document.querySelector(`protecht-icw[data-container="${config.containerId}"]`) as ICWWidget;
    if (!widgetElement) {
        widgetElement = document.createElement('protecht-icw') as ICWWidget;
        widgetElement.setAttribute('data-container', config.containerId);
        widgetElement.initialize(config); // Initialize BEFORE appending
        container.appendChild(widgetElement);
    } else {
        widgetElement.initialize(config); // Re-initialize if reusing
    }
}



function createMaterialIcon(iconName: string) {
    const el = document.createElement('span');
    el.className = 'material-icons';
    el.textContent = iconName || 'help_outline';
    return el;
}

