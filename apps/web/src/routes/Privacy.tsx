/**
 * Privacy Policy Page Component
 * =============================================================================
 *
 * PURPOSE:
 * Renders the full privacy policy for Modular House (modularhouse.ie). This page
 * covers data collection practices, cookie usage, GDPR and CCPA compliance, and
 * information about third-party services. The content is statically defined to
 * ensure the policy remains available even when the CMS is unreachable.
 *
 * SEO:
 * Meta tags (title, description, canonical, robots) are injected by TemplateLayout
 * via the route metadata defined in routes-metadata.ts. This component does not
 * render its own <Seo /> block to avoid duplicate head elements.
 *
 * STRUCTURE:
 * - Hero header with page title and last-updated date
 * - Cookie and privacy commitment notice (highlighted)
 * - Sectioned policy content following the template in .template/misc/privacy_policy.md
 * - GDPR and CCPA rights sections
 * - Contact information for privacy-related enquiries
 *
 * =============================================================================
 */

import React, { useEffect } from 'react';
import { useHeaderConfig } from '../components/HeaderContext';

/* =============================================================================
   TYPE DEFINITIONS
   ============================================================================= */

/**
 * Represents a single section within the privacy policy document.
 * Each section has a heading and one or more content blocks rendered
 * sequentially beneath the heading.
 */
interface PolicySection {
  /** Section heading displayed as an <h2> element */
  heading: string;
  /** Array of content blocks — plain strings render as paragraphs; string arrays render as lists */
  content: Array<string | string[]>;
}

/* =============================================================================
   STATIC POLICY DATA
   -----------------------------------------------------------------------------
   Policy content is externalised into a typed constant so the JSX remains
   declarative. Adding or reordering sections requires only data changes,
   following the Open-Closed Principle.
   ============================================================================= */

/** Effective date displayed in the page hero section */
const POLICY_EFFECTIVE_DATE = '13 April 2026';

/**
 * Ordered array of privacy policy sections.
 * Each entry maps to one collapsible-ready block in the rendered page.
 */
const POLICY_SECTIONS: PolicySection[] = [
  {
    heading: 'Information We Collect',
    content: [
      'The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.',
      'If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.',
      'When you register for an account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.',
    ],
  },
  {
    heading: 'How We Use Your Information',
    content: [
      'We use the information we collect in various ways, including to:',
      [
        'Provide, operate, and maintain our website',
        'Improve, personalise, and expand our website',
        'Understand and analyse how you use our website',
        'Develop new products, services, features, and functionality',
        'Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes',
        'Send you emails',
        'Find and prevent fraud',
      ],
    ],
  },
  {
    heading: 'Cookies and Web Beacons',
    content: [
      'Modular House deeply respects your personal privacy. We only collect cookies that are strictly necessary for site functionality and for improving the browsing experience. We do not use cookies for third-party advertising or behavioural tracking purposes.',
      'Like any other website, Modular House uses cookies. These cookies are used to store information including visitor preferences and the pages on the website that the visitor accessed or visited. The information is used to optimise the user experience by customising our web page content based on the visitor\'s browser type and/or other information.',
      'You can choose to disable cookies through your individual browser options. To find more detailed information about cookie management with specific web browsers, please consult the respective browser documentation.',
    ],
  },
  {
    heading: 'Log Files',
    content: [
      'Modular House follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this as part of hosting services\' analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analysing trends, administering the site, tracking user movement on the website, and gathering demographic information.',
    ],
  },
  {
    heading: 'Third-Party Privacy Policies',
    content: [
      'Modular House\'s Privacy Policy does not apply to other advertisers or websites. We advise you to consult the respective privacy policies of any third-party services for more detailed information. This may include their practices and instructions about how to opt out of certain options.',
    ],
  },
  {
    heading: 'CCPA Privacy Policy (Do Not Sell My Personal Information)',
    content: [
      'Under the CCPA, among other rights, California consumers have the right to:',
      [
        'Request that a business that collects a consumer\'s personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.',
        'Request that a business delete any personal data about the consumer that a business has collected.',
        'Request that a business that sells a consumer\'s personal data, not sell the consumer\'s personal data.',
      ],
      'If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.',
    ],
  },
  {
    heading: 'GDPR Privacy Policy (Data Protection Rights)',
    content: [
      'We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:',
      [
        'The right to access -- You have the right to request copies of your personal data. We may charge you a small fee for this service.',
        'The right to rectification -- You have the right to request that we correct any information you believe is inaccurate. You also have the right to request that we complete the information you believe is incomplete.',
        'The right to erasure -- You have the right to request that we erase your personal data, under certain conditions.',
        'The right to restrict processing -- You have the right to request that we restrict the processing of your personal data, under certain conditions.',
        'The right to object to processing -- You have the right to object to our processing of your personal data, under certain conditions.',
        'The right to data portability -- You have the right to request that we transfer the data that we have collected to another organisation, or directly to you, under certain conditions.',
      ],
      'If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.',
    ],
  },
  {
    heading: 'Children\'s Information',
    content: [
      'Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.',
      'Modular House does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.',
    ],
  },
  {
    heading: 'Contact Us',
    content: [
      'If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us through email at info@modularhouse.ie.',
    ],
  },
];

