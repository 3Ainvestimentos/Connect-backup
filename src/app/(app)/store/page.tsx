import React from 'react';

const NuvemShopEmbed = () => {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - var(--header-height))' }}>
      <iframe 
        src="https://www.store-3ariva.com.br" 
        width="100%" 
        height="100%" 
        frameBorder="0"
        title="Nuvem Shop Store"
      />
    </div>
  );
};

export default NuvemShopEmbed;
