import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import catalogue from '../commerce/saga-volume-01.json' with { type: 'json' };
import { OFFER } from '../server/commerce/offer.mjs';

const root=new URL('../',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const pdf=catalogue.contents.private_pdf_candidate;
const sample=catalogue.contents.public_previews[0];
const digits=pdf.isbn.replaceAll('-','');
assert.match(digits,/^97[89]\d{10}$/);
assert.equal([...digits].reduce((sum,n,i)=>sum+Number(n)*(i%2?3:1),0)%10,0,'ISBN checksum');
assert.equal(pdf.language,'fr');assert.equal(pdf.version,'1.1');
assert.equal(catalogue.contents.pages,93);assert.equal(sample.pages,7);
assert.match(pdf.storage_key,/^saga-ia\/volume-01\/fr\/1\.1\/[^/]+\.pdf$/);
assert.equal(OFFER.pdfKey,pdf.storage_key);assert.equal(OFFER.filename,pdf.storage_key.split('/').at(-1));
const privateBytes=await readFile(new URL(pdf.source_path,root));
assert.equal(hash(privateBytes),pdf.sha256);assert.equal(privateBytes.length,pdf.size_bytes);
for(const location of [new URL(sample.source_path,root),new URL('public'+sample.public_url,root)]){
 const bytes=await readFile(location);assert.equal(hash(bytes),sample.sha256);assert.equal(bytes.length,sample.size_bytes);
}
const report=JSON.parse(await readFile(new URL('../qognito-content/formations/saga-ia/volume-01/editions/fr/1.1/isbn-9791099077301-r2/finalisation.json',root)));
assert.equal(report.sha256,pdf.sha256);assert.equal(report.isbn,pdf.isbn);
assert.equal(report.sample.sha256,sample.sha256);assert.equal(report.pages,93);
assert.deepEqual(report.sample.physical_pages,[1,2,3,18,19,20,51]);
assert.deepEqual(report.modified_physical_pages,[2,3,51,93]);
assert.equal(report.unmodified_page_streams,89);
assert.deepEqual(report.internal_blocks_removed.map(b=>b.physical_page),[3,51]);
assert.equal(report.named_destinations,41);assert.equal(report.internal_annotations_checked,72);
for(const directory of ['public',...(process.argv.includes('--dist')?['dist']:[])]){
 for(const entry of await readdir(new URL(directory+'/',root),{recursive:true})){
  if(!entry.endsWith('.pdf'))continue;
  const digest=hash(await readFile(new URL(directory+'/'+entry,root)));
  assert.ok(![pdf.sha256,report.source_sha256].includes(digest),'The full PDF must remain private');
 }
 if(directory==='dist')assert.equal(hash(await readFile(new URL('dist'+sample.public_url,root))),sample.sha256);
}
const expected=process.env.QOGNITO_VOLUME_EXPECT||'closed';
assert.ok(['closed','open'].includes(expected));
assert.equal(catalogue.channels.direct.enabled,expected==='open');
assert.equal(catalogue.launch.approved,expected==='open');
console.log(`OK fichiers : ISBN, PDF 93 pages, extrait 7 pages, intégrité source/catalogue/public, clé privée explicite, état attendu ${expected}.`);
