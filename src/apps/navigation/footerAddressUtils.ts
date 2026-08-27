import { NavigationItem } from './types';

export function isFooterAddressItem(item: NavigationItem): boolean {
  return item.settings?.footerItemType === 'address';
}

export function createFooterAddressItem(
  menuId: string | number,
  sortOrder: number,
  title = 'بلوک فوتر جدید'
): NavigationItem {
  return {
    id: `footer_block_${Date.now()}`,
    menuId: String(menuId),
    parentId: null,
    title,
    itemType: 'custom',
    targetUrl: '#',
    target: '_self',
    displayType: 'simple',
    sortOrder,
    status: 'active',
    settings: {
      accessRules: ['Public User'],
      footerItemType: 'address',
      description: '',
      address: '',
      phone: '',
      fax: '',
      mapButton: {
        text: 'نمایش روی نقشه',
        icon: 'MapPin',
        action: 'show_map',
        url: '/campus-map',
      },
      socialLinks: [],
    },
  };
}

export interface FooterAddressDetailRow {
  id: string;
  icon: 'MapPin' | 'Phone' | 'Printer' | 'ExternalLink';
  label: string;
  value: string;
  href?: string;
  isLink?: boolean;
}

export function getFooterAddressDetailRows(item: NavigationItem): FooterAddressDetailRow[] {
  const settings = item.settings;
  const rows: FooterAddressDetailRow[] = [];

  if (settings.description) {
    rows.push({
      id: `${item.id}_description`,
      icon: 'ExternalLink',
      label: 'توضیح',
      value: settings.description,
    });
  }

  if (settings.address) {
    rows.push({
      id: `${item.id}_address`,
      icon: 'MapPin',
      label: 'آدرس',
      value: settings.address,
    });
  }

  if (settings.phone) {
    rows.push({
      id: `${item.id}_phone`,
      icon: 'Phone',
      label: 'تلفن',
      value: settings.phone,
      href: `tel:${settings.phone.replace(/[^\d+]/g, '')}`,
    });
  }

  if (settings.fax) {
    rows.push({
      id: `${item.id}_fax`,
      icon: 'Printer',
      label: 'فکس',
      value: settings.fax,
    });
  }

  const mapButton = settings.mapButton;
  if (mapButton?.text) {
    rows.push({
      id: `${item.id}_map`,
      icon: 'MapPin',
      label: 'دکمه',
      value: mapButton.text,
      href: mapButton.url || '#',
      isLink: true,
    });
  }

  if (settings.buttonText && settings.buttonUrl) {
    rows.push({
      id: `${item.id}_button`,
      icon: 'ExternalLink',
      label: 'دکمه',
      value: settings.buttonText,
      href: settings.buttonUrl,
      isLink: true,
    });
  }

  return rows;
}
