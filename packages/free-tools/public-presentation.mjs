// Public presentation only. No network, storage, processing or policy changes.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
const SOCIAL="https://base2026.dev/static/assets/tools-studio/tools-studio-social.png";
const ALT="Base2026 conceptual research illustration: find the source, keep the context and build the brief.";
const NAV="<a href=\"/solutions/\">SEO guides</a><a href=\"/topics/\">Research</a>";
const NAV_CSS="\n/* Toolkit navigation: local styles only; wrap short text links on small screens. */\n.tool-nav{flex-wrap:wrap;column-gap:20px;row-gap:4px}.tool-nav a{display:inline-flex;align-items:center;min-height:44px}@media(max-width:650px){.tool-nav{justify-content:flex-start;gap:4px 20px}}\n";
const RELATED={"robots-txt-tester": "<section class=\"panel tool-panel\"><h2>Related SEO guides</h2><ul><li><a href=\"/guides/redirect-map-checklist/\">How to check a redirect map before a site change</a></li></ul></section>", "redirect-map-checker": "<section class=\"panel tool-panel\"><h2>Related SEO guides</h2><ul><li><a href=\"/guides/redirect-map-checklist/\">How to check a redirect map before a site change</a></li><li><a href=\"/guides/compare-seo-crawl-exports/\">How to compare two SEO crawl exports and turn changes into tasks</a></li></ul></section>", "hreflang-checker": "<section class=\"panel tool-panel\"><h2>Related SEO guides</h2><ul><li><a href=\"/guides/hreflang-map-checklist/\">How to check a hreflang map before publishing language pages</a></li></ul></section>", "broken-link-task-builder": "<section class=\"panel tool-panel\"><h2>Related SEO guides</h2><ul><li><a href=\"/guides/compare-seo-crawl-exports/\">How to compare two SEO crawl exports and turn changes into tasks</a></li></ul></section>", "seo-crawl-comparison": "<section class=\"panel tool-panel\"><h2>Related SEO guides</h2><ul><li><a href=\"/guides/redirect-map-checklist/\">How to check a redirect map before a site change</a></li><li><a href=\"/guides/hreflang-map-checklist/\">How to check a hreflang map before publishing language pages</a></li><li><a href=\"/guides/compare-seo-crawl-exports/\">How to compare two SEO crawl exports and turn changes into tasks</a></li></ul></section>"};
function meta(html,key,value,attr='property'){
 const rx=new RegExp('<meta\\b(?=[^>]*\\b'+attr+'=[\"\']'+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\"\'])[^>]*>\\s*','gi');
 return html.replace(rx,'').replace('</head>','<meta '+attr+'="'+key+'" content="'+esc(value)+'">\n</head>');
}
export function finalizeCss(css){return css.includes('Toolkit navigation: local styles only')?css:css+NAV_CSS;}
export function finalizeHtml(html,id){
 const rx=/<section class="panel tool-panel"><h2>Related SEO guides<\/h2><ul>[\s\S]*?<\/ul><\/section>/;
 html=html.replace(rx,'');if(RELATED[id])html=html.replace('</main>',RELATED[id]+'</main>');
 html=html.replace(/(<nav class="tool-nav"[^>]*>)([\s\S]*?)(<\/nav>)/,(all,start,body,end)=>start+body.replace(NAV,'')+NAV+end);
 for(const[attr,key,value]of[['property','og:site_name','Base2026'],['property','og:image',SOCIAL],['property','og:image:width','1200'],['property','og:image:height','630'],['property','og:image:alt',ALT],['name','twitter:card','summary_large_image'],['name','twitter:image',SOCIAL],['name','twitter:image:alt',ALT]])html=meta(html,key,value,attr);
 return html;
}
