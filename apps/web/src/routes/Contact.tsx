import { Seo } from '@modular-house/ui';
import { TextWithContactForm } from '@modular-house/ui';

function Contact() {
  return (
    <div className="bg-white">
      <Seo 
        title="Contact Us" 
        description="Get in touch with us for your modular house needs."
        canonicalUrl="https://modularhouse.ie/contact"
      />
      
      <TextWithContactForm 
        topLabel="GET IN TOUCH"
        heading="We'd love to hear from you"
        description="Our team is ready to answer all your questions."
        contactInfo={{
          address: "Unit 8, Finches Business Park, Long Mile road Dublin 12, D12 N9YV",
          phone: "(+353) 0830280000",
          email: "info@sdeal.ie"
        }}
      />
    </div>
  )
}

export default Contact