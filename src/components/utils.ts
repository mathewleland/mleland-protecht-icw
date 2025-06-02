export function createMaterialIcon(iconName: string, tooltip?: string) {
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

export const translateLink: Record<string, string> = {
    "faq": "FAQ",
    "help_center": "Help Center",
    "RefundTerms": "Refund Terms",
}