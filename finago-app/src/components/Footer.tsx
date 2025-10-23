import React from 'react';
import '../styles/Footer.css';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <div className={`app-footer ${className}`}>
      <div className="footer-content">
        <div className="footer-left">
          <span className="version-info">v1.0.0</span>
          <span className="footer-title">FinagoTech</span>
        </div>
        
        <div className="footer-right">
          <span className="tag enterprise">ENTERPRISE</span>
          <span className="tag ai-powered">AI-POWERED</span>
          <span className="tag secure">SECURE</span>
        </div>
      </div>
    </div>
  );
};

export default Footer;
