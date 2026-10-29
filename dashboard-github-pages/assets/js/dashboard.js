(() => {
  'use strict';
  const financialIndices=new Set([6,7,8,9,13,14,16,18,19,26,27,28,32,33,34,46,47,48,49,62,63,64,65,66,74,82]);
  const replacedByFullReport=new Set([20,21]);
  const calculated=new Set([17,35,36,37,38,72,73,84]);
  const includeMetric=m=>!financialIndices.has(m.index)&&!replacedByFullReport.has(m.index)&&m.available>0&&(!calculated.has(m.index)||m.raw!=null);
  const readableNames={58:'Phản hồi tin nhắn trong 7 ngày',59:'Lượt xem tin nhắn chào mừng',81:'Tổng lượt hiển thị mở rộng'};
  const entries=rows=>DB.catalog(rows).filter(includeMetric).map(m=>({...m,name:readableNames[m.index]||m.name,label:readableNames[m.index]||m.label,category:m.category==='Chi phí & tỷ lệ'?'Tỷ lệ & phân phối':m.category,detail:m.index===4?'Kết quả gồm tiếp cận, nhớ quảng cáo, tương tác và hội thoại; giữ riêng đơn vị từng loại.':m.detail}));
  window.ViewPolicy={financialIndices,includeMetric,entries};
})();

(() => {
  'use strict';
  const palette=['#41ddbf','#78a8ff','#ffc078','#b4a1fa','#ed9fc1','#91ca91'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nf=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
  const short=v=>v==null?'—':Math.abs(v)>=1e6?nf.format(v/1e6)+'tr':Math.abs(v)>=1e3?nf.format(v/1e3)+'k':nf.format(v);
  const norm=v=>String(v??'').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const present=v=>v!==null&&v!==undefined&&v!=='';
  const metadata=new Set([0,1,2,3,5,7,8,12,74,75,76,77,78,79,80]);
  const excludedFinancial=new Set([6,7,8,9,13,14,16,18,19,26,27,28,32,33,34,46,47,48,49,62,63,64,65,66,82]);
  const ratioIndices=new Set([17,35,36,37,38,72,73,84]);
  const financialName=/chi phí|chi tiêu|ngân sách|\bcpc\b|\bcpm\b|roas|vnd|₫|lợi nhuận|quyên góp|giá trị (?:của )?kết quả/iu;
  const labels={'reach':'Tiếp cận','estimated_ad_recallers':'Nhớ quảng cáo ước tính','actions:post_engagement':'Tương tác bài','actions:onsite_conversion.messaging_conversation_started_7d':'Hội thoại'};
  const cols={};
  let lastRows=[],lastOptions={},lineGradientId=0;
  function installStyle(){
    if(document.getElementById('mg-style'))return;
    const style=document.createElement('style');style.id='mg-style';
    style.textContent=`#allMetricGallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.mg-card{background:#fff;border:1px solid #e7e4ef;border-radius:17px;padding:18px 18px 12px;min-width:0;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}.mg-card:hover{transform:translateY(-3px);box-shadow:0 10px 26px #3629580d}.mg-top{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;margin-bottom:8px}.mg-title{margin:0;font-size:13px;line-height:1.55;font-weight:600;color:#393449;overflow-wrap:anywhere;min-height:40px}.mg-code{flex:none;border:1px solid #e9e4f6;border-radius:5px;background:#f8f6fe;color:#8172b1;font:10px ui-monospace,monospace;padding:2px 5px}.mg-value{color:#27213c;font-size:24px;line-height:1.35;font-weight:650;font-variant-numeric:tabular-nums;min-height:34px;overflow-wrap:anywhere;margin:0 0 7px}.mg-value.mg-text{font-size:13px;line-height:1.6;min-height:34px;color:#51476a}.mg-category{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8e829f;margin-bottom:5px}.mg-chart{width:100%;margin:2px 0 4px;min-height:135px;display:flex;align-items:center}.mg-chart svg{width:100%;height:auto;display:block;overflow:visible}.mg-chart text{font-family:inherit;font-size:11px;fill:#888094}.mg-chart .mg-num{fill:#4d425f;font-weight:600}.mg-grid{stroke:#eeeaf4;stroke-width:1}.mg-card details{margin-top:auto;border-top:1px solid #f0edf5;font-size:11px;line-height:1.6;color:#7c718a;padding-top:8px}.mg-card summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:7px}.mg-card summary::-webkit-details-marker{display:none}.mg-card summary:after{content:'+';font-size:15px;color:#a499b5}.mg-card details[open] summary:after{content:'−'}.mg-card details p{margin:9px 0 5px;font-size:11px;line-height:1.7;color:#7c718a}.mg-card details .mg-source{font:10px ui-monospace,monospace;color:#9c90a8}.mg-foot-label{font-size:10px;line-height:1.5;color:#9a91a5;margin-bottom:8px;min-height:15px}.mg-missing{background:linear-gradient(145deg,#fdfcff,#faf9fc)}.mg-missing .mg-value{font-size:15px;font-weight:500;color:#a399af}.mg-empty-canvas{color:#a69caf}.mg-lanes{width:100%;display:grid;gap:11px}.mg-lane{display:grid;grid-template-columns:minmax(0,1fr) 84px;gap:9px;align-items:center}.mg-lane-label{font-size:11px;color:#71637e;line-height:1.5}.mg-lane-label b{color:#393047;display:block;font-size:13px;margin-top:2px;font-weight:650}.mg-lane-label small{font-size:10px;color:#9a8ca8}.mg-lane svg{width:84px;min-height:34px}.mg-series-card .mg-chart{min-height:200px}.mg-series-card .mg-value{font-size:14px}.mg-empty-results{grid-column:1/-1;min-height:200px;display:grid;place-items:center;border:1px dashed #d7cfe6;border-radius:18px;color:#8a7c9a}.mg-badge{display:inline-flex;align-items:center;padding:2px 6px;border-radius:4px;font-size:10px;color:#7b6d97;background:#f2edf9}.mg-missing .mg-badge{background:#eeebf1;color:#9b90a7}@media(min-width:1650px){#allMetricGallery{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:1180px){#allMetricGallery{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){#allMetricGallery{grid-template-columns:1fr;gap:13px}.mg-card{padding:17px}.mg-title{font-size:13px;min-height:0}.mg-value{font-size:25px}.mg-chart{min-height:135px}.mg-series-card .mg-chart{min-height:195px}}@media(prefers-reduced-motion:reduce){.mg-card{transition:none}.mg-card:hover{transform:none}}@media print{#allMetricGallery{grid-template-columns:repeat(3,minmax(0,1fr))}.mg-card{break-inside:avoid;box-shadow:none;padding:12px}.mg-title{font-size:10px}.mg-value{font-size:19px}.mg-card details{display:none}.mg-chart{min-height:100px}}`;
    document.head.append(style);
  }
  function svg(inner,w,h,title,desc=''){
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(desc)}</desc>${inner}</svg>`;
  }
  function dateShort(d){return String(d).slice(8,10)+'/'+String(d).slice(5,7);}
  function calendar(rows){
    const dates=[...new Set(rows.map(r=>r[79]).filter(present))].sort();
    if(!dates.length)return [];
    const out=[];
    for(let day=new Date(dates[0]+'T00:00:00Z'),end=new Date(dates.at(-1)+'T00:00:00Z');day<=end;day.setUTCDate(day.getUTCDate()+1)){
      const date=day.toISOString().slice(0,10),subset=rows.filter(r=>r[79]===date);
      out.push({date,rows:subset,catalog:DB.catalog(subset),types:DB.resultTypes(subset)});
    }
    return out;
  }
  function spark(points,title,{compact=false,color='#41ddbf'}={}){
    const w=compact?84:320,h=compact?42:135,left=compact?3:41,right=compact?3:10,top=compact?6:15,bottom=compact?6:29;
    const known=points.filter(p=>p.value!=null&&Number.isFinite(p.value));
    if(!known.length)return emptyPlot(title,compact);
    const maximum=Math.max(...known.map(p=>p.value),0),min=0,max=maximum||1,cw=w-left-right,ch=h-top-bottom;
    const x=i=>left+(points.length===1?cw/2:cw*i/(points.length-1)),y=v=>top+ch-(v-min)/(max-min)*ch;
    const gradient='mg-line-fill-'+(++lineGradientId);
    let s=`<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="${compact?0.18:0.22}"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;
    if(!compact){
      for(let i=0;i<3;i++){const yy=top+ch-i*ch/2;s+=`<line class="mg-grid" x1="${left}" y1="${yy}" x2="${w-right}" y2="${yy}" stroke-dasharray="3 5"/><text x="${left-7}" y="${yy+4}" text-anchor="end">${short(max*i/2)}</text>`;}
      if(maximum===0)s+=`<text x="${left+8}" y="${top+18}">Giá trị ghi nhận = 0</text>`;
    }
    let seg=[];const flush=()=>{if(seg.length){const path=seg.map(([xx,yy],i)=>(i?'L':'M')+xx+','+yy).join(' ');s+=`<path d="${path}L${seg.at(-1)[0]},${top+ch}L${seg[0][0]},${top+ch}Z" fill="url(#${gradient})" data-scroll-area/><path data-scroll-draw d="${path}" fill="none" stroke="${color}" stroke-width="${compact?1.8:2.6}" stroke-linejoin="round" stroke-linecap="round"/>`;seg=[];}};
    points.forEach((p,i)=>{if(p.value==null)flush();else seg.push([x(i),y(p.value)]);});flush();
    points.forEach((p,i)=>{
      if(p.value!=null)s+=`<circle data-scroll-point cx="${x(i)}" cy="${y(p.value)}" r="${compact?1.8:3.6}" fill="#0d232c" stroke="${color}" stroke-width="${compact?1.1:1.8}" data-tip="${esc(dateShort(p.date)+': '+nf.format(p.value))}" tabindex="0"><title>${esc(dateShort(p.date)+': '+nf.format(p.value))}</title></circle>`;
      else if(!compact)s+=`<line x1="${x(i)}" y1="${top+ch-7}" x2="${x(i)}" y2="${top+ch}" stroke="#c9c0d4" stroke-dasharray="2 2"/>`;
    });
    if(!compact&&points.length){const mid=Math.floor((points.length-1)/2);[...new Set([0,mid,points.length-1])].forEach(i=>{s+=`<text x="${x(i)}" y="${h-9}" text-anchor="middle">${dateShort(points[i].date)}</text>`;});}
    return svg(s,w,h,title,compact?'Xu hướng riêng cho loại kết quả, không dùng thang đo chung.':'Xu hướng theo ngày; các khoảng ngắt biểu thị ngày hoặc chỉ số chưa có dữ liệu.');
  }
  function emptyPlot(title,compact=false){
    const w=compact?84:320,h=compact?42:135;
    let s=`<path d="M${compact?3:41},${h*.7} H${w-10}" fill="none" stroke="#d9d1e2" stroke-width="1" stroke-dasharray="4 5"/>`;
    if(!compact)s+=`<line class="mg-grid" x1="41" y1="17" x2="41" y2="${h*.7}"/><text x="180" y="${h*.48}" text-anchor="middle" style="fill:#b5aabd;font-size:20px">∅</text><text x="180" y="${h*.7+22}" text-anchor="middle">Không có giá trị để vẽ</text>`;
    return svg(s,w,h,title,'Không có dữ liệu; đường nét đứt không biểu thị giá trị 0.');
  }
  function textLines(value,maxChars=31){
    const words=String(value).split(/\s+/),lines=[];let current='';
    for(const word of words){if(current.length+word.length+1>maxChars&&current){lines.push(current);current=word;}else current+=(current?' ':'')+word;}
    if(current)lines.push(current);return lines;
  }
  function categorical(rows,index,title){
    const counts=new Map();
    rows.forEach(r=>{if(present(r[index])){let label=index===5?(labels[r[index]]||r[index]):String(r[index]);if(index===7&&typeof r[index]==='number')label=nf.format(r[index])+' ₫';counts.set(label,(counts.get(label)||0)+1);}});
    let entries=[...counts.entries()];
    if(index===1)entries.sort((a,b)=>DB.ages.indexOf(a[0])-DB.ages.indexOf(b[0]));
    else if([76,77,78,79,80].includes(index))entries.sort((a,b)=>a[0].localeCompare(b[0]));
    else entries.sort((a,b)=>b[1]-a[1]);
    if(!entries.length)return emptyPlot(title);
    const w=320,max=Math.max(...entries.map(e=>e[1]),1),left=4,right=31,barW=w-left-right;
    // Every source category remains visible; long labels wrap instead of disappearing.
    let y=9,s='';
    entries.forEach(([label,count],i)=>{
      let displayed=[76,77,78,79,80].includes(index)?dateShort(label)+'/'+label.slice(0,4):label;
      const lines=textLines(displayed,45);
      lines.forEach((line,li)=>{s+=`<text x="${left}" y="${y+li*13}">${esc(line)}</text>`;});
      y+=lines.length*13+3;
      s+=`<rect x="${left}" y="${y}" width="${barW}" height="9" rx="4" fill="#f1edf7"/><rect x="${left}" y="${y}" width="${barW*count/max}" height="9" rx="4" fill="${palette[i%palette.length]}" data-tip="${esc(label+': '+count+' dòng')}" tabindex="0"><title>${esc(label+': '+count+' dòng')}</title></rect><text class="mg-num" x="${w-3}" y="${y+8}" text-anchor="end">${count}</text>`;
      y+=24;
    });
    return svg(s,w,Math.max(135,y),title,'Số dòng có từng giá trị thiết lập; không phải phân bổ hiệu quả theo chiến dịch.');
  }
  function campaignPooled(rows,title){
    const a=DB.aggregate(rows),points=calendar(rows).map(d=>({date:d.date,value:d.rows.length?d.rows.length:null}));
    return spark(points,title+' · số dòng đã hợp nhất')+'';
  }
  function resultCard(index,types,days,title){
    const typeField=index===15?'ratio':'value';
    const measured=types.filter(type=>typeof type[typeField]==='number'&&Number.isFinite(type[typeField]));
    if(!measured.length)return '';
    return '<div class="mg-lanes">'+measured.map((type,i)=>{
      const v=type[typeField],unit=index===15?'%':type.type==='reach'?'tiếp cận cộng dồn':type.type==='estimated_ad_recallers'?'ước tính cộng dồn':'lượt';
      const points=days.map(d=>({date:d.date,value:d.types.find(t=>t.type===type.type)?.[typeField]??null}));
      return `<div class="mg-lane"><div class="mg-lane-label">${esc(labels[type.type]||type.label)}<b>${v==null?'—':nf.format(v)} <small>${esc(unit)}</small></b></div>${spark(points,type.label,{compact:true,color:palette[i%palette.length]})}</div>`;
    }).join('')+'</div>';
  }
  function render(rows,options={}){
    installStyle();lastRows=rows;lastOptions=options;
    const host=document.getElementById('allMetricGallery'),counter=document.getElementById('galleryCount');
    if(!host)return 0;
    const allEntries=window.ViewPolicy?.entries?window.ViewPolicy.entries(rows):DB.catalog(rows);
    const days=calendar(rows),types=DB.resultTypes(rows),a=DB.aggregate(rows);
    const entries=allEntries.filter(m=>m.available>0&&!excludedFinancial.has(m.index)&&!financialName.test(m.name)&&(!ratioIndices.has(m.index)||typeof m.raw==='number'&&Number.isFinite(m.raw))).map(m=>({
      ...m,
      category:m.category==='Chi phí & tỷ lệ'?'Tỷ lệ & phân phối':m.category,
      detail:m.index===4?'Chỉ cộng trong cùng loại hành động. Các chỉ báo được thể hiện riêng để giữ đúng đơn vị.':m.detail
    }));
    const query=norm(options.query||''),category=options.category||'all';
    const selected=entries.filter(m=>(category==='all'||m.category===category)&&(!query||norm([m.name,m.category,m.code,m.method,m.detail].join(' ')).includes(query)));
    host.innerHTML=selected.map((m,i)=>{
      const series=[4,15].includes(m.index);
      let value=m.value,chart,foot='Xu hướng theo ngày · toàn bộ chiến dịch';
      if(series){
        const field=m.index===15?'ratio':'value';
        const measured=types.filter(t=>typeof t[field]==='number'&&Number.isFinite(t[field]));
        value=m.index===4?measured.length+' loại kết quả · giữ riêng đơn vị':'Tỷ lệ theo '+measured.length+' loại kết quả';
        chart=resultCard(m.index,types,days,m.name);foot=m.index===4?'Từng loại được vẽ theo thang riêng':'Chỉ các dòng có cùng chỉ báo kết quả';
      }else if(metadata.has(m.index)){
        if(m.index===0){value=a.campaignNames+' tên đã hợp nhất';chart=campaignPooled(rows,m.name);foot=a.campaignDefinitions+' tên + ngày tạo · không tách chiến dịch';}
        else{chart=categorical(rows,m.index,m.name);foot='Phân bố giá trị cấu hình · số dòng dữ liệu';}
      }else{
        chart=spark(days.map(d=>({date:d.date,value:d.catalog[m.index].raw})),m.name,{color:palette[i%palette.length]});
      }
      const isText=metadata.has(m.index)||series||m.raw==null;
      return `<article class="mg-card ${series?'mg-series-card':''}" data-field-index="${m.index}" data-field-category="${esc(m.category)}"><div class="mg-category">${esc(m.category)}</div><div class="mg-top"><h3 class="mg-title">${esc(m.name)}</h3><span class="mg-code">${esc(m.code)}</span></div><div class="mg-value ${isText?'mg-text':''}">${esc(value)}</div><div class="mg-chart">${chart}</div><div class="mg-foot-label">${esc(foot)}</div><details><summary><span>${m.available}/${rows.length} dòng có dữ liệu</span><span class="mg-badge">${m.nonzero===0&&!metadata.has(m.index)?'Có giá trị 0':'Cách tính'}</span></summary><p><b>${esc(m.method)}</b><br>${esc(m.detail)}</p><p class="mg-source">${esc(m.source)}</p></details></article>`;
    }).join('');
    if(counter)counter.textContent=selected.length+' chỉ số có dữ liệu';
    return selected.length;
  }
  function filter(query='',category='all',onlyAvailable=false){return render(lastRows,{...lastOptions,query,category,onlyAvailable});}
  window.MetricGallery={render,filter};
})();

