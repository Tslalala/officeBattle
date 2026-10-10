/* ============ 音效与氛围（WebAudio 纯合成，无外部资源） ============
 * 音效(Sfx)与战斗音效(Snd, battle.js)独立：Sfx 管全局 UI/剧情音效与办公室环境音+音乐盒。
 * 开关分别记忆在 localStorage: officeMythSfx / officeMythAmb。
 */
const Sfx={
 sfx:(function(){try{return localStorage.getItem("officeMythSfx")!=="0"}catch(e){return true}})(),
 amb:(function(){try{return localStorage.getItem("officeMythAmb")!=="0"}catch(e){return true}})(),
 ctx:null,_ambT:null,_ambNodes:null,_step:0,
 init(){
  if(this.ctx)return;
  try{
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC)return;
   this.ctx=new AC();
  }catch(e){this.ctx=null}
 },
 tone(f,d,type,vol,delay,slide){
  if(!this.ctx)return;
  try{
   const t0=this.ctx.currentTime+(delay||0);
   const o=this.ctx.createOscillator(),g=this.ctx.createGain();
   o.type=type||"sine";o.frequency.setValueAtTime(f,t0);
   if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t0+d);
   g.gain.setValueAtTime(vol||.1,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);
   o.connect(g);g.connect(this.ctx.destination);o.start(t0);o.stop(t0+d+.02);
  }catch(e){}
 },
 noise(d,vol,delay,rate){
  if(!this.ctx)return;
  try{
   const t0=this.ctx.currentTime+(delay||0);
   const n=Math.max(1,Math.floor(this.ctx.sampleRate*d));
   const buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate);
   const ch=buf.getChannelData(0);
   for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n);
   const s=this.ctx.createBufferSource(),g=this.ctx.createGain();
   s.buffer=buf;s.playbackRate.value=rate||1;
   g.gain.setValueAtTime(vol||.08,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);
   s.connect(g);g.connect(this.ctx.destination);s.start(t0);
  }catch(e){}
 },
 play(nm){
  if(!this.sfx)return;
  this.init();if(!this.ctx)return;
  try{
   if(this.ctx.state==="suspended")this.ctx.resume().catch(()=>{});
   if(nm==="click")this.tone(680,.045,"triangle",.05);
   else if(nm==="tick")this.tone(1150,.03,"sine",.035);
   else if(nm==="ok"){this.tone(520,.09,"sine",.09);this.tone(780,.12,"sine",.09,.08)}
   else if(nm==="bad"){this.tone(300,.16,"triangle",.09,0,150);this.tone(160,.2,"triangle",.07,.12,90)}
   else if(nm==="event"){this.tone(880,.3,"sine",.07);this.tone(660,.4,"sine",.06,.28)}
   else if(nm==="coin"){this.tone(1320,.07,"square",.05);this.tone(1760,.1,"square",.05,.07)}
   else if(nm==="salary"){[660,880,1100,1320].forEach((f,i)=>this.tone(f,.1,"triangle",.07,i*.09))}
   else if(nm==="task"){this.noise(.08,.1);this.tone(120,.12,"sine",.12,.02,70)}
   else if(nm==="taskdone"){[523,659,784,1046].forEach((f,i)=>this.tone(f,.11,"sine",.08,i*.1))}
   else if(nm==="day"){[784,784,1046].forEach((f,i)=>this.tone(f,.14,"sine",.07,i*.22))}
   else if(nm==="night"){this.tone(392,.5,"sine",.06);this.tone(294,.7,"sine",.05,.3)}
   else if(nm==="end"){this.tone(98,2.2,"sine",.16,0,80);this.tone(196,1.4,"sine",.06,.05,120)}
  }catch(e){}
 },
 /* ---------- 办公室环境音 + 音乐盒 ---------- */
 /* 旋律：C 大调轻快循环，300ms/步，16 步一循环（0=休止）——明快解压 */
 MELODY:[523.25,659.25,783.99,659.25,523.25,587.33,659.25,0,698.46,659.25,587.33,523.25,587.33,659.25,587.33,523.25],
 BASS:[130.81,0,174.61,0,130.81,0,196.00,0,174.61,0,130.81,0,146.83,0,196.00,0],
 startAmb(){
  if(!this.amb||this._ambT)return;
  this.init();if(!this.ctx)return;
  try{
   if(this.ctx.state==="suspended")this.ctx.resume().catch(()=>{});
   const ctx=this.ctx,nodes=[];
   /* 房间底噪：极轻白昼噪（低通，像窗外的白天气流） */
   const nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
   const nc=nb.getChannelData(0);
   for(let i=0;i<nc.length;i++)nc[i]=(Math.random()*2-1)*.4;
   const ns=ctx.createBufferSource();ns.buffer=nb;ns.loop=true;
   const nf=ctx.createBiquadFilter();nf.type="lowpass";nf.frequency.value=700;
   const ng=ctx.createGain();ng.gain.value=.006;
   ns.connect(nf);nf.connect(ng);ng.connect(ctx.destination);ns.start();
   nodes.push(ns,ng);
   /* 温暖底和弦：C3/E3/G3 正弦，极轻 */
   [130.81,164.81,196.00].forEach(f=>{
    const o=ctx.createOscillator(),og=ctx.createGain();
    o.type="sine";o.frequency.value=f;og.gain.value=.007;
    o.connect(og);og.connect(ctx.destination);o.start();
    nodes.push(o,og);
   });
   /* 音乐盒 + 随机键盘敲击 */
   this._step=0;
   this._ambT=setInterval(()=>{
    try{
     if(this.ctx.state!=="running")return;
     const i=this._step%16;this._step++;
     const f=this.MELODY[i];
     if(f){this.tone(f,.32,"triangle",.042);this.tone(f*2,.22,"sine",.012,.02)}
     const bf=this.BASS[i];
     if(bf)this.tone(bf,.5,"sine",.05);
     if(Math.random()<.1)this.noise(.04,.01,.01,.9+Math.random()*.4);
    }catch(e){}
   },300);
   this._ambNodes=nodes;
  }catch(e){this._ambT=null;this._ambNodes=null}
 },
 stopAmb(){
  if(this._ambT){clearInterval(this._ambT);this._ambT=null}
  if(this._ambNodes){this._ambNodes.forEach(n=>{try{n.stop&&n.stop()}catch(e){}try{n.disconnect&&n.disconnect()}catch(e){}});this._ambNodes=null}
 },
 ui(){
  try{
   const s=$("sndBtn"),a=$("ambBtn");
   if(s){s.innerHTML=ic("vol");s.classList.toggle("off",!this.sfx);s.title=this.sfx?"音效：开（点击关闭）":"音效：关（点击开启）"}
   if(a){a.innerHTML=ic("note");a.classList.toggle("off",!this.amb);a.title=this.amb?"背景音乐与办公室环境音：开（点击关闭）":"背景音乐：关（点击开启）"}
  }catch(e){}
 },
 toggleSfx(){this.sfx=!this.sfx;try{localStorage.setItem("officeMythSfx",this.sfx?"1":"0")}catch(e){};this.ui();if(this.sfx)this.play("click")},
 toggleAmb(){this.amb=!this.amb;try{localStorage.setItem("officeMythAmb",this.amb?"1":"0")}catch(e){};this.ui();
  if(this.amb)this.startAmb();else this.stopAmb();
  if(this.amb)this.play("ok")}
};