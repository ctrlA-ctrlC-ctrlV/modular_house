import './MiniFAQs.css';

export interface FAQs {
  number: string;
  title: string;
  description: string;
}

export interface MiniFAQsProps {
  title?: string;
  faqs: FAQs[];
}

export const MiniFAQs = ({ title = "Modular", faqs }: MiniFAQsProps) => {
  return (
    <div className="mini-faqs-container">
        {title && (
            <div className="mini-faqs-main-title-wrapper">
                <p className="mini-faqs-main-title">{title}</p>
            </div>
        )}
        <div className="mini-faqs-inner">
            {faqs.map((faq, index) => (
                <div key={index} className="mini-faq-item">
                    <div className="mini-faq-number-wrapper">
                        <h5 className="mini-faq-number">{faq.number}</h5>
                    </div>
                    <div className="mini-faq-divider"></div>
                    <div className="mini-faq-content">
                        <div className="mini-faq-title-wrapper">
                            <h2 className="mini-faq-title">{faq.title}</h2>
                        </div>
                        <div className="mini-faq-description-wrapper">
                            <p className="mini-faq-description">{faq.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
