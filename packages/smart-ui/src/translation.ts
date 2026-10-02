export function translationChunks(text:string,limit=5000):string[]{
 if(!Number.isInteger(limit)||limit<100||text.length>50000)throw Error('Documents support up to 50,000 characters per translation.');
 const chunks:string[]=[];let offset=0;while(offset<text.length){let end=Math.min(text.length,offset+limit);if(end<text.length){const newline=text.lastIndexOf('\n',end-1);if(newline>offset+limit/2)end=newline+1;else if(text.charCodeAt(end-1)>=0xd800&&text.charCodeAt(end-1)<=0xdbff)end--; }chunks.push(text.slice(offset,end));offset=end;}return chunks;
}
export async function translationRequest(text:string,source:string,target:string,signal:AbortSignal):Promise<string>{
 if(text.length>5000)throw Error('This request exceeds 5,000 characters. Use document translation for longer text.');
 const response=await fetch('/api/translate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({text,source,target}),signal});
 const body=await response.json() as {translation?:string;message?:string};if(!response.ok||typeof body.translation!=='string')throw Error(body.message||'Translation failed.');return body.translation;
}
