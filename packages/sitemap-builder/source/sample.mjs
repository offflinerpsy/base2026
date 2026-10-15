// Immutable synthetic inputs; byte parity with both downloadable samples is tested.
export const DEMO_HOST = 'example.test';
export const SAMPLE_URLS = "https://example.test/\nhttps://example.test/services/\nhttps://example.test/contact/\nhttps://example.test/services/\n";
export const SAMPLE_SITEMAP = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url><loc>https://example.test/</loc></url>\n  <url><loc>https://example.test/about/</loc></url>\n</urlset>\n";
export function sampleFiles(){
  return [[SAMPLE_URLS,'expected','txt'],[SAMPLE_SITEMAP,'existing','xml']].map(([text,role,format])=>{
    const file=new Blob([text]);
    return {file,size:file.size,role,format};
  });
}
