// pdf-viewer-widget.js
(function(global){
  function loadPDFJS(callback){
    if (window.pdfjsLib) return callback(); // already loaded

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  global.PDFViewerWidget = {
    create: function(container, options){
      loadPDFJS(function(){
        const pdfUrl = options.src;
        container.innerHTML = `
          <div class="pdf-container-widget">
            <canvas></canvas>
            <div class="controls-widget">
              <button id="prev">Prev</button>
              <span id="page-info">–</span>
              <button id="next">Next</button>
              <button id="fullscreen">Full Screen</button>
            </div>
            <div class="fullscreen-exit" style="display:none;">⇆</div>
          </div>
        `;

        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const info = container.querySelector('#page-info');
        const prevBtn = container.querySelector('#prev');
        const nextBtn = container.querySelector('#next');
        const fullscreenBtn = container.querySelector('#fullscreen');
        const fullscreenExit = container.querySelector('.fullscreen-exit');
        const wrapper = container.querySelector('.pdf-container-widget');

        let pdfDoc = null, pageNum = 1;

        function renderPage(num){
          pdfDoc.getPage(num).then(page=>{
            const viewport = page.getViewport({scale:1});
            const ratio = document.fullscreenElement
              ? Math.min(window.innerWidth/viewport.width, window.innerHeight/viewport.height)
              : canvas.clientWidth/viewport.width;
            const scale = ratio * (window.devicePixelRatio||1);
            const scaledViewport = page.getViewport({scale});
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            canvas.style.width='100%';
            canvas.style.height='100%';
            page.render({canvasContext:ctx, viewport:scaledViewport});
            info.textContent = `Page ${num} / ${pdfDoc.numPages}`;
            prevBtn.disabled = num<=1;
            nextBtn.disabled = num>=pdfDoc.numPages;
          });
        }

        pdfjsLib.getDocument(pdfUrl).promise.then(doc=>{
          pdfDoc = doc;
          renderPage(pageNum);
          window.addEventListener('resize',()=>renderPage(pageNum));
        });

        prevBtn.onclick = ()=>{ if(pageNum>1) renderPage(--pageNum); }
        nextBtn.onclick = ()=>{ if(pageNum<pdfDoc.numPages) renderPage(++pageNum); }

        fullscreenBtn.onclick = ()=>{
          wrapper.requestFullscreen();
          fullscreenExit.style.display='block';
          renderPage(pageNum);
        }

        fullscreenExit.onclick = ()=>{
          document.exitFullscreen();
          fullscreenExit.style.display='none';
          renderPage(pageNum);
        }

        document.addEventListener('fullscreenchange',()=>{
          if(!document.fullscreenElement){
            fullscreenExit.style.display='none';
            renderPage(pageNum);
          }
        });

        // Minimal styles
        const style = document.createElement('style');
        style.textContent = `
          .pdf-container-widget { position: relative; width:100%; padding-top:56.25%; background:#f8f8f8; }
          canvas { position:absolute; top:0; left:0; width:100%; height:100%; border:1px solid #ccc; }
          .controls-widget { position:absolute; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:10px; background:rgba(0,0,0,0.5); padding:5px 10px; border-radius:5px; z-index:10; }
          .controls-widget button { padding:5px 10px; border:none; border-radius:3px; background:#333; color:white; cursor:pointer; }
          .controls-widget span { color:white; min-width:50px; text-align:center; }
          .fullscreen-exit { position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.5); color:white; padding:5px 10px; border:none; border-radius:3px; font-size:16px; cursor:pointer; z-index:15; }
        `;
        container.appendChild(style);
      });
    }
  };
})(window);
