import { Helmet } from 'react-helmet-async';
import { SchemaDef } from '../../types/seo';

/**
 * Props for the StructuredData component.
 */
export interface StructuredDataProps {
  /** 
   * Array of schema definitions to be rendered as JSON-LD.
   * Each item contains the schema type and data object.
   */
  schema?: SchemaDef[];
}

/**
 * A specialized SEO component responsible for rendering JSON-LD structured data.
 * It serializes the schema objects into script tags within the document head.
 * 
 * Security: Uses .replace(/</g, '\\u003c') to prevent XSS attacks via JSON injection.
 */
export const StructuredData = ({ schema }: StructuredDataProps) => {
  if (!schema || schema.length === 0) return null;

  return (
    <Helmet>
      {schema.map((item, index) => (
        <script type="application/ld+json" key={`schema-${index}`}>
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': item.type,
            ...item.data,
          }).replace(/</g, '\\u003c')}
        </script>
      ))}
    </Helmet>
  );
};
