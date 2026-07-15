import React from 'react';

const AIContentStudioView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#0a1a12]">
      <div className="p-6 border-b border-[#1a3a2a] flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#d4af37]">Content Studio</h2>
          <p className="text-[#8fb499] text-sm mt-1">Nandara Nusa Montierra - Content Factory Engine</p>
        </div>
        <div className="flex space-x-4">
          <a 
            href="https://nandaragen.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#1a3a2a] text-[#d4af37] border border-[#d4af37] rounded-md hover:bg-[#d4af37] hover:text-[#0a1a12] transition-colors text-sm font-medium"
          >
            Open in New Tab
          </a>
        </div>
      </div>
      
      <div className="flex-grow relative w-full overflow-hidden">
        <iframe 
          src="https://nandaragen.netlify.app/" 
          title="Nandara Content Factory"
          className="absolute inset-0 w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default AIContentStudioView;
