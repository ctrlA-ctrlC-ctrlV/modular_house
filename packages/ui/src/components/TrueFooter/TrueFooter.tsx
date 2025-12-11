import React from 'react';
import './TrueFooter.css';

export interface TrueFooterProps {
  copyrightText?: string;
  siteByText?: string;
  siteByLinkText?: string;
  siteByLinkUrl?: string;
  className?: string;
}

export const TrueFooter: React.FC<TrueFooterProps> = ({
  copyrightText = '© 2025. All Rights Reserved.',
  siteByText = 'Site by',
  siteByLinkText = 'ThemeRex.',
  siteByLinkUrl = 'https://themerex.net/',
  className = '',
}) => {
  return (
    <div className={`elementor-element elementor-element-4e9d1fc e-con-full e-flex sc_layouts_column_icons_position_left e-con e-child ${className}`} data-id="4e9d1fc" data-element_type="container">
      <div className="elementor-element elementor-element-d5b80fe e-con-full e-flex sc_layouts_column_icons_position_left e-con e-child" data-id="d5b80fe" data-element_type="container">
        <div className="sc_layouts_item elementor-element elementor-element-42631fb sc_fly_static elementor-widget elementor-widget-text-editor" data-id="42631fb" data-element_type="widget" data-widget_type="text-editor.default">
          <div className="elementor-widget-container">
            <p>{copyrightText}</p>
          </div>
        </div>
      </div>
      <div className="elementor-element elementor-element-21998f6 e-con-full e-flex sc_layouts_column_icons_position_left e-con e-child" data-id="21998f6" data-element_type="container">
        <div className="sc_layouts_item elementor-element elementor-element-936c628 sc_fly_static elementor-widget elementor-widget-trx_elm_advanced_title" data-id="936c628" data-element_type="widget" data-widget_type="trx_elm_advanced_title.default">
          <div className="elementor-widget-container">
            <p className="trx-addons-advanced-title">
              <span className="trx-addons-advanced-title-item trx-addons-advanced-title-item-text elementor-repeater-item-b6da17f">{siteByText} </span>
              <a href={siteByLinkUrl} target="_blank" rel="noreferrer" className="trx-addons-advanced-title-item trx-addons-advanced-title-item-text elementor-repeater-item-44934a7">{siteByLinkText}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