(() => {
  'use strict';
  const palette=['#41ddbf','#78a8ff','#ffc078','#b4a1fa','#ed9fc1','#91ca91'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nf=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
  const format=(v,unit='')=>v==null?'Chưa có dữ liệu':nf.format(v)+(unit?' '+unit:'');
  const compact=v=>v>=1000000?nf.format(v/1000000)+'tr':v>=1000?nf.format(v/1000)+'k':nf.format(v);
  const rate=(a,b)=>a!=null&&b>0?100*a/b:null;
  const sum=arr=>{const a=arr.filter(v=>typeof v==='number');return a.length?a.reduce((s,v)=>s+v,0):null;};
  const svg=(s,w,h,title)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${s}</svg>`;
  const tip=(label,value,unit)=>esc(label+' · '+format(value,unit));
  let lineGradientId=0;
  function series(labels,items,unit,title,w=500,kind='group') {
    const h=286,l=51,r=25,t=18,b=35,cw=w-l-r,ch=h-t-b;
    const values=items.flatMap(s=>s.values).filter(v=>v!=null),max=Math.max(...values,0),ceil=max>0?max*1.08:1;
    let s='';
    if(!values.length)return svg(`<path d="M${l},${h/2} H${w-r}" stroke="#ddd7e9" stroke-dasharray="4 5"/><text x="${w/2}" y="${h/2-20}" text-anchor="middle">Chưa có dữ liệu</text>`,w,h,title);
    if(kind==='vertical'||kind==='line'){
      for(let j=0;j<=4;j++){const y=t+ch-ch*j/4;s+=`<path d="M${l},${y} H${w-r}" stroke="${kind==='line'?'#203542':'#eeeaf5'}"${kind==='line'?' stroke-dasharray="3 5"':''}/><text x="${l-8}" y="${y+4}" text-anchor="end">${compact(ceil*j/4)}</text>`;}
      const step=cw/Math.max(labels.length,1),bar=Math.min(18,(step-10)/items.length),xx=i=>l+step*(i+.5),yy=v=>t+ch-ch*v/ceil;
      labels.forEach((lab,i)=>{s+=`<text x="${xx(i)}" y="${h-11}" text-anchor="middle">${esc(lab)}</text>`;});
      items.forEach((ss,j)=>{
        if(kind==='line'){
          const color=palette[j%6],gradient='tc-line-fill-'+(++lineGradientId);
          if(items.length===1)s+=`<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".22"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;
          let segment=[];const flush=()=>{if(segment.length){const path=segment.map((p,i)=>(i?'L':'M')+p.join(',')).join(' ');if(items.length===1)s+=`<path d="${path}L${segment.at(-1)[0]},${t+ch}L${segment[0][0]},${t+ch}Z" fill="url(#${gradient})" data-scroll-area/>`;s+=`<path data-scroll-draw d="${path}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;}segment=[];};
          ss.values.forEach((v,i)=>{if(v==null)flush();else segment.push([xx(i),yy(v)]);});flush();
        }
        ss.values.forEach((v,i)=>{const x=xx(i)+(kind==='vertical'?(j-(items.length-1)/2)*bar:0),y=v==null?t+ch:yy(v),a=`data-tip="${tip(labels[i]+' · '+ss.label,v,unit)}" tabindex="0"`;
          if(v==null)s+=`<path d="M${x-2},${h-b-3} l4,6 M${x+2},${h-b-3} l-4,6" stroke="#c7bfd4" ${a}/>`;
          else if(kind==='line')s+=`<circle data-scroll-point cx="${x}" cy="${y}" r="3.8" fill="#0d232c" stroke="${palette[j%6]}" stroke-width="1.8" ${a}><title>${tip(labels[i]+' · '+ss.label,v,unit)}</title></circle>`;
          else if(v===0)s+=`<circle cx="${x}" cy="${y}" r="2.2" fill="white" stroke="${palette[j%6]}" ${a}><title>${tip(labels[i]+' · '+ss.label,v,unit)}</title></circle>`;
          else s+=`<rect x="${x-bar*.42}" y="${y}" width="${bar*.84}" height="${t+ch-y}" rx="2.5" fill="${palette[j%6]}" ${a}><title>${tip(labels[i]+' · '+ss.label,v,unit)}</title></rect>`;
        });
      });
    }else{
      const row=ch/Math.max(labels.length,1),bh=Math.min(kind==='lollipop'?12:9,(row-8)/items.length);
      for(let j=0;j<=4;j++){const x=l+cw*j/4;s+=`<path d="M${x},${t} V${h-b}" stroke="#eeeaf5"/><text x="${x}" y="${h-9}" text-anchor="middle">${compact(ceil*j/4)}</text>`;}
      labels.forEach((lab,i)=>{const middle=t+row*(i+.5);s+=`<text x="${l-9}" y="${middle+4}" text-anchor="end">${esc(lab)}</text>`;items.forEach((ss,j)=>{
        const v=ss.values[i],y=middle+(j-(items.length-1)/2)*(bh+1),ww=v==null?0:cw*v/ceil,a=`data-tip="${tip(lab+' · '+ss.label,v,unit)}" tabindex="0"`;
        if(v==null)s+=`<text x="${l+6}" y="${y+4}" fill="#b0a6c1" ${a}>—</text>`;
        else if(kind==='lollipop')s+=`<path d="M${l},${y} H${l+ww}" stroke="${palette[j%6]}" stroke-opacity=".25" stroke-width="4"/><circle cx="${l+ww}" cy="${y}" r="5" fill="${palette[j%6]}" ${a}/><text x="${Math.min(l+ww+10,w-52)}" y="${y-8}" class="tc-value">${nf.format(v)}</text>`;
        else if(v===0)s+=`<circle cx="${l}" cy="${y}" r="2.5" fill="white" stroke="${palette[j%6]}" ${a}/>`;
        else s+=`<rect x="${l}" y="${y-bh/2}" width="${ww}" height="${bh}" rx="2" fill="${palette[j%6]}" ${a}><title>${tip(lab+' · '+ss.label,v,unit)}</title></rect>`;
      });});
    }
    return svg(s,w,h,title);
  }
  function matrix(labels,cols,values,unit,title,w=500){
    const h=286,l=52,t=28,r=5,b=25,cw=(w-l-r)/cols.length,rh=(h-t-b)/Math.max(labels.length,1);let s='';
    const nums=values.flat().filter(v=>v!=null),max=Math.max(...nums,1);
    cols.forEach((c,j)=>s+=`<text x="${l+cw*(j+.5)}" y="15" text-anchor="middle">${esc(c)}</text>`);
    labels.forEach((lab,i)=>{s+=`<text x="${l-9}" y="${t+rh*(i+.5)+4}" text-anchor="end">${esc(lab)}</text>`;cols.forEach((c,j)=>{const v=values[i][j],alpha=v==null?0:.08+.88*v/max,x=l+cw*j+3,y=t+rh*i+3;s+=`<rect x="${x}" y="${y}" width="${cw-6}" height="${rh-6}" rx="6" fill="${v==null?'#f2eff7':`rgba(65,221,191,${alpha})`}" data-tip="${tip(lab+' · '+c,v,unit)}" tabindex="0"><title>${tip(lab+' · '+c,v,unit)}</title></rect><text x="${x+cw/2-3}" y="${y+rh/2+1}" text-anchor="middle" style="fill:${v!=null&&v/max>.52?'white':'#675d7d'};font-size:12px">${v==null?'—':nf.format(v)}</text>`;});});
    return svg(s,w,h,title);
  }
  function addStyle(){
    if(document.getElementById('tc-style'))return;
    const st=document.createElement('style');st.id='tc-style';st.textContent=`.tc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.tc-card{background:#fff;border:1px solid #e9e5f0;border-radius:18px;padding:21px;min-width:0;box-shadow:0 5px 22px #2a214104;transition:box-shadow .2s,transform .2s}.tc-card:hover{transform:translateY(-2px);box-shadow:0 10px 30px #2c20450b}.tc-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:11px}.tc-top h3{font-size:16px;color:#2b2540;margin:0;line-height:1.4}.tc-unit{padding:4px 8px;border-radius:6px;white-space:nowrap;background:#f1edfc;color:#7c67bc;font-size:10px}.tc-legend{display:flex;gap:8px 13px;flex-wrap:wrap;min-height:25px;margin-bottom:7px;font-size:11px;color:#787087;line-height:1.5}.tc-legend span{display:inline-flex;gap:5px;align-items:center}.tc-legend i{width:7px;height:7px;border-radius:2px;display:inline-block;flex:none}.tc-plot{min-height:230px}.tc-plot svg{width:100%;height:auto;display:block;overflow:visible}.tc-plot svg text{font:12px 'Segoe UI',Arial,sans-serif;fill:#82768f}.tc-plot svg .tc-value{font-weight:650;fill:#524461}.tc-plot [data-tip]{cursor:help;outline:none}.tc-plot [data-tip]:hover,.tc-plot [data-tip]:focus{filter:brightness(.86)}.tc-note{margin-top:9px!important;font-size:10px!important;line-height:1.6!important;color:#91869e!important;min-height:30px}.tc-empty{grid-column:1/-1;padding:30px;text-align:center;color:#8c8398;background:white;border-radius:15px}.tc-metric{display:flex;align-items:baseline;gap:8px;font-size:13px;color:#84758d;margin-bottom:12px}.tc-metric b{font-size:25px;color:#6751b4;letter-spacing:-.5px}.tc-metric small{font-size:11px}@media(max-width:780px){.tc-grid{grid-template-columns:1fr}.tc-card{padding:18px}.tc-top h3{font-size:15px}.tc-legend{font-size:11px}.tc-note{font-size:10px!important}.tc-plot{min-height:210px}}@media print{.tc-grid{grid-template-columns:1fr 1fr}.tc-card{break-inside:avoid;box-shadow:none}.tc-plot{min-height:0}.tc-plot svg{max-height:260px}}@media(prefers-reduced-motion:reduce){.tc-card{transition:none}}`;
    document.head.append(st);
  }
  function render(rows){
    const target=document.getElementById('technicalCharts');if(!target)return {charts:0};addStyle();
    const age=DB.byAge(rows).filter(a=>a.n>0),a=DB.aggregate(rows),labs=age.map(a=>a.age),configs=[];
    const metrics=(names,keys)=>names.map((label,i)=>({label,values:age.map(a=>typeof keys[i]==='number'?a.s[keys[i]]:a[keys[i]])}));
    function panel(title,unit,items,note='',kind='group',extra=''){configs.push({title,unit,items,note,kind,extra});}
    panel('CTR theo độ tuổi','%',metrics(['CTR tất cả','CTR liên kết','CTR người* tất cả','CTR người* liên kết'],['ctrAll','ctrLink','uniqueCTRAllProxy','uniqueCTRLinkProxy']),'* Tỷ lệ người tính trên số cộng dồn, chưa khử trùng lặp.');
    panel('Tỷ số phân phối trên tiếp cận','lần',metrics(['Hiển thị / tiếp cận*'],['frequencyProxy']),'Tỷ số cộng dồn, không phải tần suất duy nhất toàn kỳ.','lollipop');
    panel('Click & người click','lượt / người*',metrics(['Click tất cả','Người click tất cả*','Click liên kết','Người click link*'],[30,39,41,42]),'* Người click được cộng theo dòng, có thể trùng.','vertical');
    panel('Xem ngắn & ThruPlay','lượt',metrics(['Video ≥3 giây','ThruPlay ≥15 giây'],[23,22]),'Hai mốc xem riêng; không cộng thành tổng video.','vertical');
    configs.push({title:'Các mốc xem video',unit:'lượt',kind:'matrix',cols:['25%','50%','75%','95%','100%'],values:age.map(a=>[71,69,70,67,68].map(i=>a.s[i])),items:[],note:'Các lượt xem lồng nhau, không cộng các mốc.'});
    configs.push({title:'Giữ chân theo mốc thời lượng',unit:'% lượt phát',kind:'retention',items:age.map(a=>({label:a.age,values:[71,69,70,67,68].map(i=>rate(a.s[i],a.s[29]))})),note:'Mỗi mốc / số bắt đầu phát video của cùng độ tuổi.'});
    panel('Thu hút 3 giây & xem hoàn tất','%',metrics(['≥3 giây / hiển thị','100% / bắt đầu phát'],['hookRate','completionRate']),'Hai mẫu số khác nhau, được ghi riêng trong chú giải.','vertical');
    panel('Thời gian xem trung bình','giây',metrics(['Thời gian xem ước tính'],['duration']),'Gia quyền theo lượt phát; thiếu tổng giây xem để tính chính xác.','lollipop');
    panel('Tương tác Trang & bài viết','lượt',metrics(['Tương tác Trang','Tương tác bài'],[54,55]),'Hai cột đang bằng nhau; không cộng thành một tổng.');
    panel('Sự kiện nhắn tin','lượt',metrics(['Bắt đầu hội thoại','Phản hồi 7 ngày','Xem tin chào mừng'],[61,58,59]),'Các sự kiện riêng, không phải phễu chuyển đổi tuần tự.','vertical');
    panel('Nhớ quảng cáo ước tính','lượt ước tính',metrics(['Nhớ quảng cáo cộng dòng'],[83]),'Số ước tính cộng dồn theo dòng, có thể trùng người.','lollipop');
    panel('Tỷ lệ nhớ quảng cáo','%',metrics(['Nhớ quảng cáo / tiếp cận*'],['recallRateProxy']),'Tỷ số cộng dồn; không phải phép đo nhân quả.','lollipop');
    const delta=a.s[81]!=null&&a.s[10]!=null?a.s[81]-a.s[10]:null;
    const deltaRate=rate(delta,a.s[81]);
    panel('Đối chiếu lượt hiển thị','lượt',metrics(['Tổng hiển thị mở rộng','Hiển thị chuẩn'],[81,10]),'Cột mở rộng bao gồm hiển thị không hợp lệ theo nhãn nguồn.','group',`<div class="tc-metric"><b>${format(delta)}</b><span>lượt chênh lệch</span>${deltaRate==null?'':`<small>${format(deltaRate,'%')} tổng mở rộng</small>`}</div>`);
    panel('Hành động tương tác chi tiết','lượt',metrics(['Cảm xúc','Lưu bài','Bình luận','Click ảnh'],[50,44,45,31]),'Ô trống hiển thị —; không tự quy về 0.','vertical');
    configs.push({title:'Tỷ trọng hành động theo độ tuổi',unit:'%',kind:'matrix',cols:['Hiển thị','Click','Video100%','Tương tác','Hội thoại'],values:age.map(ar=>[10,30,68,55,61].map(i=>rate(ar.s[i],a.s[i]))),items:[],note:'Tỷ trọng từng độ tuổi trong tổng chỉ số; không phải tỷ lệ chuyển đổi.'});
    const available=v=>typeof v==='number'&&Number.isFinite(v);
    const visible=configs.map(c=>{
      if(c.kind==='matrix'){
        const colIndices=c.cols.map((_,j)=>j).filter(j=>c.values.some(row=>available(row[j])));
        const rowIndices=c.values.map((_,i)=>i).filter(i=>colIndices.some(j=>available(c.values[i][j])));
        if(!colIndices.length||!rowIndices.length)return null;
        return {...c,cols:colIndices.map(j=>c.cols[j]),values:rowIndices.map(i=>colIndices.map(j=>c.values[i][j])),chartLabels:rowIndices.map(i=>labs[i])};
      }
      const items=c.items.filter(ss=>ss.values.some(available));
      if(!items.length)return null;
      const labels=c.kind==='retention'?['25%','50%','75%','95%','100%']:labs;
      const positions=labels.map((_,i)=>i).filter(i=>items.some(ss=>available(ss.values[i])));
      if(!positions.length)return null;
      return {...c,items:items.map(ss=>({...ss,values:positions.map(i=>ss.values[i])})),chartLabels:positions.map(i=>labels[i])};
    }).filter(Boolean);
    if(!visible.length){target.innerHTML='';return {charts:0,ages:age.length};}
    target.innerHTML='<div class="tc-grid">'+visible.map((c,i)=>`<article class="tc-card" data-tech-chart="${i}"><div class="tc-top"><h3>${esc(c.title)}</h3><span class="tc-unit">${esc(c.unit)}</span></div>${c.extra||''}<div class="tc-legend">${c.items.map((ss,j)=>`<span><i style="background:${palette[j%6]}"></i>${esc(ss.label)}</span>`).join('')}</div><div class="tc-plot" id="tc-plot-${i}"></div><p class="tc-note">${esc(c.note)}</p></article>`).join('')+'</div>';
    visible.forEach((c,i)=>{const el=document.getElementById('tc-plot-'+i),w=Math.max(330,el.clientWidth);el.innerHTML=c.kind==='matrix'?matrix(c.chartLabels,c.cols,c.values,c.unit,c.title,w):series(c.chartLabels,c.items,c.unit,c.title,w,c.kind==='retention'?'line':c.kind);});
    return {charts:visible.length,ages:age.length};
  }
  window.TechnicalCharts={render};
})();

(() => {
  'use strict';
  const C=['#41ddbf','#78a8ff','#ffc078','#b4a1fa','#ed9fc1','#91ca91'];
  const n=v=>v==null?'—':new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(v);
  const ab=v=>v==null?'—':Math.abs(v)>=1000?n(v/1000)+'k':n(v);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rate=(a,b,m=100)=>a==null||b==null||b<=0?null:m*a/b;
  const has=values=>values.some(v=>typeof v==='number'&&Number.isFinite(v));
  const plotWidth=()=>{const cw=document.getElementById('audienceVisuals')?.clientWidth||1000,iw=typeof innerWidth==='number'?innerWidth:1200;return Math.max(320,Math.min(560,(iw<=980?cw:(cw-18)/2)-44));};
  const svg=(s,w,h,label,desc='')=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><desc>${esc(desc)}</desc>${s}</svg>`;
  const tip=(title,value,unit='')=>`data-tip="${esc(title+'\n'+n(value)+(unit?' '+unit:''))}" tabindex="0"`;
  function card(title,plot,note='',full=false){return `<article class="av-card ${full?'av-full':''}" data-empathy-chart><h3>${title}</h3>${plot}${note?`<p class="av-caption">${note}</p>`:''}</article>`;}
  function installStyle(){
    if(document.getElementById('empathy-style'))return;
    const st=document.createElement('style');st.id='empathy-style';
    st.textContent=`.av-legend{display:flex;flex-wrap:wrap;gap:8px 15px;color:#84748e;font-size:11px;margin-bottom:12px}.av-legend span{display:inline-flex;align-items:center;gap:6px}.av-legend i{display:inline-block;width:8px;height:8px;border-radius:3px}.av-evidence{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px}.av-evidence article{background:#f0ecfc;border:1px solid #e5def3;padding:16px 18px;border-radius:14px}.av-evidence strong{display:block;color:#6f58c5;font-size:28px;line-height:1.2;margin-bottom:6px}.av-evidence span{font-size:12px;color:#71627f;line-height:1.6}.av-label-key{font-size:10px;letter-spacing:1px;color:#a18eae;text-transform:uppercase;margin-bottom:9px}.av-card svg text{font-family:'Segoe UI',Arial,sans-serif}.av-card [data-tip]:focus,.av-card [data-tip]:hover{filter:brightness(.88)}.av-card [data-tip]{outline:none;cursor:help}.av-question{grid-column:1/-1;background:#eef7f4;border:1px solid #d9eae4;border-radius:13px;padding:13px 17px;font-size:12px;color:#52796e;line-height:1.7}.av-question b{color:#3c6a5d}@media(max-width:720px){.av-evidence{grid-template-columns:1fr}.av-evidence article{padding:13px 16px}.av-evidence strong{font-size:24px}.av-legend{font-size:10px;gap:7px 10px}}@media print{.av-evidence{grid-template-columns:1fr 1fr 1fr}.av-card{break-inside:avoid}}`;
    document.head.append(st);
  }
  function daily(rows){
    const root=document.getElementById('dailyCharts');if(!root)return;
    const from=document.getElementById('dateFrom').value,to=document.getElementById('dateTo').value;
    const days=DB.byDay(rows,from,to),a=DB.aggregate(rows);
    const defs=[[30,'Click tất cả','lượt'],[41,'Click liên kết','lượt'],[23,'Video ≥3 giây','lượt'],[61,'Hội thoại bắt đầu','lượt']];
    root.innerHTML=defs.filter(([index])=>a.s[index]!=null).map(([index,label,unit])=>{
      const w=460,h=200,l=42,r=25,t=25,b=37,cw=w-l-r,ch=h-t-b;
      const color=({30:C[0],41:C[1],23:C[3],61:'#ffc078'})[index],gradient='daily-line-fill-'+index;
      const vals=days.map(d=>d.observed?d.s[index]:null),rawStep=Math.max(1,Math.max(1,...vals.filter(v=>v!=null))*1.15/3),power=10**Math.floor(Math.log10(rawStep)),step=([1,2,3,5,10].find(v=>v>=rawStep/power)||10)*power,max=step*3;
      const x=i=>l+(days.length===1?cw/2:i*cw/(days.length-1)),y=v=>t+ch-ch*v/max;
      let marks=`<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".22"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;for(let i=0;i<=3;i++){const yy=y(max*i/3);marks+=`<line x1="${l}" y1="${yy}" x2="${w-r}" y2="${yy}" stroke="#203542" stroke-dasharray="3 5"/><text x="${l-7}" y="${yy+4}" text-anchor="end" fill="#91abb9" font-size="10">${ab(max*i/3)}</text>`;}
      let seg=[];const flush=()=>{if(seg.length){const p=seg.map(([xx,yy],i)=>(i?'L':'M')+xx+','+yy).join(' ');marks+=`<path d="${p}L${seg.at(-1)[0]},${t+ch}L${seg[0][0]},${t+ch}Z" fill="url(#${gradient})" data-scroll-area/><path data-scroll-draw d="${p}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;seg=[];}};
      vals.forEach((v,i)=>{if(v==null)flush();else seg.push([x(i),y(v)]);});flush();
      days.forEach((d,i)=>{if(i%2===0||i===days.length-1)marks+=`<text x="${x(i)}" y="${h-12}" text-anchor="middle" font-size="10" fill="#91abb9">${d.date.slice(8)}/${d.date.slice(5,7)}</text>`;const v=vals[i],labelX=x(i)+(i===0?5:i===days.length-1?-5:0),anchor=i===0?'start':i===days.length-1?'end':'middle';if(v==null)marks+=`<line x1="${x(i)}" y1="${t+ch-10}" x2="${x(i)}" y2="${t+ch}" stroke="#607b8c" stroke-dasharray="2 2"/>`;else marks+=`<circle data-scroll-point cx="${x(i)}" cy="${y(v)}" r="4" fill="#0d232c" stroke="${color}" stroke-width="2" ${tip(d.date+' · '+label,v,unit)}/><text x="${labelX}" y="${y(v)-11}" text-anchor="${anchor}" font-size="10" fill="#d9f8f2">${ab(v)}</text>`;});
      return `<article class="daily-card"><div class="daily-head"><h3>${label}</h3><span class="daily-value">${n(a.s[index])} <small class="daily-unit">${unit}</small></span></div>${svg(marks,w,h,label+' theo ngày')}<div class="daily-unit">Ngắt nét = thiếu dữ liệu · 0 = giá trị ghi trong nguồn</div></article>`;
    }).join('');
  }
  function horizontal(items,title,unit='',colors=C){
    const list=items.filter(d=>d.value!=null);if(!list.length)return '';
    const w=plotWidth(),h=Math.max(215,list.length*43+35),l=124,r=57,t=15,ch=h-40,cw=w-l-r,max=Math.max(...list.map(d=>d.value),1);
    let s='';for(let i=0;i<=3;i++){const x=l+cw*i/3;s+=`<line x1="${x}" y1="${t}" x2="${x}" y2="${h-27}" stroke="#eeeaf4"/><text x="${x}" y="${h-7}" text-anchor="middle" font-size="11" fill="#9688a2">${ab(max*i/3)}</text>`;}
    list.forEach((d,i)=>{const rh=ch/list.length,y=t+i*rh+rh*.2,bw=cw*d.value/max;s+=`<text x="${l-12}" y="${y+15}" text-anchor="end" font-size="12" fill="#776587">${esc(d.label)}</text><rect x="${l}" y="${y}" width="${cw}" height="22" rx="5" fill="#f4f1f9"/><rect x="${l}" y="${y}" width="${bw}" height="22" rx="5" fill="${d.color||colors[i%colors.length]}" ${tip(d.label,d.value,unit)}/><text x="${l+bw+8}" y="${y+15}" font-size="12" fill="#5d4d6e">${ab(d.value)}</text>`;});
    return svg(s,w,h,title,unit);
  }
  function heatmap(ages){
    const fields=[['Hiển thị',a=>a.s[10],'lượt'],['Tiếp cận*',a=>a.s[11],'cộng dồn'],['CTR tất cả',a=>a.ctrAll,'%'],['CTR liên kết',a=>a.ctrLink,'%'],['Xem ≥3s',a=>a.hookRate,'% hiển thị'],['Xem hết',a=>a.completionRate,'% lượt phát'],['TG xem TB',a=>a.duration,'giây ước tính'],['Tương tác',a=>a.s[55],'lượt'],['Hội thoại',a=>a.s[61],'lượt'],['Video 100%',a=>a.s[68],'lượt']].filter(([,fn])=>has(ages.map(fn)));
    if(!fields.length)return '';
    const w=1000,h=98+ages.length*32,left=85,top=62,cw=(w-left-16)/fields.length,rh=32;let s='';
    fields.forEach(([label,fn,unit],j)=>{s+=`<text x="${left+cw*(j+.5)}" y="25" text-anchor="middle" fill="#6f6185" font-size="11">${label}</text><text x="${left+cw*(j+.5)}" y="41" text-anchor="middle" fill="#a497b0" font-size="9">${unit}</text>`;const max=Math.max(...ages.map(a=>fn(a)??0),1);ages.forEach((a,i)=>{const v=fn(a),alpha=v==null?0:.08+.75*v/max,x=left+j*cw,y=top+i*rh;s+=`<rect x="${x+3}" y="${y+2}" width="${cw-6}" height="${rh-4}" rx="5" fill="${v==null?'#f0edf3':`rgba(65,221,191,${alpha})`}" ${tip(a.age+' · '+label,v,unit)}/><text x="${x+cw/2}" y="${y+21}" text-anchor="middle" fill="${v!=null&&alpha>.5?'#fff':'#78678b'}" font-size="10">${n(v)}</text>`;});});
    ages.forEach((a,i)=>s+=`<text x="${left-13}" y="${top+i*rh+21}" text-anchor="end" fill="#645672" font-size="12">${a.age}</text>`);
    return `<div class="av-scroll">${svg(s,w,h,'Chân dung hành vi quan sát theo độ tuổi')}</div>`;
  }
  function distributionScatter(ages,all){
    const dots=ages.map((a,i)=>({a,i,x:rate(a.s[10],all.s[10]),y:rate(a.s[61],all.s[61])})).filter(d=>d.x!=null&&d.y!=null);
    if(!dots.length)return '';
    const w=plotWidth(),h=340,l=50,t=35,pw=w-l-35,ph=220;let s='';
    for(let j=0;j<=4;j++){const x=l+pw*j/4,y=t+ph-ph*j/4;s+=`<line x1="${l}" y1="${y}" x2="${l+pw}" y2="${y}" stroke="#eeeaf4"/><line x1="${x}" y1="${t}" x2="${x}" y2="${t+ph}" stroke="#f2eef7"/><text x="${x}" y="${t+ph+23}" text-anchor="middle" font-size="11" fill="#93859d">${j*25}%</text><text x="${l-9}" y="${y+4}" text-anchor="end" font-size="11" fill="#93859d">${j*25}%</text>`;}
    s+=`<line x1="${l}" y1="${t+ph}" x2="${l+pw}" y2="${t}" stroke="#c5bbdb" stroke-dasharray="4 5"/><text x="${l+pw/2}" y="${h-15}" text-anchor="middle" font-size="12" fill="#766884">Tỷ trọng hiển thị (%)</text><text transform="translate(14 ${t+ph/2}) rotate(-90)" text-anchor="middle" font-size="12" fill="#766884">Tỷ trọng hội thoại (%)</text>`;
    dots.forEach(({a,i,x:xs,y:ys})=>{const x=l+pw*xs/100,y=t+ph-ph*ys/100,v=a.s[68],r=v==null?8:28*Math.sqrt(v/(all.s[68]||1)),inward=x>l+pw*.75,tx=inward?x-r-5:x+r+5;s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${v==null?'none':C[i]}" fill-opacity=".76" stroke="${v==null?C[i]:'white'}" stroke-width="2" data-tip="${a.age}\nHiển thị: ${n(xs)}%\nHội thoại: ${n(ys)}%\nVideo 100%: ${n(v)}" tabindex="0"/><text x="${tx}" y="${Math.max(16,y+4)}" text-anchor="${inward?'end':'start'}" font-size="12" fill="#6f6083">${a.age}</text>`;});
    return svg(s,w,h,'Tỷ trọng phân phối và chủ động hội thoại theo độ tuổi');
  }
  function responseShare(ages,all){
    const metrics=[['Click tất cả',30,C[0]],['Video 100%',68,C[1]],['Hội thoại',61,C[2]]].filter(([,idx])=>all.s[idx]>0);
    if(!metrics.length)return '';
    const w=plotWidth(),h=300,l=45,r=15,t=20,b=37,cw=w-l-r,ch=h-t-b,step=cw/ages.length,bw=Math.min(16,(step-9)/metrics.length);let s='';
    for(let j=0;j<=4;j++){const y=t+ch-ch*j/4;s+=`<line x1="${l}" y1="${y}" x2="${w-r}" y2="${y}" stroke="#efebf5"/><text x="${l-9}" y="${y+4}" text-anchor="end" font-size="11" fill="#9688a2">${j*25}%</text>`;}
    ages.forEach((a,i)=>{const x=l+step*(i+.5);s+=`<text x="${x}" y="${h-12}" text-anchor="middle" font-size="11" fill="#8a7c97">${a.age}</text>`;metrics.forEach(([label,idx,color],j)=>{const v=rate(a.s[idx],all.s[idx]),xx=x+(j-(metrics.length-1)/2)*bw;if(v==null){s+=`<text x="${xx}" y="${t+ch-3}" text-anchor="middle" font-size="10" fill="#b8a8c4">—</text>`;return;}const bh=ch*v/100;s+=`<rect x="${xx-bw*.38}" y="${t+ch-bh}" width="${bw*.76}" height="${bh}" rx="3" fill="${color}" ${tip(a.age+' · '+label,v,'% trong tổng chỉ số')}/>`;});});
    return `<div class="av-legend">${metrics.map(([label,,color])=>`<span><i style="background:${color}"></i>${label}</span>`).join('')}</div>${svg(s,w,h,'Cách các độ tuổi đóng góp vào từng hành động')}`;
  }
  function attentionScatter(ages){
    const dots=ages.map((a,i)=>({a,i,x:a.hookRate,y:a.completionRate})).filter(d=>d.x!=null&&d.y!=null);if(!dots.length)return '';
    const w=plotWidth(),h=340,l=54,t=30,pw=w-l-26,ph=235,maxX=Math.max(1,...dots.map(d=>d.x))*1.18,maxY=Math.max(1,...dots.map(d=>d.y))*1.18;let s='';
    for(let j=0;j<=4;j++){const x=l+pw*j/4,y=t+ph-ph*j/4;s+=`<line x1="${l}" y1="${y}" x2="${l+pw}" y2="${y}" stroke="#eeeaf4"/><line x1="${x}" y1="${t}" x2="${x}" y2="${t+ph}" stroke="#f2eef7"/><text x="${x}" y="${t+ph+23}" text-anchor="middle" font-size="11" fill="#93859d">${n(maxX*j/4)}%</text><text x="${l-9}" y="${y+4}" text-anchor="end" font-size="11" fill="#93859d">${n(maxY*j/4)}%</text>`;}
    s+=`<text x="${l+pw/2}" y="${h-13}" text-anchor="middle" font-size="12" fill="#766884">Xem ≥3 giây / hiển thị (%)</text><text transform="translate(14 ${t+ph/2}) rotate(-90)" text-anchor="middle" font-size="12" fill="#766884">Xem hết / lượt phát (%)</text>`;
    dots.forEach(({a,i,x:xv,y:yv})=>{const x=l+pw*xv/maxX,y=t+ph-ph*yv/maxY,inward=x>l+pw*.76;s+=`<circle cx="${x}" cy="${y}" r="8" fill="${C[i]}" stroke="white" stroke-width="2" data-tip="${a.age}\nXem ≥3 giây / hiển thị: ${n(xv)}%\nXem hết / lượt phát: ${n(yv)}%" tabindex="0"/><text x="${inward?x-13:x+13}" y="${y+4}" text-anchor="${inward?'end':'start'}" fill="#6c5d80" font-size="12">${a.age}</text>`;});
    return svg(s,w,h,'Mức chú ý ban đầu và độ sâu xem theo độ tuổi');
  }
  function audience(rows){
    const root=document.getElementById('audienceVisuals');if(!root)return;
    const ages=DB.byAge(rows).filter(a=>a.n),all=DB.aggregate(rows);
    if(!ages.length){root.innerHTML='';return;}
    const panels=[],heat=heatmap(ages);if(heat)panels.push(card('Chân dung hành vi × độ tuổi',heat,'Độ đậm so sánh trong từng cột · dấu — là ô thiếu · * số tiếp cận cộng dồn',true));
    const dist=distributionScatter(ages,all);if(dist)panels.push(card('Phân phối × chủ động kết nối',dist,'Diện tích bóng = lượt video 100% · vòng rỗng = thiếu lượt xem hết · chưa phản ánh động cơ'));
    const attention=horizontal([[10,'Hiển thị'],[29,'Bắt đầu phát'],[23,'Xem ≥3 giây'],[22,'ThruPlay'],[68,'Xem hết video']].map(([i,label])=>({label,value:all.s[i]})),'Các mức chú ý được ghi nhận','lượt');
    if(attention)panels.push(card('Các mức chú ý với nội dung',attention,'Các lượt có thể lồng nhau; không phải hành trình của cùng một khách hàng.'));
    const shares=responseShare(ages,all);if(shares)panels.push(card('Độ tuổi nào phản hồi theo cách nào?',shares,'Tỷ trọng theo từng chỉ số; không cộng các loại hành động.'));
    const deep=attentionScatter(ages);if(deep)panels.push(card('Thu hút ban đầu × xem sâu',deep,'Mỗi điểm là một độ tuổi · hai trục có mẫu số riêng.'));
    const message=horizontal(ages.map((a,i)=>({label:a.age,value:rate(a.s[61],a.s[10],1000),color:C[i]})),'Hội thoại trên 1.000 lượt hiển thị','hội thoại / 1.000 hiển thị');
    if(message)panels.push(card('Mức chủ động bắt đầu hội thoại',message,'Các ô chưa ghi nhận hội thoại được bỏ khỏi biểu đồ, không coi là 0.'));
    const observed=[];
    const bestMsg=ages.filter(a=>a.s[61]!=null).sort((a,b)=>b.s[61]-a.s[61])[0];
    const bestComplete=ages.filter(a=>a.completionRate!=null).sort((a,b)=>b.completionRate-a.completionRate)[0];
    if(bestMsg&&all.s[61]>0)observed.push(`<article><div class="av-label-key">Quan sát · kết nối</div><strong>${n(rate(bestMsg.s[61],all.s[61]))}%</strong><span>Hội thoại thuộc tuổi ${bestMsg.age} · ${n(bestMsg.s[61])}/${n(all.s[61])} lượt ghi nhận</span></article>`);
    if(bestComplete)observed.push(`<article><div class="av-label-key">Quan sát · xem sâu</div><strong>${n(bestComplete.completionRate)}%</strong><span>Video xem hết / lượt phát ở tuổi ${bestComplete.age} · cao nhất trong phạm vi lọc</span></article>`);
    if(all.hookRate!=null)observed.push(`<article><div class="av-label-key">Quan sát · chú ý</div><strong>${n(all.hookRate)}%</strong><span>Lượt xem ≥3 giây / hiển thị · toàn bộ độ tuổi trong bộ lọc</span></article>`);
    root.innerHTML=(observed.length?`<div class="av-evidence">${observed.join('')}</div>`:'')+`<div class="av-grid">${panels.join('')}${panels.length?'<div class="av-question"><b>Câu hỏi thấu hiểu cần phỏng vấn:</b> “Nội dung nào khiến bạn dừng xem và điều gì giúp bạn sẵn sàng nhắn tin?”</div>':''}</div>`;
  }
  window.VisualDashboard={render(rows){installStyle();daily(rows);audience(rows);}};
})();

(() => {
  'use strict';
  const labels={male:'Nam',female:'Nữ',unknown:'Không xác định'};
  const sexes=['male','female','unknown'],ages=['18-24','25-34','35-44','45-54','55-64','65+'];
  const colors=['#41ddbf','#78a8ff','#ffc078'];
  const sexColor=sex=>colors[Math.max(0,sexes.indexOf(sex))];
  const nf=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
  const countFormat=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>v==null?'—':nf.format(v),count=v=>v==null?'—':countFormat.format(v);
  const valid=v=>typeof v==='number'&&Number.isFinite(v);
  const sum=(rows,key)=>{const values=rows.map(r=>r[key]).filter(valid);return values.length?values.reduce((a,b)=>a+b,0):null;};
  const ratio=(a,b)=>a==null||b==null||b<=0?null:100*a/b;
  const tip=text=>`data-tip="${esc(text)}" tabindex="0" aria-label="${esc(text)}"`;
  const svg=(s,w,h,title)=>`<svg class="gd-depth-svg" data-motion="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${s}</svg>`;
  function shade(hex,factor){const n=parseInt(hex.slice(1),16),v=[n>>16,(n>>8)&255,n&255].map(c=>Math.max(0,Math.min(255,Math.round(c*factor))));return '#'+v.map(c=>c.toString(16).padStart(2,'0')).join('');}
  function aggregate(rows){
    const impressions=sum(rows,'impressions'),clicks=sum(rows,'clicks'),linkClicks=sum(rows,'linkClicks');
    const messaging=rows.filter(r=>r.resultType==='Lượt bắt đầu cuộc trò chuyện qua tin nhắn');
    return {n:rows.length,impressions,reach:sum(rows,'reach'),clicks,linkClicks,
      ctrAll:ratio(clicks,impressions),ctrLink:ratio(linkClicks,impressions),messages:sum(messaging,'result')};
  }
  function style(){
    if(document.getElementById('gd-style'))return;
    const st=document.createElement('style');st.id='gd-style';st.textContent=`
      .gd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
      .gd-card{background:linear-gradient(150deg,#fff 50%,#faf8ff);border:1px solid #e7e1ef;border-radius:21px;padding:23px;min-width:0;position:relative;box-shadow:0 6px 0 -3px #e9e1f2,0 16px 30px -25px #3d285c55;isolation:isolate}
      .gd-card:before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(ellipse at 95% 0,#ded3ff38,transparent 47%);z-index:-1}
      .gd-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:13px}.gd-head h3{font-size:16px;line-height:1.4;color:#30263f;margin:0}.gd-unit{font-size:10px;padding:4px 8px;background:#eee8fa;color:#796394;border-radius:6px;white-space:nowrap}
      .gd-plot svg{display:block;width:100%;height:auto;overflow:visible}.gd-plot text{font:12px 'Segoe UI',Arial,sans-serif;fill:#8c7f99}.gd-plot .gd-value{font-weight:650;fill:#4b3d60;font-variant-numeric:tabular-nums}.gd-plot .gd-axis{font-size:10px}.gd-plot .gd-small{font-size:10px}
      .gd-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#7f718d;margin-bottom:8px}.gd-legend span{display:inline-flex;align-items:center;gap:5px}.gd-legend i{display:inline-block;width:8px;height:8px;border-radius:3px}
      .gd-note{margin-top:10px;font-size:11px;line-height:1.65;color:#8d7e99}.gd-share{display:flex;align-items:center;gap:12px;min-height:255px}.gd-share svg{width:55%;max-width:290px;flex:none}.gd-share-key{display:grid;gap:16px;flex:1;min-width:0}.gd-share-line{display:grid;grid-template-columns:8px 1fr auto;gap:7px;align-items:center;font-size:12px;color:#7c6d8b}.gd-share-line b{color:#4e3c67;font-size:14px}.gd-share-line small{grid-column:2/-1;font-size:11px;color:#9989a8}.gd-share-line i{width:8px;height:8px;border-radius:50%}
      .gd-status{display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px;font-size:11px;color:#8c7e96}.gd-plot [data-tip]{cursor:help;outline:none}.gd-plot [data-tip]:hover,.gd-plot [data-tip]:focus{filter:brightness(1.1) drop-shadow(0 2px 3px #8f71bb22)}
      .gd-depth-label{display:inline-flex;align-items:center;gap:5px;font-size:9px;color:#a18aaf;letter-spacing:.8px;margin-bottom:8px}.gd-depth-label:before{content:'◈';font-size:13px;color:#69cebd}
      @media(max-width:850px){.gd-grid{grid-template-columns:1fr}.gd-card{padding:20px}.gd-head h3{font-size:15px}.gd-share{min-height:230px}}
      @media(max-width:430px){.gd-share{gap:10px;flex-wrap:wrap;justify-content:center}.gd-share svg{width:240px;max-width:90%}.gd-share-key{width:100%;min-width:140px;gap:12px}.gd-head{flex-wrap:wrap}.gd-share-line{font-size:12px}.gd-card{padding:17px}.gd-status{font-size:10px}}
      @media print{.gd-grid{grid-template-columns:1fr 1fr}.gd-card{break-inside:avoid;box-shadow:none;background:#fff}.gd-plot svg{max-height:320px}.gd-card:before{display:none}}
    `;document.head.append(st);
  }
  function prism(x,y,w,h,color,text,orientation='horizontal',d=6){
    if(w<=0||h<=0)return `<circle cx="${orientation==='vertical'?x+w/2:x}" cy="${y+h/2}" r="2.5" fill="#fff" stroke="${color}" ${tip(text)}/>`;
    return `<g class="gd-prism" data-depth-bar="${orientation}" ${tip(text)}><title>${esc(text)}</title><path class="depth-face" aria-hidden="true" d="M${x},${y}l${d},${-d}h${w}l${-d},${d}Z" fill="${shade(color,1.16)}"/><path class="depth-face" aria-hidden="true" d="M${x+w},${y}l${d},${-d}v${h}l${-d},${d}Z" fill="${shade(color,.73)}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${color}"/></g>`;
  }
  function bars(groups,series,unit,title,w=500){
    const h=286,l=w<380?99:108,r=59,t=25,b=34,cw=w-l-r,ch=h-t-b;
    const known=series.flatMap(s=>s.values).filter(valid);if(!known.length)return '';
    const max=Math.max(...known,0),ceil=max>0?max*1.08:1;let s='';
    for(let j=0;j<=3;j++){const x=l+cw*j/3;s+=`<line x1="${x}" y1="${t}" x2="${x}" y2="${h-b}" stroke="#ece5f3"/><text class="gd-axis" x="${x}" y="${h-10}" text-anchor="middle">${fmt(ceil*j/3)}</text>`;}
    const row=ch/groups.length,bh=Math.min(19,(row-22)/series.length);
    groups.forEach((g,i)=>{const middle=t+row*(i+.5);s+=`<text x="${l-11}" y="${middle+4}" text-anchor="end">${esc(labels[g]||g)}</text>`;
      series.forEach((ss,j)=>{const v=ss.values[i],y=middle+(j-(series.length-1)/2)*(bh+9),ww=v==null?0:cw*v/ceil,color=ss.color||(series.length===1?sexColor(g):colors[j%3]);
        if(v==null){s+=`<text x="${l+7}" y="${y+4}" ${tip((labels[g]||g)+' · '+ss.label+': chưa ghi nhận')}>—</text>`;return;}
        s+=prism(l,y-bh/2,ww,bh,color,(labels[g]||g)+' · '+ss.label+': '+fmt(v)+' '+unit);
        s+=`<text class="gd-value" x="${l+ww+11}" y="${y+4}">${fmt(v)}</text>`;
      });
    });return svg(s,w,h,title);
  }
  function heatmap(rows,ageLabels,sexLabels,field,unit,title,w=500){
    const h=300,l=53,r=12,t=39,b=18,cw=(w-l-r)/sexLabels.length,rh=(h-t-b)/Math.max(ageLabels.length,1),d=4;
    const matrix=ageLabels.map(age=>sexLabels.map(sex=>aggregate(rows.filter(r=>r.age===age&&r.sex===sex))[field]));
    const known=matrix.flat().filter(valid);if(!known.length)return '';
    const max=Math.max(...known,1);let s='';
    sexLabels.forEach((sex,j)=>s+=`<text class="${w<380?'gd-small':''}" x="${l+cw*(j+.5)}" y="18" text-anchor="middle">${esc(labels[sex]||sex)}</text>`);
    ageLabels.forEach((age,i)=>{s+=`<text x="${l-9}" y="${t+rh*(i+.5)+4}" text-anchor="end">${age.replace('-','–')}</text>`;sexLabels.forEach((sex,j)=>{const v=matrix[i][j],x=l+j*cw+2,y=t+i*rh+2,ww=cw-9,hh=rh-9,alpha=v==null?0:.12+.78*v/max;
      if(v==null){s+=`<text x="${x+ww/2}" y="${y+hh/2+4}" text-anchor="middle">—</text>`;return;}
      s+=`<g class="gd-tile" data-motion="tile" ${tip(age+' · '+labels[sex]+': '+fmt(v)+' '+unit)}><title>${esc(age+' · '+labels[sex]+': '+fmt(v)+' '+unit)}</title><path class="depth-face" aria-hidden="true" d="M${x},${y+hh}h${ww}l${d},${-d}v${d+4}l${-d},${d}h${-ww}Z" fill="#1b7c70" opacity="${Math.max(.2,alpha*.65)}"/><rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="5" fill="rgba(65,221,191,${alpha})"/><path class="depth-decoration" aria-hidden="true" d="M${x+3},${y+1}h${ww-6}" stroke="white" stroke-opacity=".6"/><text x="${x+ww/2}" y="${y+hh/2+4}" text-anchor="middle" style="fill:${alpha>.55?'white':'#79678d'};font-weight:600">${fmt(v)}</text></g>`;
    });});return svg(s,w,h,title);
  }
  function ringPath(start,end,dy=0){
    const points=[],cx=145,cy=103+dy,rx=120,ry=72,irx=78,iry=46.8,steps=Math.max(2,Math.ceil((end-start)/3));
    for(let i=0;i<=steps;i++){const a=(start+(end-start)*i/steps)*Math.PI/180;points.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}
    for(let i=steps;i>=0;i--){const a=(start+(end-start)*i/steps)*Math.PI/180;points.push([cx+irx*Math.cos(a),cy+iry*Math.sin(a)]);}
    return points.map((p,i)=>(i?'L':'M')+p.map(n=>n.toFixed(3)).join(',')).join('')+'Z';
  }
  function donut(stats,title){
    const total=stats.reduce((s,g)=>s+(g.impressions||0),0);let angle=-90;
    const segments=stats.filter(g=>valid(g.impressions)&&g.impressions>0).map(g=>{const start=angle;angle+=total?360*g.impressions/total:0;return {g,start,end:angle,color:sexColor(g.sex)};});
    let s='<ellipse class="depth-decoration" aria-hidden="true" cx="148" cy="198" rx="116" ry="14" fill="#41ddbf" opacity=".13"/>';
    if(!segments.length){for(let d=21;d>=0;d-=3)s+=`<path ${d?'class="depth-face" aria-hidden="true"':''} d="${ringPath(-90,270,d)}" fill="${d?'#d9d0e5':'#eee8f5'}"/>`;}
    for(let d=21;d>=3;d-=3)segments.forEach(q=>{s+=`<path class="depth-face" d="${ringPath(q.start,q.end,d)}" fill="${shade(q.color,.65+(21-d)*.006)}" aria-hidden="true"/>`;});
    segments.forEach(q=>{const text=labels[q.g.sex]+': '+count(q.g.impressions)+' lượt hiển thị · '+fmt(ratio(q.g.impressions,total))+'%';s+=`<g data-depth-ring="true" ${tip(text)}><title>${esc(text)}</title><path d="${ringPath(q.start,q.end)}" fill="${q.color}" stroke="#fff" stroke-opacity=".6" stroke-width=".7"/></g>`;});
    s+=`<text x="145" y="101" text-anchor="middle" class="gd-value" style="font-size:27px">${count(total)}</text><text x="145" y="121" text-anchor="middle" style="font-size:11px">lượt hiển thị</text>`;
    return `<div class="gd-share">${svg(s,290,230,title)}<div class="gd-share-key">${stats.map(g=>`<div class="gd-share-line"><i style="background:${sexColor(g.sex)}"></i><span>${labels[g.sex]}</span><b>${fmt(ratio(g.impressions,total))}%</b><small>${count(g.impressions)} lượt hiển thị</small></div>`).join('')}</div></div>`;
  }
  function ageColumns(rows,ageLabels,title,w=500){
    const stats=ageLabels.map(age=>({age,...aggregate(rows.filter(r=>r.age===age))}));
    const known=stats.map(a=>a.impressions).filter(valid);if(!known.length)return '';
    const h=300,l=43,r=14,t=37,b=38,cw=w-l-r,ch=h-t-b,base=h-b,max=Math.max(...known,0),ceil=max?max*1.14:1,step=cw/stats.length,bw=Math.min(46,step*.62);
    let s='';for(let j=0;j<=3;j++){const y=base-ch*j/3;s+=`<line x1="${l}" y1="${y}" x2="${w-r}" y2="${y}" stroke="#ece5f3"/><text class="gd-axis" x="${l-7}" y="${y+4}" text-anchor="end">${count(ceil*j/3)}</text>`;}
    s+=`<path class="depth-decoration" aria-hidden="true" d="M${l},${base}h${cw}l7,-5h${-cw}Z" fill="#e9e1f3"/>`;
    stats.forEach((a,i)=>{const x=l+step*(i+.5)-bw/2,v=a.impressions,hh=v==null?0:ch*v/ceil,y=base-hh,color=['#41ddbf','#78a8ff','#ffc078','#b4a1fa','#ed9fc1','#91ca91'][i%6];
      if(v!=null){s+=prism(x,y,bw,hh,color,a.age+' tuổi: '+count(v)+' lượt hiển thị','vertical',Math.min(7,bw*.18));s+=`<text class="gd-value ${w<380?'gd-small':''}" x="${x+bw/2+3}" y="${y-12}" text-anchor="middle">${count(v)}</text>`;}
      s+=`<text class="${w<380?'gd-small':''}" x="${x+bw/2+2}" y="${base+24}" text-anchor="middle">${a.age.replace('-','–')}</text>`;
    });return svg(s,w,h,title);
  }
  function pyramid(rows,ageLabels,title,w=500){
    const groups=ageLabels.map(age=>({age,values:sexes.map(sex=>aggregate(rows.filter(r=>r.age===age&&r.sex===sex)).impressions)}));
    const known=groups.flatMap(g=>g.values).filter(valid);if(!known.length)return '';
    const h=330,left=12,right=68,center=w*.46,gap=54,half=Math.min(center-gap/2-left,w-right-center-gap/2-6),max=Math.max(...groups.flatMap(g=>g.values.slice(0,2)).filter(valid),0),scale=max?half/max:0,t=54,b=29,row=(h-t-b)/groups.length,bh=Math.min(21,row*.43),unknownX=w-30;
    let s=`<text x="${center-gap/2-half/2}" y="22" text-anchor="middle" style="fill:${colors[0]};font-weight:650">Nam</text><text x="${center+gap/2+half/2}" y="22" text-anchor="middle" style="fill:${colors[1]};font-weight:650">Nữ</text><text class="gd-small" x="${unknownX}" y="16" text-anchor="middle" style="fill:#ffc078">Không</text><text class="gd-small" x="${unknownX}" y="29" text-anchor="middle" style="fill:#ffc078">xác định</text>`;
    s+=`<line x1="${center-gap/2}" y1="${t-10}" x2="${center-gap/2}" y2="${h-b}" stroke="#e6deef"/><line x1="${center+gap/2}" y1="${t-10}" x2="${center+gap/2}" y2="${h-b}" stroke="#e6deef"/><line x1="${w-right+8}" y1="${t-10}" x2="${w-right+8}" y2="${h-b}" stroke="#eee7f4"/>`;
    groups.forEach((g,i)=>{const y=t+row*i+5;
      s+=`<text class="gd-small" x="${center}" y="${y+bh/2+4}" text-anchor="middle">${g.age.replace('-','–')}</text>`;
      for(let j=0;j<2;j++){const v=g.values[j],ww=v==null?0:v*scale,x=j?center+gap/2:center-gap/2-ww,c=colors[j];
        if(v!=null){s+=prism(x,y,ww,bh,c,g.age+' · '+labels[sexes[j]]+': '+count(v)+' lượt hiển thị','horizontal',3);s+=`<text class="gd-small gd-value" x="${j?center+gap/2:center-gap/2}" y="${y+bh+13}" text-anchor="${j?'start':'end'}">${count(v)}</text>`;}else s+=`<text x="${j?center+gap/2+7:center-gap/2-7}" y="${y+bh/2+4}" text-anchor="${j?'start':'end'}">—</text>`;
      }
      const u=g.values[2];s+=`<text class="gd-value gd-small" x="${unknownX}" y="${y+bh/2+4}" text-anchor="middle" ${tip(g.age+' · Không xác định: '+count(u)+' lượt hiển thị')}>${count(u)}</text>`;
    });s+=`<text class="gd-axis" x="${w/2}" y="${h-5}" text-anchor="middle">Nam và nữ dùng cùng thang đo · lượt hiển thị</text>`;return svg(s,w,h,title);
  }
  function render({from,to,age='all'}={}){
    const host=document.getElementById('genderCharts'),section=document.getElementById('genderSection');
    if(!host)return {charts:0,rows:0,genders:[]};style();
    const rows=GENDER_SOURCE.rows.filter(r=>(!from||r.date>=from)&&(!to||r.date<=to)&&(age==='all'||!age||r.age===age));
    const total=aggregate(rows),groups=sexes.filter(sex=>rows.some(r=>r.sex===sex)),stats=groups.map(sex=>({sex,...aggregate(rows.filter(r=>r.sex===sex))})),ageLabels=ages.filter(a=>rows.some(r=>r.age===a));
    if(!rows.length){host.innerHTML='';if(section)section.hidden=true;return {charts:0,rows:0,genders:[],impressions:null,clicks:null};}
    if(section)section.hidden=false;
    const configs=[];
    if(stats.some(g=>g.impressions!=null))configs.push({title:'Cơ cấu giới tính',unit:'% hiển thị',kind:'donut',note:'Tỷ trọng lượt hiển thị theo giới tính. “Không xác định” được giữ đúng theo nguồn.'});
    if(rows.some(r=>valid(r.impressions))){
      configs.push({title:'Phân bố theo độ tuổi',unit:'lượt hiển thị',kind:'ageColumns',note:'Chiều cao mặt trước biểu thị số lượt hiển thị; tuổi được tổng hợp từ cùng báo cáo giới tính.'});
      configs.push({title:'Tháp tuổi × giới tính',unit:'lượt hiển thị',kind:'pyramid',note:'Đối chiếu nam và nữ trên cùng thang đo. Cột bên phải giữ đầy đủ nhóm chưa xác định giới tính.'});
      configs.push({title:'Độ tuổi × giới tính · hiển thị',unit:'lượt',kind:'matrix',field:'impressions',note:'Độ đậm thể hiện số lượt hiển thị; các ô có chiều sâu trang trí bằng nhau. Dấu — là thiếu dữ liệu.'});
    }
    const clicks=[{label:'Click tất cả',values:stats.map(g=>g.clicks)},{label:'Click liên kết',values:stats.map(g=>g.linkClicks)}].filter(s=>s.values.some(valid));
    if(clicks.length)configs.push({title:'Hành động click theo giới tính',unit:'lượt',kind:'bars',series:clicks,note:'Các loại click được báo riêng; không cộng lại thành số người.'});
    const ctr=[{label:'CTR tất cả',values:stats.map(g=>g.ctrAll)},{label:'CTR liên kết',values:stats.map(g=>g.ctrLink)}].filter(s=>s.values.some(valid));
    if(ctr.length)configs.push({title:'Mức phản hồi qua click',unit:'%',kind:'bars',series:ctr,note:'Click tương ứng / lượt hiển thị của cùng giới tính × 100%.'});
    if(stats.some(g=>valid(g.ctrAll)))configs.push({title:'Độ tuổi × giới tính · CTR',unit:'%',kind:'matrix',field:'ctrAll',note:'Tỷ lệ click của từng ô tuổi và giới tính; được tính lại từ tổng click và tổng hiển thị.'});
    const messages={label:'Bắt đầu hội thoại',values:stats.map(g=>g.messages)};
    if(messages.values.some(valid))configs.push({title:'Hội thoại theo giới tính',unit:'lượt',kind:'bars',series:[messages],note:'Chỉ cộng cùng loại “Lượt bắt đầu cuộc trò chuyện qua tin nhắn”; ô trống giữ dấu —.'});
    const activeDates=[...new Set(rows.map(r=>r.date))].sort();
    host.innerHTML='<div class="gd-status"><span>'+configs.length+' biểu đồ nhân khẩu học · Gộp mọi chiến dịch</span><span>Ngày có dữ liệu: '+activeDates[0]+' – '+activeDates.at(-1)+'</span></div><div class="gd-grid">'+configs.map((c,i)=>`<article class="gd-card" data-gender-chart="${i}" data-chart-kind="${c.kind}"><span class="gd-depth-label">GÓC NHÌN NHÂN KHẨU HỌC</span><div class="gd-head"><h3>${esc(c.title)}</h3><span class="gd-unit">${c.unit}</span></div>${c.series?'<div class="gd-legend">'+c.series.map((ss,j)=>`<span><i style="background:${colors[j%3]}"></i>${ss.label}</span>`).join('')+'</div>':''}<div class="gd-plot" id="gd-plot-${i}"></div><p class="gd-note">${esc(c.note)}</p></article>`).join('')+'</div>';
    configs.forEach((c,i)=>{const plot=document.getElementById('gd-plot-'+i),w=Math.max(310,plot.clientWidth);plot.innerHTML=c.kind==='donut'?donut(stats,c.title):c.kind==='ageColumns'?ageColumns(rows,ageLabels,c.title,w):c.kind==='pyramid'?pyramid(rows,ageLabels,c.title,w):c.kind==='matrix'?heatmap(rows,ageLabels,groups,c.field,c.unit,c.title,w):bars(groups,c.series,c.unit,c.title,w);});
    return {charts:configs.length,rows:rows.length,genders:groups,ageGroups:ageLabels,impressions:total.impressions,clicks:total.clicks,linkClicks:total.linkClicks,reachCumulative:total.reach,messages:total.messages,stats,period:GENDER_SOURCE.period};
  }
  function exportRows({from,to,age='all'}={}){const rows=GENDER_SOURCE.rows.filter(r=>(!from||r.date>=from)&&(!to||r.date<=to)&&(age==='all'||r.age===age));return [['Giới tính','Hiển thị','Click tất cả','Click liên kết','CTR tất cả (%)','CTR liên kết (%)','Hội thoại'],...sexes.filter(s=>rows.some(r=>r.sex===s)).map(s=>{const a=aggregate(rows.filter(r=>r.sex===s));return [labels[s],a.impressions,a.clicks,a.linkClicks,a.ctrAll,a.ctrLink,a.messages];})];}
  window.GenderCharts={render,aggregate,exportRows};
})();

(() => {
  'use strict';
  const COLORS=['#41ddbf','#78a8ff','#ffc078','#b4a1fa','#ed9fc1','#91ca91'];
  const SEXES=['male','female','unknown'];
  const SEX_LABELS={male:'Nam',female:'Nữ',unknown:'Không xác định'};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid=v=>typeof v==='number'&&Number.isFinite(v);
  const nf=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
  const count=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0});
  const fmt=v=>v==null?'—':nf.format(v);
  const sum=(rows,key)=>{const values=rows.map(r=>r[key]).filter(valid);return values.length?values.reduce((a,b)=>a+b,0):null;};
  const ratio=(a,b,k=100)=>valid(a)&&valid(b)&&b>0?a/b*k:null;
  const tip=t=>`data-tip="${esc(t)}" tabindex="0"`;
  const ageLabel=s=>String(s).replace('-','–');
  const svg=(s,w,h,title)=>`<svg class="ep-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${s}</svg>`;
  function genderRows({from,to,age='all'}={}){return GENDER_SOURCE.rows.filter(r=>(!from||r.date>=from)&&(!to||r.date<=to)&&(!age||age==='all'||r.age===age));}
  function genderAggregate(rows){const conversations=rows.filter(r=>r.resultType==='Lượt bắt đầu cuộc trò chuyện qua tin nhắn');return {n:rows.length,impressions:sum(rows,'impressions'),clicks:sum(rows,'clicks'),links:sum(rows,'linkClicks'),messages:sum(conversations,'result')};}
  function niceMax(v){if(!(v>0))return 1;const raw=v/4,base=Math.pow(10,Math.floor(Math.log10(raw))),q=raw/base,step=(q<=1?1:q<=2?2:q<=2.5?2.5:q<=5?5:10)*base;return Math.ceil(v/step)*step;}
  function bar(x,y,w,h,color,text){
    if(w===0)return `<circle cx="${x}" cy="${y+h/2}" r="2.5" fill="white" stroke="${color}" stroke-width="1.5" ${tip(text)}/>`;
    const d=Math.min(4,h*.2);
    return `<g data-depth-bar="horizontal" ${tip(text)}><title>${esc(text)}</title><path class="depth-face" aria-hidden="true" d="M${x},${y}l${d},${-d}h${w}l${-d},${d}Z" fill="${color}" opacity=".4"/><path class="depth-face" aria-hidden="true" d="M${x+w},${y}l${d},${-d}v${h}l${-d},${d}Z" fill="${color}" opacity=".7"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}"/></g>`;
  }
  function bars(items,w,title,unit,{labelWidth=65,lollipop=false}={}){
    const list=items.filter(i=>valid(i.value));if(!list.length)return '';
    const l=labelWidth,r=63,t=22,b=33,row=38,h=Math.max(235,list.length*row+t+b),cw=w-l-r,ch=h-t-b,max=niceMax(Math.max(...list.map(i=>i.value))*1.04),rh=ch/list.length;
    let s='';
    for(let j=0;j<=4;j++){const x=l+cw*j/4;s+=`<line x1="${x}" y1="${t}" x2="${x}" y2="${h-b}" class="ep-gridline" stroke="#e8edf2"/><text x="${x}" y="${h-8}" text-anchor="middle" class="ep-axis" font-size="12">${fmt(max*j/4)}</text>`;}
    list.forEach((a,i)=>{const y=t+rh*(i+.5),bw=cw*a.value/max,color=a.color||COLORS[0],hover=a.tooltip||`${a.label}: ${fmt(a.value)} ${unit}\n${count.format(a.numerator)} / ${count.format(a.denominator)}`;
      s+=`<text x="${l-10}" y="${y+4}" text-anchor="end" class="ep-axis" font-size="12">${esc(a.label)}</text>`;
      if(lollipop)s+=`<path d="M${l},${y}H${l+bw}" stroke="${color}" stroke-width="3" stroke-opacity=".3"/><circle cx="${l+bw}" cy="${y}" r="6" fill="${color}" ${tip(hover)}><title>${esc(hover)}</title></circle>`;
      else s+=bar(l,y-8,bw,16,color,hover);
      s+=`<text x="${l+bw+10}" y="${y+4}" class="ep-value" font-size="12" font-weight="650">${fmt(a.value)}</text>`;
    });
    return svg(s,w,h,title);
  }
  function matrix(grid,w,title,{index=false}={}){
    const rows=grid.rows.filter(r=>r.values.some(v=>valid(v.value)));if(!rows.length)return '';
    const l=62,r=12,t=38,b=13,cw=(w-l-r)/grid.columns.length,rh=40,h=t+rows.length*rh+b;
    const max=Math.max(...rows.flatMap(r=>r.values.map(v=>v.value)).filter(valid),1);let s='';
    grid.columns.forEach((c,j)=>{const x=l+cw*(j+.5);s+=c==='Không xác định'?`<text x="${x}" y="13" text-anchor="middle" class="ep-axis" font-size="12"><tspan x="${x}">Không</tspan><tspan x="${x}" dy="14">xác định</tspan></text>`:`<text x="${x}" y="21" text-anchor="middle" class="ep-axis" font-size="12">${esc(c)}</text>`;});
    rows.forEach((row,i)=>{const y=t+i*rh;s+=`<text x="${l-9}" y="${y+rh/2+4}" text-anchor="end" class="ep-axis" font-size="12">${esc(row.label)}</text>`;
      row.values.forEach((v,j)=>{const x=l+j*cw,known=valid(v.value),high=known&&index&&v.value>=100,color=index?(high?'#78a8ff':'#41ddbf'):'#41ddbf',a=known?(index?Math.min(.88,.12+Math.abs(v.value-100)/Math.max(100,max-100)*.7):.12+.76*v.value/max):0;
        s+=`<g data-motion="tile" ${known?tip(v.tooltip):''}><rect x="${x+3}" y="${y+3}" width="${cw-6}" height="${rh-6}" rx="6" fill="${known?color:'#f3f5f7'}" fill-opacity="${known?a:1}"/><text x="${x+cw/2}" y="${y+rh/2+4}" text-anchor="middle" class="${known?'ep-value':'ep-axis'}" font-size="12" style="fill:${known&&a>.6?'#fff':'#243448'}">${fmt(v.value)}</text></g>`;
      });
    });
    return svg(s,w,h,title);
  }
  function build(rows,filters={}){
    const all=DB.aggregate(rows),ages=DB.byAge(rows).filter(a=>a.n>0),gRows=genderRows(filters),gAll=genderAggregate(gRows),genders=SEXES.filter(sex=>gRows.some(r=>r.sex===sex)).map(sex=>({sex,...genderAggregate(gRows.filter(r=>r.sex===sex))}));
    const ageItems=(num,den,k=100)=>ages.map((a,i)=>({label:ageLabel(a.age),value:ratio(a.s[num],a.s[den],k),numerator:a.s[num],denominator:a.s[den],color:COLORS[i%COLORS.length]})).filter(a=>valid(a.value));
    const engagement=ageItems(55,10,1000);
    const exploration=[...ageItems(41,30).map(a=>({...a,label:a.label,color:COLORS[0]})),...genders.map(g=>({label:SEX_LABELS[g.sex],value:ratio(g.links,g.clicks),numerator:g.links,denominator:g.clicks,color:COLORS[1]})).filter(a=>valid(a.value))];
    const retention=ageItems(23,29);
    const actionDefs=[['Click ảnh',31],['Cảm xúc',50],['Lưu bài',44],['Bình luận',45]];
    const actions=actionDefs.map(([label,idx],i)=>({label,value:ratio(all.s[idx],all.s[10],1000),numerator:all.s[idx],denominator:all.s[10],color:COLORS[i],tooltip:`${label}: ${fmt(ratio(all.s[idx],all.s[10],1000))} lượt / 1.000 hiển thị\n${fmt(all.s[idx])} lượt được ghi nhận trên ${fmt(all.s[10])} hiển thị`})).filter(a=>valid(a.value));
    const conversations=genders.map((g,i)=>({label:SEX_LABELS[g.sex],value:ratio(g.messages,g.impressions,1000),numerator:g.messages,denominator:g.impressions,color:COLORS[i],tooltip:`${SEX_LABELS[g.sex]}: ${fmt(ratio(g.messages,g.impressions,1000))} hội thoại / 1.000 hiển thị\n${fmt(g.messages)} hội thoại / ${fmt(g.impressions)} hiển thị`})).filter(a=>valid(a.value));
    const poolCTR=ratio(gAll.clicks,gAll.impressions);
    const gAges=DB.ages.filter(age=>gRows.some(r=>r.age===age));
    const indexGrid={columns:genders.map(g=>SEX_LABELS[g.sex]),rows:gAges.map(age=>({label:ageLabel(age),values:genders.map(g=>{const a=genderAggregate(gRows.filter(r=>r.age===age&&r.sex===g.sex)),ctr=ratio(a.clicks,a.impressions),value=ratio(ctr,poolCTR);return {value,tooltip:`${ageLabel(age)} · ${SEX_LABELS[g.sex]}\nChỉ số phản hồi: ${fmt(value)} (100 = mức chung)\n${fmt(a.clicks)} click / ${fmt(a.impressions)} hiển thị · CTR ${fmt(ctr)}%`};})}))};
    const dates=[...new Set(rows.map(r=>r[79]))].sort().filter(day=>{const a=DB.aggregate(rows.filter(r=>r[79]===day));return ratio(a.s[30],a.s[10])!=null;});
    const rhythm={columns:dates.map(d=>d.slice(8)+'/'+d.slice(5,7)),rows:ages.map(a=>({label:ageLabel(a.age),values:dates.map(day=>{const x=DB.aggregate(rows.filter(r=>r[1]===a.age&&r[79]===day)),value=ratio(x.s[30],x.s[10]);return {value,tooltip:`${ageLabel(a.age)} · ${day}\nCTR tất cả: ${fmt(value)}%\n${fmt(x.s[30])} click / ${fmt(x.s[10])} hiển thị`};})}))};
    const configs=[];
    if(engagement.length)configs.push({id:'engagement-density',title:'Tương tác sau mỗi 1.000 hiển thị',unit:'lượt / 1.000',kind:'bars',items:engagement,note:'So sánh mức tương tác giữa các độ tuổi sau khi điều chỉnh quy mô phân phối. Tương tác bài / hiển thị × 1.000.'});
    if(retention.length)configs.push({id:'play-attention',title:'Bao nhiêu lượt phát đạt 3 giây?',unit:'% lượt phát',kind:'bars',items:retention,note:'Video ≥3 giây / lượt phát × 100%. Mẫu số là lượt phát; không phải tỷ lệ người quan tâm hay thời gian xem của từng người.'});
    if(indexGrid.rows.some(r=>r.values.some(v=>valid(v.value))))configs.push({id:'response-index',title:'Nhóm nào phản hồi cao hơn mức chung?',unit:'100 = CTR chung',kind:'matrix',wide:true,index:true,grid:indexGrid,note:'CTR của từng ô tuổi × giới tính / CTR chung × 100. Chỉ số trên 100 nghĩa là tỷ lệ click cao hơn mức chung trong bộ lọc; chưa chứng minh nhu cầu học.',legend:'Xanh ngọc: dưới mức chung · Xanh lam: bằng hoặc trên mức chung'});
    if(exploration.length)configs.push({id:'link-exploration',title:'Click nào dẫn tới liên kết?',unit:'% click tất cả',kind:'bars',items:exploration,labelWidth:112,note:'Click liên kết / click tất cả × 100%. Tuổi và giới tính dùng tử số, mẫu số trong từng nguồn; đây không phải tỷ lệ chuyển đổi khách hàng.',legend:'Xanh ngọc: theo độ tuổi · Xanh lam: theo giới tính'});
    if(actions.length)configs.push({id:'specific-actions',title:'Những dấu hiệu quan tâm cụ thể',unit:'lượt / 1.000',kind:'bars',items:actions,labelWidth:90,lollipop:true,note:'Cảm xúc, click ảnh, lưu bài và bình luận được đọc riêng. Không cộng các hành động thành số người; lưu và bình luận có ít lượt nên cần thận trọng.'});
    if(rhythm.rows.some(r=>r.values.some(v=>valid(v.value))))configs.push({id:'response-rhythm',title:'Ngày nào từng độ tuổi có phản hồi?',unit:'CTR tất cả (%)',kind:'matrix',wide:true,grid:rhythm,scroll:true,note:'Click / hiển thị trong cùng ngày và độ tuổi × 100%. Chỉ các ngày tính được tỷ lệ; dấu — là không đủ mẫu số. Chưa đủ để kết luận lịch sinh hoạt hay thời điểm tối ưu.'});
    if(conversations.length)configs.push({id:'conversation-density',title:'Mức chủ động nhắn tin theo giới tính',unit:'lượt / 1.000',kind:'bars',items:conversations,labelWidth:112,note:`${fmt(gAll.messages)} hội thoại được ghi nhận trong phạm vi lọc. Tính theo 1.000 hiển thị để so sánh quy mô; mẫu nhỏ, không suy ra mức tin tưởng hay ý định đăng ký.`});
    return {all,ages,gAll,genders,configs,engagement,retention,exploration,actions,conversations,indexGrid,rhythm,poolCTR};
  }
  function mapData(data){
    const {all,ages}=data,s=all.s,items=[];
    const shortRate=ratio(s[23],s[29]),completeRate=ratio(s[68],s[29]),linkShare=ratio(s[41],s[30]);
    const metric=(value,unit,label,detail)=>valid(value)?{value,unit,label,detail}:null;
    if(shortRate!=null)items.push({
      id:'attention',label:'Chú ý',title:'Điều gì khiến họ dừng xem?',
      metrics:[metric(shortRate,'%','Lượt phát đạt 3 giây',`${fmt(s[23])} / ${fmt(s[29])} lượt phát`),metric(completeRate,'%','Lượt phát đạt mốc xem hết',`${fmt(s[68])} / ${fmt(s[29])} lượt phát`)].filter(Boolean),
      evidence:`Có ${fmt(s[23])} lượt xem từ 3 giây trên ${fmt(s[29])} lượt phát.${completeRate!=null?' Mốc xem hết ghi nhận '+fmt(s[68])+' lượt.':''} Đây là các mốc xem của nội dung, chưa phải số người quan tâm.`,
      reading:'Tách khả năng thu hút ở phần mở đầu khỏi mức xem sâu. Người lướt qua có thể do nội dung, hoàn cảnh xem hoặc cách phân phối; chưa thể kết luận họ không có nhu cầu học.',
      hypothesis:'Cảnh học thật, lời giảng dễ hiểu hoặc một tình huống lái xe cụ thể có thể giúp người xem nhận ra điều hữu ích nhanh hơn. Cần hỏi họ để biết chi tiết nào thực sự có ý nghĩa.',
      questions:['Kể lại lần gần nhất bạn dừng xem một nội dung học lái xe. Điều gì khiến bạn chú ý?','Trong phần mở đầu vừa xem, bạn nghĩ nội dung này sẽ giúp mình điều gì?','Bạn muốn xem tiếp hay dừng lại ở đoạn nào? Vì sao?'],
      next:'Thử hai cách mở đầu cho cùng một nội dung, giữ phần sau tương đương. Cho người học xem theo thứ tự khác nhau và hỏi lại điều họ nhớ.',
      signals:['Người học diễn đạt được điều hữu ích bằng lời của mình, không cần người phỏng vấn gợi ý.','Ghi lại chi tiết họ chủ động nhắc đến và lý do muốn xem tiếp hoặc bỏ qua.'],
      interviewNote:'Không hỏi “Bạn có thích video này không?” ngay từ đầu. Quan sát lựa chọn trước, rồi hỏi lý do; giữ cả ý kiến không đồng thuận.',indices:[23,29,68]
    });
    if(linkShare!=null)items.push({
      id:'explore',label:'Tìm hiểu',title:'Họ đang muốn biết thêm điều gì?',
      metrics:[metric(linkShare,'%','Click dẫn tới liên kết',`${fmt(s[41])} / ${fmt(s[30])} click tất cả`),metric(ratio(s[41],s[10]),'%','Click liên kết / hiển thị',`${fmt(s[41])} / ${fmt(s[10])} lượt hiển thị`)].filter(Boolean),
      evidence:`Có ${fmt(s[41])} click liên kết trong ${fmt(s[30])} click tất cả. Một click chưa xác nhận người xem đã đọc thông tin, hiểu nội dung hoặc đăng ký.`,
      reading:'Tỷ trọng click liên kết cho thấy cách phản hồi được ghi nhận. Để hiểu họ tìm gì và còn vướng ở đâu, cần quan sát việc tìm thông tin và nghe họ mô tả.',
      hypothesis:'Người xem có thể muốn hình dung lộ trình học, lịch học hoặc cách buổi thực hành diễn ra trước khi tìm hiểu tiếp. Đây là các hướng hỏi, chưa phải nhu cầu đã được chứng minh.',
      questions:['Điều gì khiến bạn bắt đầu tìm hiểu việc học lái xe vào thời điểm này?','Khi mở một nội dung của trung tâm, thông tin đầu tiên bạn muốn tìm là gì?','Chỉ giúp tôi phần bạn chưa hiểu hoặc muốn kiểm tra thêm. Bạn sẽ tìm ở đâu?'],
      next:'Cho người học tự tìm một thông tin họ quan tâm trên nội dung hiện tại. Sau đó thử bản sắp xếp lại thông tin và mời họ làm cùng nhiệm vụ.',
      signals:['Quan sát họ tìm đúng thông tin mà không cần chỉ đường hay giải thích hộ.','Ghi lại cách họ gọi tên thông tin, chỗ phải đọc lại và câu hỏi vẫn còn sau khi xem.'],
      interviewNote:'Để người học chọn điều cần tìm trước; đừng đưa sẵn danh sách nhu cầu để họ chỉ đồng ý. Không dùng click như bằng chứng đã hiểu.',indices:[41,30,10]
    });
    if(s[61]!=null){
      const best=ages.filter(a=>a.s[61]!=null).sort((a,b)=>b.s[61]-a.s[61])[0];
      const conversationRate=ratio(s[61],s[10],1000);
      items.push({
        id:'connection',label:'Kết nối',title:'Điều gì giúp họ sẵn sàng hỏi?',
        metrics:[metric(s[61],'lượt','Bắt đầu hội thoại','Tổng lượt trong phạm vi đang lọc'),metric(conversationRate,'lượt','Hội thoại / 1.000 hiển thị',`${fmt(s[61])} / ${fmt(s[10])} × 1.000`)].filter(Boolean),
        evidence:`Có ${fmt(s[61])} lượt bắt đầu hội thoại.${best&&s[61]>0?' Tuổi '+ageLabel(best.age)+' đóng góp '+fmt(best.s[61])+'/'+fmt(s[61])+' lượt.':''} Số lượt này chưa cho biết nội dung câu hỏi, cảm xúc hoặc ý định đăng ký.`,
        reading:'Hội thoại là tín hiệu chủ động kết nối. Với lượng ghi nhận còn ít, nên tìm hiểu từng trải nghiệm cụ thể; không suy ra tính cách hay mức tin tưởng từ tuổi và giới tính.',
        hypothesis:'Một lời mời hỏi rõ ràng và thông tin về người sẽ hỗ trợ có thể giúp việc bắt đầu trò chuyện dễ hơn. Cũng có thể người xem chỉ cần một thông tin ngắn; cần lắng nghe cả hai khả năng.',
      questions:['Trước lần liên hệ gần nhất với một trung tâm, bạn muốn hỏi điều gì và đã làm gì trước đó?','Có điều gì khiến bạn ngần ngại đặt câu hỏi? Nếu có, hãy kể một tình huống cụ thể.','Bạn mong được hỗ trợ thế nào để cảm thấy an tâm và biết bước tiếp theo?'],
        next:'Mời người đã liên hệ và người đang tìm hiểu nhưng chưa liên hệ kể lại trải nghiệm. Thử lời mời hỏi cụ thể và mẫu phản hồi có chỉ dẫn rõ bước tiếp theo.',
        signals:['Người học hiểu có thể hỏi ai, hỏi điều gì và tự nói được bước tiếp theo.','Lưu nguyên lời họ nói về kỳ vọng, băn khoăn và điều chưa được giải đáp; tìm cả điểm khác nhau giữa hai nhóm.'],
        interviewNote:'Người chưa nhắn không đồng nghĩa với thiếu quan tâm. Không ép họ mô phỏng đăng ký; mục tiêu là hiểu lý do và hoàn cảnh của lựa chọn.',indices:[61,10]
      });
    }
    return items;
  }
  function understandingLens(id){
    const content={
      attention:{
        need:'Người xem có thể cần hình dung buổi học đầu tiên diễn ra thế nào và người mới chưa biết lái có được hướng dẫn từng bước.',
        hesitation:'Thuật ngữ khó hiểu hoặc cảnh thao tác quá nhanh có thể khiến họ chưa thấy mình theo kịp, dù vẫn muốn tìm hiểu việc học lái.',
        support:'Thử giải thích một thao tác nhỏ bằng ngôn ngữ đời thường, cho thấy lỗi thường gặp và cách giảng viên hỗ trợ người mới sửa lỗi.'
      },
      explore:{
        need:'Người tìm hiểu có thể muốn biết việc học phù hợp ra sao với thời gian, nhịp tiếp thu và mục đích sử dụng xe của mình.',
        hesitation:'Thông tin chung chung về chương trình có thể khiến họ khó hình dung mức độ thực hành, tiến độ học và cách được hỗ trợ khi chưa hiểu.',
        support:'Thử trình bày một tuần học mẫu, các mốc kỹ năng và lựa chọn trao đổi thêm, để người học tự đối chiếu với hoàn cảnh của mình.'
      },
      connection:{
        need:'Người chuẩn bị liên hệ có thể cần một cuộc trao đổi không bị đánh giá, nơi họ được nói rõ điều chưa biết và băn khoăn riêng.',
        hesitation:'Họ có thể chần chừ vì chưa biết nên hỏi gì, ai sẽ trả lời hoặc liệu câu hỏi của người mới có được đón nhận.',
        support:'Thử mở đầu bằng câu hỏi về điều họ muốn làm rõ, xác nhận lại nhu cầu và cho phép họ chọn bước tiếp theo phù hợp.'
      }
    }[id];
    if(!content)return '';
    const cards=[['Nhu cầu có thể có',content.need],['Điều có thể khiến họ chần chừ',content.hesitation],['Cách hỗ trợ nên thử',content.support]];
    return `<div class="ep-perspective" data-scroll-reveal role="group" aria-labelledby="ep-perspective-title-${id}"><h4 id="ep-perspective-title-${id}">Nhìn từ phía người học</h4><p class="ep-perspective-note">Các hướng thấu hiểu cần xác nhận qua trò chuyện với người học; báo cáo hiện tại chưa đo trực tiếp những nhu cầu và băn khoăn này.</p><div class="ep-perspective-grid">${cards.map(([title,body])=>`<div class="ep-perspective-item"><h5>${esc(title)}</h5><p>${esc(body)}</p></div>`).join('')}</div></div>`;
  }
  function empathyMap(items){
    if(!items.length)return '';
    return `<div class="ep-map ep-map-detailed" id="empathyMap"><div class="ep-map-head"><div><span class="ep-step-label">TỪ DỮ LIỆU ĐẾN CUỘC TRÒ CHUYỆN</span><h3>Bản đồ thấu cảm cần kiểm chứng</h3></div><span class="ep-unit">Bối cảnh: học lái xe</span></div><p class="ep-note">Chọn một góc nhìn để đi từ hành vi quan sát được đến câu hỏi về nhu cầu, cảm xúc và rào cản. Các góc nhìn không phải các bước nối tiếp của cùng một người.</p><div class="ep-tabs" role="tablist" aria-label="Góc nhìn thấu cảm">${items.map((item,i)=>`<button class="ep-tab" id="ep-tab-${item.id}" data-ep-tab="${item.id}" role="tab" aria-selected="${i===0}" aria-controls="ep-panel-${item.id}" tabindex="${i===0?0:-1}">${esc(item.label)}</button>`).join('')}</div>${items.map((item,i)=>`<div class="ep-map-panel" id="ep-panel-${item.id}" role="tabpanel" aria-labelledby="ep-tab-${item.id}" ${i?'hidden':''}><h4>${esc(item.title)}</h4><div class="ep-evidence-metrics">${item.metrics.map(m=>`<div class="ep-evidence-metric"><span class="ep-metric-label">${esc(m.label)}</span><strong>${fmt(m.value)}<small>${esc(m.unit)}</small></strong><span class="ep-metric-detail">${esc(m.detail)}</span></div>`).join('')}</div><p class="ep-reading"><b>Cách đọc tín hiệu</b>${esc(item.reading)}</p><div class="ep-map-grid"><article class="ep-map-step ep-evidence"><span class="ep-step-label">01 / ĐÃ QUAN SÁT</span><p>${esc(item.evidence)}</p></article><article class="ep-map-step"><span class="ep-step-label">02 / GIẢ THUYẾT CẦN KIỂM CHỨNG</span><p>${esc(item.hypothesis)}</p></article>${understandingLens(item.id)}<article class="ep-map-step ep-questions"><span class="ep-step-label">03 / HỎI NGƯỜI HỌC</span><ol>${item.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol></article></div><details class="ep-validation"><summary><span>Thử nghiệm nhỏ để hiểu sâu hơn</span><span class="ep-detail-toggle" aria-hidden="true">+</span></summary><div class="ep-validation-grid"><div><span class="ep-step-label">CÁCH THỬ</span><p>${esc(item.next)}</p></div><div><span class="ep-step-label">QUAN SÁT KHI KIỂM CHỨNG</span><ul>${item.signals.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></div></div><p class="ep-interview-note"><b>Khi phỏng vấn</b>${esc(item.interviewNote)}</p></details></div>`).join('')}</div>`;
  }
  function selectMapTab(host,id){
    const button=host.querySelector(`[data-ep-tab="${id}"]`);if(!button)return;
    host.querySelectorAll('[data-ep-tab]').forEach(b=>{const active=b===button;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    host.querySelectorAll('.ep-map-panel').forEach(p=>p.hidden=p.id!=='ep-panel-'+id);
  }
  function bindMap(host){
    if(host.dataset.epBound)return;host.dataset.epBound='true';
    function select(button){selectMapTab(host,button.dataset.epTab);}
    host.addEventListener('click',event=>{const b=event.target.closest('[data-ep-tab]');if(b&&host.contains(b))select(b);});
    host.addEventListener('keydown',event=>{const b=event.target.closest('[data-ep-tab]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const all=[...host.querySelectorAll('[data-ep-tab]')],index=all.indexOf(b),next=event.key==='Home'?0:event.key==='End'?all.length-1:(index+(event.key==='ArrowRight'?1:-1)+all.length)%all.length;select(all[next]);all[next].focus();});
  }
  function render(rows,filters={}){
    const host=document.getElementById('empathyPlus');if(!host)return {charts:0};
    const previousTab=host.querySelector?.('[data-ep-tab][aria-selected="true"]')?.dataset.epTab;
    const data=build(rows,filters);if(!data.configs.length){host.innerHTML='';return {charts:0,derivedMetrics:0};}
    const map=mapData(data);
    host.innerHTML=`<div class="ep-grid">${data.configs.map((c,i)=>`<article class="ep-card ${c.wide?'ep-wide':''}" data-empathy-plus="${c.id}"><div class="ep-head"><h3 class="ep-title">${esc(c.title)}</h3><span class="ep-unit">${esc(c.unit)}</span></div>${c.legend?`<p class="ep-legend">${esc(c.legend)}</p>`:''}<div class="ep-plot ${c.scroll?'ep-scroll':''}" id="ep-plot-${i}"></div><p class="ep-note">${esc(c.note)}</p></article>`).join('')}</div>${empathyMap(map)}`;
    data.configs.forEach((c,i)=>{const plot=document.getElementById('ep-plot-'+i),w=c.scroll?Math.max(570,plot.clientWidth):Math.max(300,plot.clientWidth);plot.innerHTML=c.kind==='matrix'?matrix(c.grid,w,c.title,{index:c.index}):bars(c.items,w,c.title,c.unit,{labelWidth:c.labelWidth,lollipop:c.lollipop});if(c.scroll){const el=plot.querySelector('svg');if(el)el.style.minWidth='570px';}});
    bindMap(host);if(previousTab)selectMapTab(host,previousTab);
    return {charts:data.configs.length,derivedMetrics:data.configs.length,evidenceTopics:map.length};
  }
  function exportRows(rows,filters={}){
    const data=build(rows,filters),out=[['Tín hiệu bổ sung','Phân nhóm','Giá trị','Đơn vị','Cách đọc']];
    data.configs.forEach(c=>{if(c.items)c.items.forEach(v=>out.push([c.title,v.label,v.value,c.unit,c.note]));else c.grid.rows.forEach(row=>row.values.forEach((v,i)=>{if(valid(v.value))out.push([c.title,row.label+' · '+c.grid.columns[i],v.value,c.unit,c.note]);}));});
    return out;
  }
  window.EmpathyPlus={render,exportRows,build};
})();

(() => {
  'use strict';
  const nf=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
  const fmt=v=>v==null?'—':nf.format(v);
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s??'').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const sum=(rows,key)=>{const a=rows.map(r=>r[key]).filter(finite);return a.length?a.reduce((s,v)=>s+v,0):null;};
  const labels={'Lượt bắt đầu cuộc trò chuyện qua tin nhắn':'Hội thoại','Người tiếp cận':'Tiếp cận cộng dồn','Độ cải thiện khả năng nhớ đến quảng cáo':'Nhớ quảng cáo ước tính'};
  let lineGradientId=0;
  function select({from,to,age='all'}={}){return EXTRA_SOURCE.rows.filter(r=>(!from||r.date>=from)&&(!to||r.date<=to)&&(age==='all'||r.age===age));}
  function build(options){
    const rows=select(options),cards=[];
    if(!rows.length)return cards;
    const dates=[...new Set(rows.map(r=>r.date))].sort();
    const refresh=sum(rows,'autoRefreshImpressions');
    if(refresh!=null)cards.push({key:'refresh',label:'Hiển thị tự động làm mới',category:'Phân phối',value:refresh,unit:'lượt',note:'Giữ số 0 được ghi trong nguồn; không xem đây là dữ liệu thiếu.',method:'Cộng lượt hiển thị tự động làm mới ở đúng một cấp dữ liệu.',points:dates.map(date=>({date,value:sum(rows.filter(r=>r.date===date),'autoRefreshImpressions')}))});
    const paired=rows.filter(r=>finite(r.sourceRatio28)&&finite(r.result)&&finite(r.linkClicks)&&r.linkClicks>0&&r.resultType);
    for(const type of [...new Set(paired.map(r=>r.resultType))]){
      const subset=paired.filter(r=>r.resultType===type),numerator=sum(subset,'result'),denominator=sum(subset,'linkClicks'),name=labels[type]||type;
      cards.push({key:'ratio-'+type,label:name+' / 100 click liên kết',category:'Kết quả',value:100*numerator/denominator,unit:'trên 100 click',numerator,denominator,n:subset.length,note:`${fmt(numerator)} kết quả / ${fmt(denominator)} click × 100 · ${subset.length} dòng có đủ cặp số. Các sự kiện không được nối theo từng người.`,method:'Tính riêng từng loại kết quả, chỉ trên các dòng có giá trị của trường tỷ lệ gốc; không lấy trung bình tỷ lệ và không gộp các loại.',points:dates.map(date=>{const d=subset.filter(r=>r.date===date);return {date,value:d.length?100*sum(d,'result')/sum(d,'linkClicks'):null};})});
    }
    return cards;
  }
  function plot(points,title){
    const w=460,h=172,l=65,r=20,t=24,b=32,cw=w-l-r,ch=h-t-b,max=Math.max(1,...points.map(p=>p.value??0))*1.12;
    const x=i=>l+(points.length===1?cw/2:cw*i/(points.length-1)),y=v=>t+ch-ch*v/max;
    const color='#41ddbf',gradient='source-line-fill-'+(++lineGradientId);
    let s=`<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".22"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;
    for(let i=0;i<3;i++){const v=max*i/2;s+=`<line x1="${l}" y1="${y(v)}" x2="${w-r}" y2="${y(v)}" stroke="#203542" stroke-dasharray="3 5"/><text x="${l-9}" y="${y(v)+4}" text-anchor="end" font-size="12" fill="#91abb9">${fmt(v)}</text>`;}
    let run=[];const flush=()=>{if(run.length){const path=run.map((p,i)=>(i?'L':'M')+p.join(',')).join(' ');s+=`<path d="${path}L${run.at(-1)[0]},${t+ch}L${run[0][0]},${t+ch}Z" fill="url(#${gradient})" data-scroll-area/><path data-scroll-draw d="${path}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`;}run=[];};
    points.forEach((p,i)=>{if(p.value==null)flush();else run.push([x(i),y(p.value)]);});flush();
    points.forEach((p,i)=>{s+=`<text x="${x(i)}" y="${h-8}" text-anchor="middle" font-size="12" fill="#91abb9">${p.date.slice(8)}/${p.date.slice(5,7)}</text>`;if(p.value!=null)s+=`<circle data-scroll-point cx="${x(i)}" cy="${y(p.value)}" r="4" fill="#0d232c" stroke="${color}" stroke-width="2" tabindex="0" data-tip="${esc(p.date+': '+fmt(p.value))}"><title>${esc(p.date+': '+fmt(p.value))}</title></circle>`;});
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${s}</svg>`;
  }
  function render(options={}){
    const host=document.getElementById('extraSourceMetrics');if(!host)return 0;
    const q=norm(options.query),cards=build(options).filter(c=>(!options.category||options.category==='all'||options.category===c.category)&&(!q||norm(c.label+' '+c.category+' '+c.method).includes(q)));
    host.innerHTML=cards.length?`<div class="section-subheading"><div class="eyebrow">BÁO CÁO ĐẦY ĐỦ · TRƯỜNG BỔ SUNG</div><h3>Đối chiếu chỉ số gốc còn lại</h3><p class="section-description">Mỗi đồ thị dùng thang riêng và chỉ các ngày có bản ghi. Kết quả trên click không phải tỷ lệ chuyển đổi khách hàng.</p></div><div class="ep-grid">${cards.map(c=>`<article class="ep-card source-extra-card" data-source-extra="${esc(c.key)}"><div class="ep-card-head"><h3>${esc(c.label)}</h3><span class="ep-unit">${esc(c.category)}</span></div><div class="source-extra-value">${fmt(c.value)}<small>${esc(c.unit)}</small></div>${plot(c.points,c.label)}<p class="ep-note">${esc(c.note)}</p><details><summary>Cách tính</summary><p class="ep-note">${esc(c.method)}</p></details></article>`).join('')}</div>`:'';
    return cards.length;
  }
  function exportRows(options){return [['Chỉ số bổ sung từ báo cáo đầy đủ','Giá trị','Đơn vị','Cách tính'],...build(options).map(c=>[c.label,c.value,c.unit,c.method])];}
  window.SourceExtras={render,exportRows,build};
})();

(() => {
  'use strict';
  const SEXES=['male','female','unknown'];
  const LABELS={male:'Nam',female:'Nữ',unknown:'Không xác định'};
  const COLORS={male:'#41ddbf',female:'#78a8ff',unknown:'#ffc078'};
  const nf=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
  const integers=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0});
  const valid=v=>typeof v==='number'&&Number.isFinite(v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>v==null?'—':nf.format(v);
  const sum=(rows,key)=>{const values=rows.map(r=>r[key]).filter(valid);return values.length?values.reduce((a,b)=>a+b,0):null;};
  function shade(hex,multiplier){const v=parseInt(hex.slice(1),16);return '#'+[v>>16,(v>>8)&255,v&255].map(c=>Math.min(255,Math.max(0,Math.round(c*multiplier))).toString(16).padStart(2,'0')).join('');}
  function path(start,end,depth=0){
    const cx=180,cy=92+depth,outerX=137,outerY=64,innerX=93,innerY=43.45,steps=Math.max(2,Math.ceil((end-start)/2));
    const points=[];
    for(let i=0;i<=steps;i++){const a=(start+(end-start)*i/steps)*Math.PI/180;points.push([cx+outerX*Math.cos(a),cy+outerY*Math.sin(a)]);}
    for(let i=steps;i>=0;i--){const a=(start+(end-start)*i/steps)*Math.PI/180;points.push([cx+innerX*Math.cos(a),cy+innerY*Math.sin(a)]);}
    return points.map((p,i)=>(i?'L':'M')+p.map(n=>n.toFixed(3)).join(',')).join('')+'Z';
  }
  function ring(groups,total){
    let angle=-90;
    const segments=groups.filter(g=>g.impressions>0).map(g=>{const start=angle;angle+=360*g.impressions/total;return {...g,start,end:angle,color:COLORS[g.sex]};});
    let s='<defs><radialGradient id="sp-ground"><stop offset="0" stop-color="#41ddbf" stop-opacity=".16"/><stop offset="1" stop-color="#41ddbf" stop-opacity="0"/></radialGradient></defs><ellipse class="depth-decoration" aria-hidden="true" cx="180" cy="184" rx="151" ry="22" fill="url(#sp-ground)"/>';
    if(!segments.length){
      for(let depth=20;depth>=0;depth-=2)s+=`<path ${depth?'class="depth-face" aria-hidden="true"':''} d="${path(-90,270,depth)}" fill="${depth?'#183543':'#284450'}"/>`;
    }else{
      for(let depth=20;depth>=2;depth-=2)segments.forEach(g=>{s+=`<path class="depth-face" aria-hidden="true" d="${path(g.start,g.end,depth)}" fill="${shade(g.color,.36+(20-depth)*.009)}"/>`;});
      segments.forEach(g=>{
        const label=LABELS[g.sex]+': '+integers.format(g.impressions)+' lượt hiển thị · '+fmt(g.share)+'%';
        s+=`<g data-depth-ring="true" data-tip="${esc(label)}" tabindex="0" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><path d="${path(g.start,g.end)}" fill="${g.color}" stroke="#d7fff4" stroke-opacity=".3" stroke-width=".6"/></g>`;
      });
    }
    s+=`<text class="sp-total" x="180" y="88" text-anchor="middle" font-size="32" font-weight="700" fill="#e7f5fb">${integers.format(total)}</text><text class="sp-unit" x="180" y="108" text-anchor="middle" font-size="12" fill="#91abb9">lượt hiển thị</text>`;
    return `<svg class="sp-svg" viewBox="0 0 360 220" role="img" aria-label="Cơ cấu giới tính theo lượt hiển thị"><title>Cơ cấu giới tính theo lượt hiển thị</title>${s}</svg>`;
  }
  function style(){
    if(document.getElementById('sp-style'))return;
    const element=document.createElement('style');element.id='sp-style';element.textContent=`
      #audienceSpotlight .spotlight-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:3px}
      #audienceSpotlight .spotlight-head .sp-kicker{display:block;color:#91abb9;font-size:9px;letter-spacing:1.5px;font-weight:650;line-height:1.5;margin-bottom:7px}
      #audienceSpotlight .spotlight-head h3{margin:0;color:#e7f5fb;font-size:18px;letter-spacing:-.3px;line-height:1.35}
      #audienceSpotlight .sp-link{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;border:1px solid #29424e;border-radius:50%;color:#9bded2;text-decoration:none;font-size:17px}
      #audienceSpotlight .sp-plot{min-width:0;display:flex;justify-content:center;align-items:center}
      #audienceSpotlight .sp-svg{display:block;width:100%;max-width:390px;height:auto;overflow:visible}
      #audienceSpotlight .sp-total{fill:#e7f5fb;font-family:inherit;font-variant-numeric:tabular-nums;letter-spacing:-.8px}
      #audienceSpotlight .sp-unit{fill:#91abb9;font-family:inherit;letter-spacing:.1px}
      #audienceSpotlight .sp-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding-top:13px;border-top:1px solid #263b48}
      #audienceSpotlight .sp-name{display:flex;align-items:flex-start;gap:6px;color:#a4bac5;font-size:11px;line-height:1.45;min-height:16px;margin:0 0 7px}
      #audienceSpotlight .sp-name i{display:block;flex:none;width:6px;height:6px;border-radius:50%;margin-top:5px}
      #audienceSpotlight .sp-share{display:block;font-weight:650;font-size:18px;color:#e7f5fb;font-variant-numeric:tabular-nums;line-height:1.3;letter-spacing:-.3px}
      #audienceSpotlight .sp-count{display:block;color:#91abb9;font-size:10px;font-variant-numeric:tabular-nums;margin-top:4px;line-height:1.5}
      #audienceSpotlight .sp-note{color:#8099a8;font-size:10px;line-height:1.6;margin:13px 0 0}
      #audienceSpotlight [data-tip]:focus-visible{outline:2px solid #b4fff0;outline-offset:4px}
      @media(max-width:680px){#audienceSpotlight .sp-svg{max-width:340px}#audienceSpotlight .sp-name{font-size:11px}#audienceSpotlight .sp-share{font-size:20px}#audienceSpotlight .sp-count{font-size:11px}}
      @media print{#audienceSpotlight .spotlight-head h3,#audienceSpotlight .sp-share{color:#17212f}#audienceSpotlight .sp-total{fill:#17212f}#audienceSpotlight .sp-unit{fill:#627480}#audienceSpotlight .sp-name,#audienceSpotlight .sp-count,#audienceSpotlight .sp-note{color:#627480}#audienceSpotlight .sp-link{display:none}}
    `;document.head.append(element);
  }
  function render({from,to,age='all'}={}){
    const host=document.getElementById('audienceSpotlight');if(!host)return {charts:0,rows:0};
    const rows=GENDER_SOURCE.rows.filter(r=>(!from||r.date>=from)&&(!to||r.date<=to)&&(!age||age==='all'||r.age===age));
    const total=sum(rows,'impressions');
    if(!rows.length||total==null){host.hidden=true;host.innerHTML='';return {charts:0,rows:rows.length,impressions:total};}
    style();host.hidden=false;
    const groups=SEXES.filter(sex=>rows.some(r=>r.sex===sex&&valid(r.impressions))).map(sex=>{const impressions=sum(rows.filter(r=>r.sex===sex),'impressions');return {sex,impressions,share:total>0?100*impressions/total:null};});
    host.innerHTML=`<div class="spotlight-head"><div><span class="sp-kicker">CHÂN DUNG NGƯỜI XEM</span><h3>Cơ cấu giới tính</h3></div><a href="#demographics" class="sp-link" aria-label="Xem chi tiết nhân khẩu học" title="Xem chi tiết nhân khẩu học">↗</a></div><div class="sp-plot">${ring(groups,total)}</div><div class="sp-stats">${groups.map(g=>`<div class="sp-stat"><div class="sp-name"><i style="background:${COLORS[g.sex]}" aria-hidden="true"></i><span>${LABELS[g.sex]}</span></div><strong class="sp-share">${g.share==null?'—':fmt(g.share)+'%'}</strong><span class="sp-count">${integers.format(g.impressions)} lượt</span></div>`).join('')}</div><p class="sp-note">Tỷ trọng lượt hiển thị, không phải tỷ lệ số người.</p>`;
    return {charts:1,rows:rows.length,impressions:total,groups};
  }
  window.AudienceSpotlight={render};
})();

(() => {
  'use strict';
  const $=id=>document.getElementById(id),C=['#41ddbf','#78a8ff','#ffc078','#b4a1fa','#ed9fc1','#91ca91'];
  const nf=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}),n=v=>v==null?'—':nf.format(v),pc=v=>v==null?'—':n(v)+'%',short=v=>v>=1000?n(v/1000)+'k':n(v);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ratio=(a,b)=>a==null||!b?null:100*a/b;
  const normalize=s=>String(s??'').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const dateText=d=>d?d.slice(8)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'';
  const allDates=DATA.rows.map(r=>r[79]).sort(),first=allDates[0],last=allDates.at(-1);
  let rows=DATA.rows,stats=DB.aggregate(rows),entries=[];
  function readFilters(){
    const from=$('dateFrom').value,to=$('dateTo').value,age=$('ageFilter').value;
    const error=!from||!to?'Hãy chọn đủ ngày bắt đầu và ngày kết thúc.':from>to?'Ngày bắt đầu cần trước hoặc trùng ngày kết thúc.':'';
    return {from,to,age,valid:!error,error};
  }
  for(const id of ['dateFrom','dateTo']){$(id).min=first;$(id).max=last;}
  $('dateFrom').value=first;$('dateTo').value=last;
  const svg=(marks,w,h,title)=>`<svg class="viz-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${marks}</svg>`;
  function bindTips(){document.querySelectorAll('[data-tip]').forEach(el=>{if(el.dataset.bound)return;el.dataset.bound='1';el.setAttribute('tabindex','0');const show=e=>{const t=$('tooltip');t.textContent=el.dataset.tip;t.style.display='block';const r=el.getBoundingClientRect(),x=e.clientX||r.x+r.width/2,y=e.clientY||r.y;t.style.left=Math.max(12,Math.min(x+12,innerWidth-t.offsetWidth-12))+'px';t.style.top=Math.max(12,Math.min(y+16,innerHeight-t.offsetHeight-12))+'px';};el.addEventListener('pointermove',show);el.addEventListener('focus',show);['pointerleave','blur'].forEach(ev=>el.addEventListener(ev,()=>{$('tooltip').style.display='none';}));});}
  function bars(host,items,title){
    const list=items.filter(i=>i.value!=null);if(!list.length){$(host).innerHTML='';return false;}
    const w=Math.max(340,$(host).clientWidth),h=270,l=90,r=78,t=20,b=35,cw=w-l-r,ch=h-t-b,max=Math.max(...list.map(i=>i.value),1),rh=ch/list.length;
    let s='';for(let j=0;j<=4;j++){const x=l+cw*j/4;s+=`<line x1="${x}" y1="${t}" x2="${x}" y2="${h-b}" stroke="#eeeaf4"/><text x="${x}" y="${h-10}" text-anchor="middle" font-size="11" fill="#8b809a">${short(max*j/4)}</text>`;}
    list.forEach((a,i)=>{const y=t+i*rh,ww=cw*a.value/max;s+=`<text x="${l-13}" y="${y+rh*.45}" text-anchor="end" font-size="12" fill="#766685">${esc(a.label)}</text><rect x="${l}" y="${y+4}" width="${cw}" height="${Math.min(rh*.58,28)}" rx="5" fill="#f3f0f8"/><rect x="${l}" y="${y+4}" width="${ww}" height="${Math.min(rh*.58,28)}" rx="5" fill="${a.color||C[i%6]}" data-tip="${esc(a.label+': '+n(a.value))}"/><text x="${l+ww+8}" y="${y+rh*.45}" fill="#4d3f63" font-size="12">${n(a.value)}</text>`;});
    $(host).innerHTML=svg(s,w,h,title);return true;
  }
  function donut(host,items,title){
    const list=items.filter(i=>i.value!=null);if(!list.length){$(host).innerHTML='';return false;}
    const total=list.reduce((a,b)=>a+b.value,0),circ=2*Math.PI*74;let offset=0;
    let marks='<circle cx="110" cy="110" r="74" fill="none" stroke="#efebf5" stroke-width="25"/>';
    list.forEach((a,i)=>{const len=total?circ*a.value/total:0;marks+=`<circle cx="110" cy="110" r="74" fill="none" stroke="${C[i%6]}" stroke-width="25" stroke-dasharray="${len} ${circ-len}" stroke-dashoffset="${-offset}" transform="rotate(-90 110 110)" data-tip="${esc(a.label+': '+n(a.value)+' · '+pc(ratio(a.value,total)))}"/>`;offset+=len;});
    const base=marks.replace(/ data-tip="[^"]*"/g,'');
    marks=`<g class="depth-face" transform="translate(0 9)" style="filter:brightness(.73)" aria-hidden="true" pointer-events="none">${base}</g>`+marks;
    marks+=`<text x="110" y="107" text-anchor="middle" font-size="26" font-weight="600" fill="#4c3f65">${n(total)}</text><text x="110" y="131" text-anchor="middle" font-size="11" fill="#88779a">Tổng ghi nhận</text>`;
    $(host).innerHTML=`<div class="em-donut">${svg(marks,220,220,title)}<div class="em-donut-key">${list.map((a,i)=>`<div><i style="background:${C[i%6]}"></i><span>${esc(a.label)}</span><b>${pc(ratio(a.value,total))}</b></div>`).join('')}</div></div>`;return true;
  }
  function kpis(){
    const s=stats.s,defs=[['Lượt hiển thị',s[10],'Quy mô phân phối nội dung',10],['Click tất cả',s[30],n(stats.ctrAll)+'% click / lượt hiển thị',30],['Lượt xem hết video',s[68],n(ratio(s[68],s[29]))+'% lượt xem hết / lượt phát',68],['Hội thoại bắt đầu',s[61],'Lượt chủ động liên hệ được ghi nhận',61]];
    const days=DB.byDay(rows,$('dateFrom').value,$('dateTo').value);
    const mini=(index,label)=>{
      const vals=days.map(d=>d.observed?d.s[index]:null),max=Math.max(1,...vals.filter(v=>v!=null)),x=i=>3+(days.length===1?45:90*i/(days.length-1)),y=v=>35-29*v/max,id='kpi-glow-'+index;
      let marks=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".23"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>`,seg=[];
      const flush=()=>{if(seg.length){const path=seg.map((p,i)=>(i?'L':'M')+p.join(',')).join(' ');if(seg.length>1)marks+=`<path class="metric-spark-area" data-scroll-area d="${path}L${seg.at(-1)[0]},35L${seg[0][0]},35Z" fill="url(#${id})"/>`;marks+=`<path class="metric-spark-line" data-scroll-draw d="${path}"/>`;}seg=[];};
      vals.forEach((v,i)=>{if(v==null)flush();else seg.push([x(i),y(v)]);});flush();
      vals.forEach((v,i)=>{if(v!=null)marks+=`<circle class="metric-spark-point" data-scroll-point cx="${x(i)}" cy="${y(v)}" r="1.9"/>`;});
      return `<svg class="metric-spark" viewBox="0 0 96 40" role="img" aria-label="${esc(label+' · xu hướng theo ngày')}"><title>${esc(label+' · xu hướng theo ngày, khoảng ngắt là thiếu dữ liệu')}</title>${marks}</svg>`;
    };
    $('kpiGrid').innerHTML=defs.filter(a=>a[1]!=null).map((a,i)=>`<article class="metric-card" data-kpi="${i}"><div class="metric-label">${a[0]}</div><div class="metric-meta"><div class="metric-value">${n(a[1])}</div>${mini(a[3],a[0])}</div><div class="metric-note">${a[2]}</div></article>`).join('');
    const secondary=[['Xem ≥3 giây',s[23]],['Click liên kết',s[41]],['Tương tác bài',s[55]],['Tiếp cận cộng dồn*',s[11]]];
    $('signalStrip').innerHTML=secondary.filter(a=>a[1]!=null).map(a=>`<div class="signal-item"><span>${a[0]}</span><strong>${n(a[1])}</strong></div>`).join('');
  }
  function trend(){
    const index=+$('trendMetric').value,labels={10:'Hiển thị',30:'Click tất cả',41:'Click liên kết',23:'Video ≥3 giây',22:'ThruPlay',55:'Tương tác bài',61:'Hội thoại'};
    for(const op of $('trendMetric').options)op.disabled=stats.s[+op.value]==null;
    if(stats.s[index]==null){const op=[...$('trendMetric').options].find(o=>!o.disabled);if(op){$('trendMetric').value=op.value;return trend();}$('chartTrend').innerHTML='';$('trendPanel').hidden=true;return;}
    $('trendPanel').hidden=false;const ds=DB.byDay(rows,$('dateFrom').value,$('dateTo').value),w=Math.max(360,$('chartTrend').clientWidth),h=270,l=46,r=22,t=28,b=34,cw=w-l-r,ch=h-t-b;
    const rawMax=Math.max(1,...ds.map(d=>d.s[index]??0))*1.12,rawStep=rawMax/4,power=10**Math.floor(Math.log10(rawStep)),step=([1,1.5,2,2.5,3,4,5,7.5,10].find(v=>v>=rawStep/power)||10)*power,max=step*4;
    const x=i=>l+(ds.length===1?cw/2:cw*i/(ds.length-1)),y=v=>t+ch-ch*v/max;
    let s='<defs><linearGradient id="trend-glow-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#41ddbf" stop-opacity=".22"/><stop offset="100%" stop-color="#41ddbf" stop-opacity="0"/></linearGradient></defs>';
    for(let j=0;j<=4;j++){const yy=y(max*j/4);s+=`<line x1="${l}" y1="${yy}" x2="${w-r}" y2="${yy}" stroke="#203542" stroke-dasharray="3 5"/><text x="${l-9}" y="${yy+4}" text-anchor="end" font-size="11" fill="#91abb9">${short(max*j/4)}</text>`;}
    let seg=[];const flush=()=>{if(seg.length){const path=seg.map(([a,b],i)=>(i?'L':'M')+a+','+b).join(' ');s+=`<path data-scroll-area d="${path}L${seg.at(-1)[0]},${t+ch}L${seg[0][0]},${t+ch}Z" fill="url(#trend-glow-fill)"/><path data-scroll-draw d="${path}" fill="none" stroke="#41ddbf" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`;seg=[];}};
    ds.forEach((d,i)=>{if(!d.observed||d.s[index]==null)flush();else seg.push([x(i),y(d.s[index])]);});flush();
    ds.forEach((d,i)=>{const v=d.s[index];if(w>520||i%2===0||i===ds.length-1)s+=`<text x="${x(i)}" y="${h-10}" text-anchor="middle" font-size="10" fill="#91abb9">${d.date.slice(8)}/${d.date.slice(5,7)}</text>`;if(d.observed&&v!=null)s+=`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="#0d232c" stroke="#41ddbf" stroke-width="2" data-tip="${dateText(d.date)}\n${labels[index]}: ${n(v)}"/><text x="${x(i)}" y="${y(v)-13}" text-anchor="middle" font-size="10" fill="#d9f8f2">${short(v)}</text>`;});
    $('chartTrend').innerHTML=svg(s,w,h,labels[index]+' theo ngày');$('trendSubtitle').textContent='Lượt ghi nhận · khoảng ngắt thể hiện ngày thiếu dữ liệu';
  }
  function demographics(){
    const ages=DB.byAge(rows).filter(a=>a.n>0),index=+$('ageMetric').value;
    for(const op of $('ageMetric').options)op.disabled=stats.s[+op.value]==null;
    if(stats.s[index]==null){const op=[...$('ageMetric').options].find(o=>!o.disabled);if(op)$('ageMetric').value=op.value;}
    const actual=+$('ageMetric').value;
    $('agePanel').hidden=!bars('ageChart',ages.map(a=>({label:a.age,value:a.s[actual]})),'Phân bố '+DATA.headers[actual]+' theo độ tuổi');
    $('ageReachPanel').hidden=!donut('chartAgeReach',ages.map(a=>({label:a.age,value:a.s[11]})),'Cơ cấu tiếp cận cộng dồn theo tuổi');
    $('ageMessagePanel').hidden=!donut('chartMessageShare',ages.map(a=>({label:a.age,value:a.s[61]})),'Cơ cấu hội thoại theo tuổi');
    const cols=[['Tuổi',a=>a.age],['Hiển thị',a=>n(a.s[10])],['Tiếp cận*',a=>n(a.s[11])],['Click',a=>n(a.s[30])],['CTR',a=>pc(a.ctrAll)],['Tương tác',a=>n(a.s[55])],['Video ≥3s',a=>n(a.s[23])],['Video 100%',a=>n(a.s[68])],['Hội thoại',a=>n(a.s[61])]];
    $('ageTable').innerHTML='<div class="table-scroll"><table><thead><tr>'+cols.map(([l])=>'<th>'+l+'</th>').join('')+'</tr></thead><tbody>'+ages.map(a=>'<tr>'+cols.map(([,fn])=>'<td>'+fn(a)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    $('ageTableDetails').hidden=!ages.length;
    renderGender();
  }
  function renderGender(){
    const filters=readFilters();
    if(!filters.valid){
      $('genderCharts').innerHTML='';$('genderSection').hidden=true;$('demographics').hidden=true;
      $('demographicCount').textContent='Chọn khoảng ngày hợp lệ';
      $('audienceSpotlight').innerHTML='';$('audienceSpotlight').hidden=true;return;
    }
    if(!window.GenderCharts){$('genderSection').hidden=true;return;}
    const result=GenderCharts.render(filters);
    const ageCount=(result.ageGroups||[...new Set(GENDER_SOURCE.rows.filter(r=>r.date>=filters.from&&r.date<=filters.to&&(filters.age==='all'||r.age===filters.age)).map(r=>r.age))]).length;
    $('demographicCount').textContent=result.rows?ageCount+' nhóm tuổi · '+result.genders.length+' nhóm giới tính':'Độ tuổi theo dữ liệu hiện có';
    $('demographics').hidden=!rows.length&&!result.rows;
    if(window.AudienceSpotlight)AudienceSpotlight.render(filters);
  }
  function fullViews(){
    const meta=GENDER_SOURCE.metadata||{},top=meta.topSummary||GENDER_SOURCE.topSummary;
    const filters=readFilters(),fullScope=filters.valid&&filters.from===first&&filters.to===last&&filters.age==='all';
    $('fullViewsPanel').hidden=!(fullScope&&top&&(top.views!=null||top.viewers!=null));
    if(!$('fullViewsPanel').hidden)bars('fullViewsChart',[{label:'Lượt xem',value:top.views},{label:'Người xem*',value:top.viewers}],'Lượt xem và người xem cộng dồn theo báo cáo đầy đủ');
  }
  function catalog(){
    const q=$('metricSearch').value,category=$('categoryFilter').value;const total=ViewPolicy.entries(DATA.rows).length;
    const count=MetricGallery.render(rows,{query:q,category,onlyAvailable:true});$('catalogCount').textContent=count+' / '+entries.length+' trường nguồn trong phạm vi lọc';$('activeMetricCount').textContent=total;$('catalogTitle').textContent='Tra cứu mọi chỉ số';
    const query=normalize(q);const selected=entries.filter(m=>(category==='all'||m.category===category)&&(!query||normalize([m.name,m.category,m.code,m.method,m.detail].join(' ')).includes(query)));
    $('metricRows').innerHTML=selected.map(m=>`<tr><td>${m.code}</td><td>${esc(m.name)}</td><td>${esc(m.value)}</td><td>${m.available}/${rows.length}</td><td><b>${esc(m.method)}</b><br>${esc(m.detail)}</td></tr>`).join('');
    $('metricTableDetails').hidden=!count;
    const filters=readFilters();$('extraSourceMetrics').hidden=!filters.valid;
    if(!filters.valid)$('extraSourceMetrics').innerHTML='';
    else if(window.SourceExtras)SourceExtras.render({...filters,query:q,category});
    bindTips();
  }
  function notes(){
    $('sourceNotes').innerHTML='<div class="source-grid"><article class="source-item"><h4>Hai nguồn bổ sung nhau</h4><p>nhóm.xlsx · Worksheet: 80 dòng ngày × độ tuổi, có chi tiết video, tương tác và tin nhắn. Báo-cáo-chưa-đặt-tên-từ-Tháng-1-1-2026-đến-Tháng-10-29-2026.xlsx · Creative Reporting: 953 dòng ở nhiều tầng tổng hợp, có giới tính. Hai nguồn cùng 30.205 hiển thị, 405 click, 130 click liên kết; không cộng hai nguồn với nhau.</p></article><article class="source-item"><h4>Giới tính & cách tránh trùng</h4><p>Biểu đồ giới tính chỉ dùng 305 dòng tại tầng ngày × tuổi × giới tính × quảng cáo, không dùng đồng thời các dòng tổng ở tầng trên. Có ngày 09, 10, 11, 14, 15/08/2026 trong lớp này. Tỷ trọng giới tính được đo theo lượt hiển thị hoặc hành động, không phải phân bố số người trong dân số. Số người cộng dồn có thể trùng.</p></article><article class="source-item"><h4>Thấu hiểu từ bằng chứng</h4><p>Các biểu đồ mô tả mức chú ý, tương tác và hội thoại. Hành vi này chưa chứng minh nhu cầu, động cơ hay tính cách. Gợi ý nội dung là giả thuyết để phỏng vấn hoặc thử nghiệm. Các sự kiện tin nhắn và mốc video không tạo thành phễu chuyển đổi nối tiếp.</p></article><article class="source-item"><h4>Phạm vi và dữ liệu thiếu</h4><p>Bộ lọc áp dụng cho từng nguồn theo ngày thực có. Chỉ hiển thị biểu đồ có dữ liệu; số 0 thực trong nguồn được giữ. Lượt xem/người xem ở báo cáo đầy đủ chỉ có cấp tổng và được hiển thị khi chọn toàn bộ phạm vi. Chi tiết video tiếp tục dùng nguồn nhóm.xlsx. Thời gian xem trung bình là ước tính gia quyền.</p></article></div>';
  }
  function extraInsights(){
    const filters=readFilters();
    if(!filters.valid){$('empathyPlus').innerHTML='';$('empathyPlusCount').textContent='';$('insights').hidden=true;return;}
    const result=window.EmpathyPlus?.render(rows,filters);$('empathyPlusCount').textContent=result?.charts?result.charts+' góc nhìn bổ sung':'';$('insights').hidden=!rows.length;
  }
  function update(){
    const filters=readFilters(),{from,to,age}=filters;
    rows=filters.valid?DB.selectRows(from,to,age):[];stats=DB.aggregate(rows);entries=ViewPolicy.entries(rows);
    $('filterStatus').textContent=filters.valid?dateText(from)+' – '+dateText(to)+' · '+(age==='all'?'Tất cả độ tuổi':age+' tuổi'):'Khoảng ngày chưa hợp lệ';
    $('noRecords').textContent=filters.error||'Khoảng ngày đang chọn không có bản ghi. Hãy chọn khoảng ngày khác để xem biểu đồ.';
    $('noRecords').hidden=rows.length>0;$('exportCsv').disabled=!filters.valid;
    for(const id of ['dateFrom','dateTo'])$(id).setAttribute('aria-invalid',String(!filters.valid));
    kpis();trend();demographics();fullViews();catalog();const tc=TechnicalCharts.render(rows);$('technicalChartCount').textContent=tc.charts+' biểu đồ hành vi';$('performance').hidden=!tc.charts;VisualDashboard.render(rows);extraInsights();bindTips();
  }
  ['dateFrom','dateTo','ageFilter'].forEach(id=>$(id).addEventListener('change',update));
  $('trendMetric').addEventListener('change',()=>{trend();bindTips();});$('ageMetric').addEventListener('change',()=>{demographics();bindTips();});
  $('metricSearch').addEventListener('input',catalog);$('categoryFilter').addEventListener('change',catalog);
  $('clearMetricSearch').addEventListener('click',()=>{$('metricSearch').value='';$('categoryFilter').value='all';catalog();$('metricSearch').focus();});
  $('resetFilters').addEventListener('click',()=>{$('dateFrom').value=first;$('dateTo').value=last;$('ageFilter').value='all';update();});
  $('printReport').addEventListener('click',()=>window.print());
  $('exportCsv').addEventListener('click',()=>{
    const filters=readFilters();if(!filters.valid)return;
    const data=[['Nguồn','nhóm.xlsx + báo cáo đầy đủ'],['Phạm vi',filters.from+' — '+filters.to],['Độ tuổi',filters.age],['Chiến dịch','Hợp nhất toàn bộ'],[],['Mã','Chỉ số','Giá trị','Dòng có dữ liệu','Cách tính','Lưu ý'],...entries.map(m=>[m.code,m.name,m.value,m.available,m.method,m.detail])];
    if(window.GenderCharts?.exportRows)data.push([],['Giới tính · báo cáo đầy đủ'],...GenderCharts.exportRows(filters));
    if(window.EmpathyPlus?.exportRows)data.push([],...EmpathyPlus.exportRows(rows,filters));
    if(window.SourceExtras?.exportRows)data.push([],...SourceExtras.exportRows(filters));
    const csv='\ufeff'+data.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='thau-hieu-khach-hang.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')$('tooltip').style.display='none';});
  let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>{trend();demographics();fullViews();TechnicalCharts.render(rows);VisualDashboard.render(rows);extraInsights();bindTips();},100);});
  const nav=[...document.querySelectorAll('nav a[href^="#"]')];if('IntersectionObserver'in window){const io=new IntersectionObserver(events=>events.forEach(e=>{if(e.isIntersecting)nav.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}),{rootMargin:'-10% 0px -65% 0px'});document.querySelectorAll('main section[id]').forEach(e=>io.observe(e));}
  notes();update();
})();

(() => {
  'use strict';
  const root = document.documentElement;
  const main = document.querySelector('main');
  if (!main) return;
  const gs = window.gsap;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cardSelector = '.ep-card,.gd-card,.tc-card,.av-card,.daily-card,.metric-card,.mg-card,#agePanel,#ageReachPanel,#ageMessagePanel,#trendPanel,#fullViewsPanel,#audienceSpotlight';
  const headingSelector = '.section-heading,.section-subheading,.age-detail-heading,.ep-map-head,.ep-map-panel>h4';
  const revealSelector = cardSelector + ',' + headingSelector + ',.ep-map-step,.ep-map-next,[data-scroll-reveal]';
  const storageKey = 'lang-kinh-display-v2';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}
  let enabled = saved.motion !== false;
  let depth = saved.depth !== false;
  let printing = false;
  let frame = 0;
  let progressFrame = 0;
  let previousProgress = -1;
  const bound = new WeakSet();
  const seen = new WeakSet();
  const watched = new Set();
  const active = new Set();
  const svgNS = 'http://www.w3.org/2000/svg';
  const barColors = new Set(['#41ddbf','#78a8ff','#78a8ff','#ffc078','#ffc078','#b4a1fa','#b4a1fa','#ed9fc1','#ed9fc1','#91ca91','#91ca91']);
  const motionAllowed = () => !!gs && enabled && !reduce.matches && !printing;
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden','true');
  const progressFill = document.createElement('span');
  progressFill.className = 'scroll-progress-fill';
  progress.appendChild(progressFill);
  document.body.appendChild(progress);
  function updateProgress() {
    progressFrame = 0;
    const scroller = document.scrollingElement || root;
    const available = Math.max(0,scroller.scrollHeight-root.clientHeight);
    const fraction = available ? Math.min(1,Math.max(0,scroller.scrollTop/available)) : 0;
    if (Math.abs(previousProgress-fraction)<.0001) return;
    previousProgress = fraction;
    if (motionAllowed()) gs.to(progressFill,{scaleX:fraction,duration:.24,ease:'power2.out',overwrite:true});
    else progressFill.style.transform = 'scaleX('+fraction+')';
  }
  function scheduleProgress() { if (!progressFrame) progressFrame=requestAnimationFrame(updateProgress); }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify({motion:enabled,depth})); } catch (_) {}
  }
  function syncControls() {
    root.dataset.motion = motionAllowed() ? 'on' : 'off';
    root.dataset.depth = depth ? 'on' : 'off';
    const motion = document.getElementById('motionToggle');
    const dimensional = document.getElementById('depthToggle');
    if (motion) {
      motion.setAttribute('aria-pressed',String(enabled && !reduce.matches && !!gs));
      motion.textContent = reduce.matches ? 'Hiệu ứng: giảm chuyển động' : 'Hiệu ứng: ' + (enabled && gs ? 'Bật' : 'Tắt');
      motion.title = reduce.matches ? 'Theo cài đặt giảm chuyển động trên thiết bị' : 'Bật hoặc tắt chuyển động của biểu đồ';
    }
    if (dimensional) {
      dimensional.setAttribute('aria-pressed',String(depth));
      dimensional.textContent = 'Biểu đồ: ' + (depth ? '3D' : '2D');
    }
  }
  function finishAnimations() {
    if (!gs) return;
    active.forEach(tween => { tween.progress(1); tween.kill(); });
    active.clear();
    main.querySelectorAll('[data-motion-tilt]').forEach(card => {
      gs.killTweensOf(card);
      gs.set(card,{clearProps:'transform'});
    });
    gs.killTweensOf(progressFill);
    previousProgress=-1;updateProgress();
  }
  function track(animation) {
    active.add(animation);
    animation.eventCallback('onComplete',() => active.delete(animation));
    return animation;
  }
  function setMotion(value) {
    enabled = !!value;
    if (!motionAllowed()) finishAnimations();
    persist();syncControls();scheduleProgress();
    return enabled;
  }
  function setDepth(value) {
    depth = !!value;
    if (!depth) main.querySelectorAll('[data-motion-tilt]').forEach(resetTilt);
    persist();syncControls();
    return depth;
  }
  function shaded(hex, factor) {
    const value = parseInt(hex.slice(1),16);
    const rgb = [value >> 16,(value >> 8) & 255,value & 255].map(n => Math.round(factor < 1 ? n * factor : n + (255 - n) * (factor - 1)));
    return '#' + rgb.map(n => Math.min(255,Math.max(0,n)).toString(16).padStart(2,'0')).join('');
  }
  function polygon(points,fill) {
    const path = document.createElementNS(svgNS,'polygon');
    path.setAttribute('points',points.map(pair => pair.join(',')).join(' '));
    path.setAttribute('fill',fill);
    path.setAttribute('stroke',fill);
    path.setAttribute('stroke-width','.35');
    return path;
  }
  function addBarDepth() {
    // The original front face retains its exact x/y/width/height, so depth adds no data.
    // Only palette-filled bars from known renderers qualify. Heatmap fills are RGBA.
    main.querySelectorAll('#ageChart rect[data-tip],#fullViewsChart rect[data-tip],.tc-plot rect[data-tip],.av-card rect[data-tip]').forEach(rect => {
      if (rect.closest('.depth-bar')) return;
      const color = (rect.getAttribute('fill') || '').toLowerCase();
      if (!barColors.has(color)) return;
      const [x,y,w,h] = ['x','y','width','height'].map(key => Number(rect.getAttribute(key)));
      if (![x,y,w,h].every(Number.isFinite) || w <= 0 || h <= 0) return;
      const dx = Math.min(4,Math.max(1.2,Math.min(w,h)*.26)),dy = -dx*.65;
      const wrapper = document.createElementNS(svgNS,'g');
      wrapper.classList.add('depth-bar');
      wrapper.setAttribute('data-motion-bar','');
      const sides = document.createElementNS(svgNS,'g');
      sides.classList.add('depth-decoration');
      sides.setAttribute('aria-hidden','true');
      sides.setAttribute('pointer-events','none');
      sides.appendChild(polygon([[x,y],[x+dx,y+dy],[x+w+dx,y+dy],[x+w,y]],shaded(color,1.28)));
      sides.appendChild(polygon([[x+w,y],[x+w+dx,y+dy],[x+w+dx,y+h+dy],[x+w,y+h]],shaded(color,.72)));
      rect.parentNode.insertBefore(wrapper,rect);
      wrapper.appendChild(sides);wrapper.appendChild(rect);
    });
  }
  function resetTilt(card) {
    if (!gs) return;
    if (!motionAllowed()) { gs.killTweensOf(card);gs.set(card,{clearProps:'transform'});return; }
    gs.to(card,{rotationX:0,rotationY:0,y:0,duration:.22,ease:'power2.out',overwrite:'auto',clearProps:'transform'});
  }
  function bindCard(card) {
    if (bound.has(card)) return;
    bound.add(card);
    card.setAttribute('data-motion-tilt','');
    card.addEventListener('pointermove',event => {
      if (!motionAllowed() || !depth || !fine.matches || event.pointerType==='touch') return;
      // Charts stay still while a value is being read or a control is being used.
      if (event.target.closest('svg,[data-tip],input,select,button,a,summary,details')) { resetTilt(card);return; }
      const box = card.getBoundingClientRect();
      const horizontal = (event.clientX-box.left)/box.width-.5;
      const vertical = (event.clientY-box.top)/box.height-.5;
      gs.to(card,{rotationY:horizontal*2.2,rotationX:-vertical*1.6,transformPerspective:1400,y:-1.5,duration:.35,ease:'power2.out',overwrite:'auto'});
    },{passive:true});
    card.addEventListener('pointerleave',() => resetTilt(card),{passive:true});
    card.addEventListener('focusin',() => resetTilt(card));
  }
  function reveal(card,delay=0) {
    if (seen.has(card) || card.closest('[hidden]')) return;
    seen.add(card);
    card.setAttribute('data-scroll-revealed','true');
    if (!motionAllowed()) return;
    // Each element stays visible before and after the reveal. Only the whole card
    // moves; data-bearing SVG shapes retain their positions and dimensions.
    const isHeading=card.matches(headingSelector);
    const tl = gs.timeline({defaults:{ease:'power2.out'}});
    tl.fromTo(card,{opacity:isHeading?.65:.5,y:isHeading?12:24},{opacity:1,y:0,duration:isHeading?.55:.72,clearProps:'opacity,transform'},delay);
    if (isHeading) { track(tl);return; }
    const marks = [...card.querySelectorAll('[data-motion-bar],[data-depth-bar],[data-depth-ring],[data-motion="tile"]')].slice(0,48);
    if (marks.length) tl.fromTo(marks,{opacity:.48},{opacity:1,duration:.6,stagger:{amount:.22},clearProps:'opacity'},delay+.1);
    const areas = [...card.querySelectorAll('[data-scroll-area]')];
    if (areas.length) tl.fromTo(areas,{opacity:.16},{opacity:1,duration:1.05,clearProps:'opacity'},delay+.12);
    const points = [...card.querySelectorAll('[data-scroll-point]')];
    if (points.length) tl.fromTo(points,{opacity:.5},{opacity:1,duration:.48,stagger:{amount:.22},clearProps:'opacity'},delay+.18);
    const paths = [...card.querySelectorAll('path[data-scroll-draw],#chartTrend path[fill="none"],.daily-card path[fill="none"]')];
    paths.forEach(path => {
      if (path.hasAttribute('stroke-dasharray')) return;
      let length = 0;try { length = path.getTotalLength(); } catch (_) {}
      if (length < 15) return;
      tl.fromTo(path,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1.15,ease:'power2.inOut',clearProps:'strokeDasharray,strokeDashoffset'},delay+.12);
    });
    track(tl);
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    const arriving=entries.filter(entry=>entry.isIntersecting&&!entry.target.closest('[hidden]')).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left);
    arriving.forEach((entry,i) => {
      observer.unobserve(entry.target);watched.delete(entry.target);reveal(entry.target,Math.min(i*.065,.26));
    });
  },{threshold:.08,rootMargin:'0px 0px -12px 0px'}) : null;
  function refresh() {
    frame = 0;
    addBarDepth();
    watched.forEach(card => { if (!card.isConnected) { observer?.unobserve(card);watched.delete(card); } });
    main.querySelectorAll(revealSelector).forEach(card => {
      if (card.matches(cardSelector)) bindCard(card);
      if (seen.has(card) || watched.has(card) || card.closest('[hidden]')) return;
      if (observer) { observer.observe(card);watched.add(card); }
      else { seen.add(card);card.setAttribute('data-scroll-revealed','true'); }
    });
    syncControls();scheduleProgress();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(refresh); }
  const mutations = new MutationObserver(records => {
    const contentChanged = records.some(record => record.type==='attributes' || [...record.addedNodes].some(node =>
      node.nodeType===1 && !node.matches('.depth-bar,.depth-decoration,.depth-decoration *,polygon') && !node.closest('.depth-bar')
    ));
    if (contentChanged) schedule();
  });
  mutations.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  // Scroll is observed passively; the browser keeps its own scrolling physics.
  window.addEventListener('scroll',scheduleProgress,{passive:true});
  window.addEventListener('resize',scheduleProgress,{passive:true});
  main.addEventListener('toggle',scheduleProgress,true);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleProgress).observe(main);
  document.getElementById('motionToggle')?.addEventListener('click',() => setMotion(!enabled));
  document.getElementById('depthToggle')?.addEventListener('click',() => setDepth(!depth));
  reduce.addEventListener('change',() => { if (reduce.matches) finishAnimations();syncControls();scheduleProgress(); });
  window.addEventListener('beforeprint',() => { printing=true;finishAnimations();syncControls(); });
  window.addEventListener('afterprint',() => { printing=false;syncControls();scheduleProgress(); });
  document.addEventListener('visibilitychange',() => { if (document.hidden) finishAnimations(); });
  window.DashboardMotion = {refresh:schedule,setMotion,setDepth,get state(){return {motion:motionAllowed(),depth,gsap:gs?.version||null,reduced:reduce.matches};}};
  refresh();
})();

