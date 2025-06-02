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

    connectedCallback() {
        this.renderLoading();
        this.fetchAndRender().catch((err) => this.renderError(err));
    }

    // Populate configuration
    public initialize(config: ICWConfig) {
        this.config = {
            locale: config.locale || 'en_US',
            onProtectionToggle: config.onProtectionToggle || (() => { }),
            ...config,
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
        if (!this.data) {
            this.renderError(new Error('No data received from API'));
            return;
        }
        const { quote_literal, perils, links, underwriter } = this.data;

        this.shadow.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        
        :host {
          display: block;
          font-family: Arial, sans-serif;
          border: 1px dotted #e0e0e0;
          border-radius: 8px;
          padding: 10px;
          max-width: 320px;
          box-sizing: border-box;
          height: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        h2 { margin: 0 0 12px; font-size: 1.25rem; }
        .quote { font-size: 1.5rem; font-weight: bold; margin-bottom: 12px; }
        .section { margin-bottom: 5px; }
        .peril-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .material-icons {
          margin-right: 8px;
          color: #666;
          font-size: 20px;
          cursor: help;
        }
        .material-icons:hover {
          color: red
        }
        .protection-toggle {
          display: flex;
          justify-content: space-around;
          margin-top: 16px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }
        .protection-toggle input[type="checkbox"] {
          margin-right: 8px;
          transform: scale(1.5);
          flex-grow: 1;
        }
        .protection-toggle label {
          font-weight: 500;
          cursor: pointer;
          user-select: none;
          flex-grow: 1;
        }
          #perils, #links {
          display: flex;
          align-items: center;
          gap: 8px;
          }

          #links {
          font-size: 11px;
          }
          .links-list {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-around;
          }

        //   .link-item {
        //     border: 1px solid blue;
        //   }

        .perils-icons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .peril-item {
          display: flex;
          align-items: center;
        }
        #underwriter {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 14px;
        }
          .underwriter-name {
          font-size: 12px;
          color: #666;
          }
      </style>
      <h2>Total: ${quote_literal}</h2>
      <div class="protection-toggle">
      <label for="protection-checkbox" id="protection-label">Protecht my purchase</label>
        <input type="checkbox" id="protection-checkbox" />
      </div>
      <div class="section" id="perils"></div>
      <div class="section" id="links"></div>
      <div class="section" id="underwriter"></div>
    `;

        // Render perils if any
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

        // Render links
        const linksContainer = this.shadow.querySelector('#links')!;
        linksContainer.innerHTML = `<strong>${createMaterialIcon('Link')}</strong><div class="links-list">${links
            .map((l) => `<div class="link-item"><a href="${l.url}" target="_blank">${translateLink[l.type] || l.type}</a></div>`)
            .join('')}</div>`;

        // Render underwriter
        const underwriterContainer = this.shadow.querySelector('#underwriter')!;
        underwriterContainer.innerHTML = `
      <strong>Underwriter </strong>
      <div class="underwriter-name">${underwriter.name} (${underwriter.legal_name})</div>
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

function createMaterialIcon(iconName: string, tooltip?: string) {
    const icon = iconMap[iconName as keyof typeof iconMap];
    console.log('iconName', iconName, icon);
    const titleAttr = tooltip ? ` title="${tooltip}"` : '';
    const ariaLabelAttr = tooltip ? ` aria-label="${tooltip}"` : '';
    return `<span class="material-icons"${titleAttr}${ariaLabelAttr}>${icon || 'help_outline'}</span>`;
}

const iconMap: Record<string, string> = {
    "AirplanemodeInactive": 'airplanemode_inactive',
    'CarCrash': 'car_crash',
    'Thunderstorm': 'thunderstorm',
    'Healing': 'healing',
    'Coronavirus': 'coronavirus',
    "Gavel": "gavel",
    "Link": "link"
}

const translateLink: Record<string, string> = {
    "faq": "FAQ",
    "help_center": "Help Center",
    "RefundTerms": "Refund Terms",
}