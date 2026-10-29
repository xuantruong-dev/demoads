(() => {
  'use strict';
  const ages = ['18-24','25-34','35-44','45-54','55-64','65+'];
  const number = (v) => typeof v === 'number' && Number.isFinite(v);
  const present = (v) => v !== null && v !== undefined && v !== '';
  const fmt = (v, digits = 0) => v == null || !Number.isFinite(v) ? 'Chưa có dữ liệu' : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
  const div = (a,b,multiplier = 1) => a == null || b == null || b <= 0 ? null : a / b * multiplier;
  const seconds = (v) => {
    if (number(v)) return v;
    if (typeof v !== 'string' || !/^\d{1,2}:\d{2}:\d{2}$/.test(v)) return null;
    const [h,m,s] = v.split(':').map(Number); return h * 3600 + m * 60 + s;
  };
  const unique = (rows,i) => [...new Set(rows.map(r=>r[i]).filter(present))];
  const excelColumn = (index) => { let s = '', n = index + 1; while(n) { n--; s = String.fromCharCode(65+n%26)+s; n=Math.floor(n/26); } return s; };
  const resultLabels = {
    'reach':'Tiếp cận (chỉ báo kết quả)',
    'estimated_ad_recallers':'Người nhớ quảng cáo ước tính (chỉ báo kết quả)',
    'actions:post_engagement':'Tương tác bài viết (chỉ báo kết quả)',
    'actions:onsite_conversion.messaging_conversation_started_7d':'Bắt đầu hội thoại (chỉ báo kết quả)'
  };

  function aggregate(rows) {
    const s = {};
    for (let i=0;i<DATA.headers.length;i++) {
      const values = rows.map(r=>r[i]).filter(number);
      s[i] = values.length ? values.reduce((a,b)=>a+b,0) : null;
    }
    // The result column mixes incompatible units. There is no valid pooled total.
    s[4] = null;
    const dates=unique(rows,79).sort();
    let durationSum=0, durationPlays=0;
    rows.forEach(r=>{ const d=seconds(r[72]); if(d!=null && number(r[29]) && r[29]>0){durationSum+=d*r[29];durationPlays+=r[29];} });
    const out = {
      s, n:rows.length, dates,
      campaignNames:unique(rows,0).length,
      campaignDefinitions:new Set(rows.map(r=>String(r[0])+'\u001f'+String(r[78]))).size,
      duration:durationPlays>0 ? durationSum/durationPlays : null,
      durationCoverage:div(durationPlays,s[29]), durationPlays,
      cpm:div(s[9],s[10],1000),
      cpcAll:div(s[9],s[30]), cpcLink:div(s[9],s[41]),
      ctrAll:div(s[30],s[10],100), ctrLink:div(s[41],s[10],100),
      cpe:div(s[9],s[55]), costMessage:div(s[9],s[61]),
      cost3s:div(s[9],s[23]), costThru:div(s[9],s[22]),
      cost1kReach:div(s[9],s[11],1000), frequencyProxy:div(s[10],s[11]),
      uniqueCTRAllProxy:div(s[39],s[11],100),
      uniqueCTRLinkProxy:div(s[42],s[11],100), uniqueCPCAllProxy:div(s[9],s[39]),
      recallRateProxy:div(s[83],s[11],100), costRecall:div(s[9],s[83]),
      hookRate:div(s[23],s[10],100), completionRate:div(s[68],s[29],100)
    };
    return out;
  }

  function selectRows(from,to,age='all') {
    return DATA.rows.filter(r=>(!from || r[79]>=from) && (!to || r[79]<=to) && (!age || age==='all' || r[1]===age));
  }
  function byAge(rows) {
    return ages.map(age=>({age,...aggregate(rows.filter(r=>r[1]===age))}));
  }
  function byDay(rows,from,to) {
    const dates=unique(rows,79).sort();
    const first=from || dates[0], last=to || dates[dates.length-1];
    if(!first || !last || first>last)return [];
    const out=[];
    for(let day = new Date(first+'T00:00:00Z'),end = new Date(last+'T00:00:00Z');day<=end;day.setUTCDate(day.getUTCDate()+1)){
      const date=day.toISOString().slice(0,10), subset=rows.filter(r=>r[79]===date);
      out.push({date,observed:subset.length>0,...aggregate(subset)});
    }
    return out;
  }
  function resultTypes(rows) {
    return unique(rows,5).map(type=>{
      const subset=rows.filter(r=>r[5]===type);
      const sumAt=i=>{const v=subset.map(r=>r[i]).filter(number);return v.length?v.reduce((a,b)=>a+b,0):null;};
      const value=sumAt(4),spend=sumAt(9),impressions=sumAt(10),reach=sumAt(11);
      return {type,label:resultLabels[type]||type,value,result:value,spend,impressions,reach,n:subset.length,
        ratio:div(value,impressions,100),perResult:div(spend,value,type==='reach'?1000:1),
        costUnit:type==='reach'?'₫ / 1.000 tiếp cận cộng dồn':'₫ / kết quả',
        costNote:'Chi tiêu chỉ trên dòng có chỉ báo; không phải CPA đầy đủ của mục tiêu. Dòng không có chỉ báo chưa được phân bổ.'};
    });
  }

  const categoryAt = (i) => {
    if([0,1,2,3,7,8,12,74,75,76,77,78,79,80].includes(i)) return 'Thiết lập';
    if([4,5,6,13,14,15,16,65,66,82,83,84,85,86].includes(i))return 'Kết quả';
    if((i>=20 && i<=29)||(i>=67&&i<=73))return 'Video';
    if(i>=57&&i<=64)return 'Tin nhắn';
    if(i>=43&&i<=56)return 'Tương tác';
    if([9,17,18,19,32,33,34,35,36,37,38].includes(i))return 'Chi phí & tỷ lệ';
    return 'Phân phối';
  };
  const costMapping = {18:[11,1000],19:[10,1000],26:[25,1],27:[23,1],28:[22,1],32:[39,1],33:[41,1],34:[30,1],46:[56,1],47:[55,1],48:[54,1],49:[52,1],62:[60,1],63:[57,1],64:[61,1],82:[83,1]};
  const rateMapping = {17:[10,11,1],35:[30,10,100],36:[41,10,100],37:[42,11,100],38:[39,11,100],73:[23,10,100],84:[83,11,100]};
  const noSum = new Set([0,1,2,3,5,7,8,12,74,75,76,77,78,79,80]);
  function catalog(rows) {
    const a=aggregate(rows),types=resultTypes(rows);
    return DATA.headers.map((name,index)=>{
      const values=rows.map(r=>r[index]).filter(present), vals=unique(rows,index);
      let raw=a.s[index], value, method='Cộng các giá trị đã ghi nhận',detail='Ô trống không được đổi thành 0. Tổng chỉ phản ánh các giá trị có trong file.';
      const code=excelColumn(index),source=DATA.sheet+'!'+code+'2:'+code+(DATA.rows.length+1);
      if(!values.length) {
        raw=null; value='Chưa có dữ liệu';method='Không có giá trị trong phạm vi lọc';detail='Không đủ dữ liệu để suy ra 0 hoặc tính hiệu quả.';
      } else if(index===6) {
        raw=null;value=types.map(t=>t.label+': '+fmt(t.perResult,2)+' '+t.costUnit).join(' · ');method='Tính riêng theo từng chỉ báo trên các dòng có chỉ báo';detail='Mỗi loại: Σ(chi tiêu dòng có chỉ báo) / Σ(kết quả cùng loại). Riêng reach nhân 1.000 theo đơn vị nguồn. Chi tiêu chỉ trên dòng có chỉ báo; không phải CPA đầy đủ của mục tiêu vì dòng không có chỉ báo chưa được phân bổ.';
      } else if(index===15) {
        raw=null;value=types.map(t=>t.label+': '+fmt(t.ratio,2)+'%').join(' · ');method='Tính riêng tỷ lệ từng loại trên tập dòng có chỉ báo';detail='Mỗi loại: Σ(kết quả cùng loại) / Σ(lượt hiển thị trên các dòng có chỉ báo đó) × 100%. Không phải tỷ lệ toàn danh mục; các loại kết quả khác đơn vị nên không gộp tỷ lệ.';
      } else if(index===4) {
        raw=null;value='Xem theo loại kết quả';method='Giữ riêng đơn vị đo kết quả';detail='Cột kết quả trộn tiếp cận, nhớ quảng cáo, tương tác và hội thoại. Không cộng kết quả hoặc lấy trung bình chi phí / tỷ lệ giữa các loại.';
      } else if(index===5) {
        raw=null;value=types.length+' loại chỉ báo';method='Đếm loại chỉ báo';detail=types.map(t=>t.label).join(' · ');
      } else if(index===0) {
        raw=null;value=a.campaignNames+' tên đã hợp nhất';method='Gộp toàn bộ chiến dịch';detail=a.campaignDefinitions+' tổ hợp tên + ngày tạo; thiếu ID nên không xác nhận số chiến dịch duy nhất. Không loại các dòng chỉ trùng tên, tuổi và ngày.';
      } else if(index===7) {
        const numeric=vals.filter(number),text=vals.filter(v=>!number(v));
        raw=null;value=numeric.map(v=>fmt(v)+' ₫').join(' / ')+(text.length?' · có thiết lập dạng chữ':'');method='Giữ các mức ngân sách, không cộng';detail='Ngân sách lặp lại theo dòng độ tuổi / ngày, không phải chi tiêu. Giá trị gốc dạng chữ: '+text.join(' · ');
      } else if(noSum.has(index)) {
        raw=null;
        if([76,77,78,79,80].includes(index)) {const sorted=vals.map(String).sort();value=sorted[0]===sorted.at(-1)?sorted[0]:sorted[0]+' → '+sorted.at(-1);method='Khoảng ngày trong file';detail='Giữ ý nghĩa ngày gốc; ngày chỉnh sửa và ngày tạo không phải ngày báo cáo.';}
        else {value=vals.map(String).join(' · ');method='Các giá trị khác nhau';detail=index===1?'Độ tuổi là chiều nhân khẩu học duy nhất có trong file.':'Giữ nguyên cấu hình gốc, không cộng.';}
      } else if(costMapping[index]) {
        const [denominator,multiplier]=costMapping[index];raw=div(a.s[9],a.s[denominator],multiplier);value=raw==null?'Chưa có dữ liệu':fmt(raw,0)+' ₫';method='Tổng chi tiêu / tổng mẫu số'+(multiplier===1000?' × 1.000':'');detail='Chi phí của toàn bộ danh mục đã gộp, gồm mọi mục tiêu. Mẫu số: '+DATA.headers[denominator]+'. Không phải CPA riêng của chiến dịch hay mục tiêu.';
        if([18,32].includes(index))detail+=' Mẫu số là cộng dồn các dòng, có thể trùng người.';
      } else if(rateMapping[index]) {
        const [num,den,multiplier]=rateMapping[index];raw=div(a.s[num],a.s[den],multiplier);value=raw==null?'Chưa có dữ liệu':fmt(raw,index===17?3:2)+(index===17?' lần':'%');method='Tổng tử số / tổng mẫu số'+(multiplier===100?' × 100%':'');detail=DATA.headers[num]+' / '+DATA.headers[den]+'.';
        if([17,37,38,84].includes(index))detail+=' Chỉ là tỷ số trên số cộng dồn; không phải tần suất / tỷ lệ người duy nhất toàn kỳ.';
      } else if(index===72) {
        raw=a.duration;value=raw==null?'Chưa có dữ liệu':fmt(raw,2)+' giây (ước tính)';method='Trung bình gia quyền theo lượt phát video';detail='Σ(thời gian phát TB mỗi dòng × lượt phát) / Σ(lượt phát có thời gian). Chưa có tổng thời gian xem để xác nhận trung bình toàn kỳ.';
      } else {
        value=raw==null?vals.map(String).join(' · '):fmt(raw);
        if([11,21,24,39,42].includes(index)){method='Cộng dồn theo các dòng';detail='Có thể trùng người giữa ngày và chiến dịch. Không phải tổng người duy nhất của toàn kỳ.';}
        if(index===83){method='Cộng dồn số ước tính';detail='Đây là số nhớ quảng cáo ước tính cộng theo dòng; có thể trùng người giữa ngày và chiến dịch. Không phải phép đo nhân quả đã kiểm chứng.';}
        if([54,55].includes(index))detail+=' Hai cột tương tác Trang và bài viết có thể trùng; không cộng chúng với nhau.';
        if([58,61].includes(index))detail+=' Không cộng với số bắt đầu hội thoại / trả lời 7 ngày vì các hành động có thể trùng.';
        if(index===81)detail+=' Có cả lượt hiển thị không hợp lệ; khác cột lượt hiển thị chuẩn.';
        if([20,21].includes(index)&&raw===0)detail='File ghi 0 ở trường này; số phát video vẫn được ghi riêng ở các trường video.';
      }
      return {index,code,name,label:name,category:categoryAt(index),value,raw,available:values.length,
        nonzero:values.filter(v=>number(v)&&v!==0).length,method,detail,source};
    });
  }
  window.DB={aggregate,catalog,byAge,byDay,selectRows,resultTypes,fmt,ages,excelColumn};
})();

