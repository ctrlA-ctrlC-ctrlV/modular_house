import { Helmet } from 'react-helmet-async';
import { SEOConfig } from '../../types/seo';
import { StructuredData } from './StructuredData';

/**
 * Props for the SEOHead component.
 */
export interface SEOHeadProps {
  /** The SEO configuration for the current page. */
  config: SEOConfig;
  /** Optional default title suffix (e.g., " | Modular House"). */
  titleSuffix?: string;
}

/**
 * A component that manages the document head for SEO purposes.
 * It renders the page title, description, and structured data (JSON-LD) using react-helmet-async.
 *
 * @param props - The component props.
 * @returns The Helmet component with SEO tags.
 */
export const SEOHead = ({ config, titleSuffix = '' }: SEOHeadProps) => {
  const { title, description, schema } = config;

  return (
    <>
      <Helmet>
        {/* Basic Metadata */}
        <title>{`${title}${titleSuffix}`}</title>
        <meta name="description" content={description} />

        {/* Open Graph / Twitter Card tags could be added here in the future extending SEOConfig */}
      </Helmet>

      {/* Structured Data (JSON-LD) component */}
      <StructuredData schema={schema} />
    </>
  );
};
