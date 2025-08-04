
import React from 'react';

const DraPagamentosPage = () => {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - var(--header-height))' }}>
      <iframe 
        src="https://finadvisors.warpapp.com.br/" 
        width="100%" 
        height="100%" 
        frameBorder="0"
        title="DRA e Pagamentos"
      />
    </div>
  );
};

export default DraPagamentosPage;