/* =============================================================================
   COMPONENT DEFINITION
   ============================================================================= */

/**
 * Renders a single content block within a policy section.
 * Strings are rendered as paragraphs; string arrays are rendered as
 * unordered lists with bullet points.
 *
 * @param block - The content block to render (paragraph or list items)
 * @param index - Unique index used as the React key for the element
 */
function renderContentBlock(block: string | string[], index: number): React.ReactElement {
  if (Array.isArray(block)) {
    return (
      <ul key={index} className="list-disc pl-6 space-y-2 text-gray-600">
        {block.map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <p key={index} className="text-gray-600">
      {block}
    </p>
  );
}

/**
 * Privacy Page Component
 *
 * Stateless functional component that renders the complete privacy policy.
 * All content is driven by the POLICY_SECTIONS constant, making updates
 * to the policy text a data-only change.
 */
function Privacy(): React.ReactElement {
  const { setHeaderConfig } = useHeaderConfig();

  /* ---------------------------------------------------------------------------
     Header Configuration
     ---------------------------------------------------------------------------
     Sets the site header to the dark variant with position overlay enabled,
     providing a visually consistent appearance with other content pages.
     --------------------------------------------------------------------------- */
  useEffect(() => {
    setHeaderConfig({ variant: 'dark', positionOver: true });
  }, [setHeaderConfig]);

  return (
    <div className="bg-white">
      <div className="l-container py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">

          {/* ---------------------------------------------------------------
              PAGE HEADER
              Title, subtitle, and effective date of the privacy policy.
              --------------------------------------------------------------- */}
          <div className="text-center">
            <h1 className="u-text-h1 text-4xl font-extrabold text-gray-900">
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Your privacy is important to us.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Effective date: {POLICY_EFFECTIVE_DATE}
            </p>
          </div>

          {/* ---------------------------------------------------------------
              INTRODUCTORY STATEMENT
              General scope declaration for the privacy policy.
              --------------------------------------------------------------- */}
          <div className="mt-12 prose prose-lg mx-auto space-y-8">
            <p className="text-gray-600">
              At Modular House, accessible at modularhouse.ie, one of our main
              priorities is the privacy of our visitors. This Privacy Policy
              document contains the types of information that is collected and
              recorded by Modular House and how we use it.
            </p>
            <p className="text-gray-600">
              This privacy policy applies only to our online activities and is
              valid for visitors to our website with regards to the information
              that they shared and/or we collect in Modular House. This policy is
              not applicable to any information collected offline or via channels
              other than this website.
            </p>

            {/* ---------------------------------------------------------------
                COOKIE AND PRIVACY COMMITMENT NOTICE
                Prominent highlight block emphasising that Modular House respects
                user privacy and limits cookie collection to functional and
                improvement purposes only.
                --------------------------------------------------------------- */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6">
              <h2 className="u-text-h2 text-xl font-bold text-indigo-900">
                Our Commitment to Your Privacy
              </h2>
              <p className="mt-3 text-indigo-800">
                Modular House respects your personal privacy. We only collect
                cookies that are essential for the proper functioning of our
                website and for site improvement purposes. We do not use cookies
                for third-party advertising, behavioural profiling, or any
                purpose beyond delivering and enhancing your experience on our
                site.
              </p>
            </div>

            {/* ---------------------------------------------------------------
                CONSENT NOTICE
                --------------------------------------------------------------- */}
            <div>
              <h2 className="u-text-h2 text-2xl font-bold text-gray-900">
                Consent
              </h2>
              <p className="mt-4 text-gray-600">
                By using our website, you hereby consent to our Privacy Policy
                and agree to its terms.
              </p>
            </div>

            {/* ---------------------------------------------------------------
                DYNAMIC POLICY SECTIONS
                Each section from the POLICY_SECTIONS array is rendered with its
                heading and associated content blocks.
                --------------------------------------------------------------- */}
            {POLICY_SECTIONS.map((section) => (
              <div key={section.heading}>
                <h2 className="u-text-h2 text-2xl font-bold text-gray-900">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.content.map((block, blockIndex) =>
                    renderContentBlock(block, blockIndex)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;