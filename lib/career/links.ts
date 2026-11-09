export function contributionUrl(value:string):string {
 const text=value.trim();
 if(!text)return '';
 if(text.length>2048)throw new Error('Use a link shorter than 2,049 characters.');
 let url:URL;try{url=new URL(text)}catch{throw new Error('Enter a full HTTPS issue or pull-request link.');}
 if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use an HTTPS link without embedded credentials.');
 return url.href;
}
