/* =====================================================
   battle.js — 娱乐版「奇幻办公室」· 宝可梦式全战斗引擎 v2
   · 11 只办公室宝可梦（7 只可收服的办公成精 + 4 只领导首领）
   · 16×16 程序化像素精灵，canvas 渲染
   · 13 属性 + 克制表 · 中毒/麻痹 · 攻防强化阶段 · 首领二阶段
   · 收服球（零食球/奶茶球/年终奖球）· 道具 · 换人 · 逃跑 · 全场合势
   · LLM 热血解说（超时+离线兜底，完全离线可玩）
   依赖 game.html 全局：$ S rnd ri pick clamp esc ic toast say logIt applyFx llm saveGame render isFun
===================================================== */
(function(){
"use strict";
if(!window||!window.Game)return;

/* ---------------- 基础 ---------------- */
const POKES={},MOVES={},TYPE_COLOR={
 "普通":"#b9a06a","加班":"#ff8a4d","文书":"#8f9fff","咖啡":"#c98a4b","水":"#5db2e8","毒":"#b06ad0",
 "绩效":"#ffd166","幽灵":"#8f7ae0","机房":"#6fd0c8","花园":"#7ac05a","墨水":"#7f8fd6","电":"#ffd93d","资本":"#e05555"};
const CHART={咖啡:{加班:1.5},加班:{文书:1.5},文书:{咖啡:1.5},水:{咖啡:1.5},电:{水:1.5},花园:{电:1.5},
 墨水:{文书:1.5},幽灵:{机房:1.5},机房:{幽灵:1.5},毒:{绩效:1.5},绩效:{毒:0.5}};
function typeMult(mt,t1,t2){let m=1;if(CHART[mt]){m*=(CHART[mt][t1]||1);m*=(CHART[mt][t2]||1)}
 if(t1==="资本"||t2==="资本")m*=0.85;return m}

const Battle={_fast:false,_noLLM:false};
const wait=ms=>new Promise(r=>setTimeout(r,Battle._fast?0:ms));

/* ---------------- 招式 ---------------- */
function mv(id,o){MOVES[id]=o}
mv("badge_shot",{n:"工牌弹射",t:"普通",p:28});
mv("badge_dash",{n:"打卡冲刺",t:"普通",p:34,acc:85});
mv("slack",{n:"摸鱼回血",t:"普通",heal:20});
mv("badge_guard",{n:"工牌护盾",t:"普通",fx:"defUp"});
mv("soil_punch",{n:"翻土重拳",t:"花园",p:30});
mv("wish_heal",{n:"许愿树祝福",t:"花园",heal:22});
mv("fert_blast",{n:"肥料爆发",t:"花园",p:42,acc:72});
mv("worm_bite",{n:"蚯蚓之咬",t:"毒",p:24,fx:"poison25"});
mv("marker_slam",{n:"记号猛击",t:"墨水",p:34});
mv("eraser_beam",{n:"擦除光束",t:"普通",p:24});
mv("circle_buff",{n:"画个圈圈",t:"墨水",fx:"atkUp"});
mv("ink_leak",{n:"漏墨",t:"墨水",p:20,fx:"poison25"});
mv("jam_bite",{n:"卡纸撕咬",t:"文书",p:32});
mv("paper_storm",{n:"废纸风暴",t:"文书",p:24,fx:"atkDown25"});
mv("duplex_heal",{n:"双面打印",t:"普通",heal:18});
mv("ink_splash",{n:"墨汁飞溅",t:"墨水",p:26});
mv("americano",{n:"美式重锤",t:"咖啡",p:30});
mv("espresso",{n:"浓缩炮",t:"咖啡",p:44,acc:78});
mv("drip",{n:"滴漏",t:"水",p:22,acc:101});
mv("foam_para",{n:"奶盖泡泡",t:"咖啡",p:20,fx:"para30"});
mv("water_cannon",{n:"咕咚水炮",t:"水",p:32});
mv("water_splash",{n:"泼水",t:"水",p:22});
mv("warm_heal",{n:"保温待机",t:"水",heal:20});
mv("ice_guard",{n:"冰块护体",t:"水",fx:"defUp"});
mv("fan_slash",{n:"电风斩",t:"电",p:34});
mv("fan_gust",{n:"摇头风暴",t:"电",p:24});
mv("cool_heal",{n:"散热",t:"普通",heal:18});
mv("zap_para",{n:"高频嗡鸣",t:"电",p:26,fx:"para30"});
mv("ppt_bomb",{n:"PPT轰炸",t:"加班",p:38});
mv("deduct_claw",{n:"扣绩效之爪",t:"加班",p:30,fx:"atkDown"});
mv("pie_heal",{n:"画饼光线",t:"加班",heal:26});
mv("overtime_tyrant",{n:"加班暴君",t:"加班",p:54});
mv("kpi_sting",{n:"绩效毒针",t:"毒",p:30,fx:"poison40"});
mv("kpi_claw",{n:"调岗之钳",t:"绩效",p:34});
mv("kpi_pressure",{n:"KPI压力",t:"绩效",p:24,fx:"atkDown"});
mv("kpi_fury",{n:"金蝎之怒",t:"毒",p:50});
mv("gw_flash",{n:"断电闪击",t:"机房",p:36});
mv("gw_heal",{n:"重启咏叹调",t:"幽灵",heal:24});
mv("gw_404",{n:"404",t:"幽灵",p:20,fx:"evadeAfter"});
mv("gw_storm",{n:"未找到风暴",t:"机房",p:30,fx:"multi2"});
mv("big_wave",{n:"裁员波",t:"资本",p:46});
mv("big_seal",{n:"岁月封印",t:"资本",p:28,fx:"atkDown"});
mv("big_opt",{n:"期权幻术",t:"资本",heal:30});
mv("big_tide",{n:"资本潮汐",t:"资本",p:34,fx:"multi2"});
function moveDesc(m){
 if(m.heal)return "回复"+m.heal+"HP";
 if(m.fx==="defUp")return "提升防御";
 if(m.fx==="atkUp")return "提升攻击";
 if(m.fx==="atkDown"||m.fx==="atkDown25")return "攻击×"+m.p+" · 降攻";
 if(m.fx==="poison25"||m.fx==="poison40")return "攻击×"+m.p+" · 中毒";
 if(m.fx==="para30")return "攻击×"+m.p+" · 麻痹";
 if(m.fx==="evadeAfter")return "攻击×"+m.p+" · 下次闪避";
 if(m.fx==="multi2")return "攻击×"+m.p+" · 两段";
 return "攻击×"+m.p+(m.acc&&m.acc<100?" · 命中率"+m.acc+"%":"");}

/* ---------------- 像素精灵（16×16） ---------------- */
function px(rows,pal){return{spr:rows,pal:pal}}
/* 注册宝可梦 */
function poke(key,o){POKES[key]=o}
poke("badge",{name:"工牌精灵",t1:"普通",t2:"普通",base:{hp:36,atk:11,def:10,spd:12},
 moves:["badge_shot","badge_dash","slack","badge_guard"],wild:[],starter:true,
 flavor:"新人的保护贴，贴上去就不肯下来。据说工牌上贴的东西，公司制度管不着。",
 art:px([
"......KKKK......",".....KK..KK.....",".....K....K.....","....KKKKKKKK....",
"..WWWWWWWWWWWW..","..BBBBBBBBBBBB..","..WWWWWWWWWWWW..","..WWKKWWWWKKWW..",
"..WWKKWWWWKKWW..","..WPWWWWWWWWPW..","..WWWWWKKWWWWW..","..WGGGGWWGGGGW..",
"..WGGGGGWGGGGW..","..WWWWWWWWWWWW..","................","................"],
{B:"#3f7bd9",W:"#f4f7fb",K:"#20242c",P:"#f2a0b1",G:"#9aa4b5"})});
poke("mole",{name:"摩尔灵",t1:"花园",t2:"普通",base:{hp:34,atk:12,def:9,spd:10},
 moves:["soil_punch","wish_heal","fert_blast","worm_bite"],wild:["desk"],
 flavor:"你工位花盆里住着的土拨鼠，把硬盘缓存翻了三遍，找到了一株许愿树。",
 art:px([
"................","................","......MMMM......",".....MMMMMM.....",
"....MMMMMMMM....","....MWWMMWWM....","....MKKMMKKM....","....MMMMMMMM....",
".....MDDDDM.....",".....MMMMMM.....","..GGGMMMMMMGGG..",".GGGGGMMDDMMGGG.",
".GGGGGMMDDMMGGG.","EEEEDDDDDDDDEEEE","................","................"],
{M:"#a5713d",D:"#6e4a26",W:"#f7f3ea",K:"#26201a",G:"#5d9c46",E:"#8a5a33"})});
poke("marker",{name:"白板马克笔王",t1:"墨水",t2:"普通",base:{hp:32,atk:13,def:9,spd:11},
 moves:["marker_slam","eraser_beam","circle_buff","ink_leak"],wild:["desk","meeting"],
 flavor:"白板上的王。它画圈，圈住的人都要被讨论。",
 art:px([
"................",".....Y..Y..Y....","....YYYYYYYY....","...YYYYYYYYYY...",
"...KKKKKKKKKK...","...IIIIIIIIII...","...IKKIIIIKII...","...IKKIIIIKII...",
"...IIIIIIIIII...","...IIKKIIKKII...","...IIIIIIIIII...","...IIIIIIIIII...",
"....IIIIIIII....",".....IIIIII.....","......IIII......","................"],
{Y:"#f2c879",K:"#262233",I:"#5a4fcf"})});
poke("printer",{name:"卡纸君",t1:"普通",t2:"文书",base:{hp:40,atk:12,def:11,spd:8},
 moves:["jam_bite","paper_storm","duplex_heal","ink_splash"],wild:["meeting"],
 flavor:"三层楼那台老打印机的成精体。每卡一次纸，它就长大一圈。",
 art:px([
"................","...W........W...","...WW......WW...","..WWWWWWWWWWWW..",
"..WWWWWWWWWWWW..",".BBBBBBBBBBBBBB.",".BKBBBBBBBKKBBB.",".BKBBBBBBBKKBBB.",
".BBBBBBBBBBBBBB.",".BRRBBBBBBRRBBB.",".BBBBBBBBBBBBBB.",".DDDDDDDDDDDDDD.",
"................","................","................","................"],
{W:"#e8ecf2",B:"#5a6472",K:"#171a20",R:"#e05548",D:"#3a414c"})});
poke("coffee",{name:"咖啡机妖",t1:"咖啡",t2:"水",base:{hp:36,atk:13,def:10,spd:9},
 moves:["americano","espresso","drip","foam_para"],wild:["pantry"],
 flavor:"茶水间那台咖啡机。没人碰它，它自己会磨豆——磨的是谁的神经。",
 art:px([
"........s.s.....",".......s.s......","....MMMMMMMMMM..",".MMMMMMMMMMMMMM.",
".MkkMMMMMMMMkkM.",".MkkMMMMMMMMkkM.",".MMKKMMMMMMKKMM.",".MMKKMMMMMMKKMM.",
".MMMMMMMMMMMMMM.",".MMMCCCCMMMMMMM.",".MMCCCCCCCCCMMM.",".DDDDDDDDDDDDDD.",
"................","................","................","................"],
{M:"#6a5140",k:"#2a1f16",K:"#ffd166",C:"#c98a4b",D:"#42352a",s:"#c8ccd4"})});
poke("cup",{name:"水杯精",t1:"水",t2:"普通",base:{hp:38,atk:11,def:10,spd:12},
 moves:["water_cannon","water_splash","warm_heal","ice_guard"],wild:["pantry"],
 flavor:"你桌上那只 500ml 保温杯。里面一直有水，水温一直刚好能喝。",
 art:px([
".......D........","......DDD.......","......DWD.......",".....BBBBB......",
".....BTTTB......","....WBBBBBW.....","....WWWWWWW.....","....WKKWWKWW....",
"....WKKWWKWW....","....WPWWWWPW....","....WWWWWWWW....","....WKKKKKW.....",
"....WWWWWWWW....",".....WWWWWW.....","......WWWW......","................"],
{D:"#5db2e8",W:"#eef4f8",B:"#4a86c8",T:"#7fd4c8",K:"#233041",P:"#f2a0b1"})});
poke("fan",{name:"风扇精",t1:"电",t2:"普通",base:{hp:34,atk:12,def:9,spd:14},
 moves:["fan_slash","fan_gust","cool_heal","zap_para"],wild:["lobby"],
 flavor:"大堂那台风扇转了八年，去年体检说它比前台的工龄还长。",
 art:px([
"................","................",".....CCCCCC.....","....CCCCCCCC....",
"....CBCCCCBC....","....CBCCCCBC....","....CCCCBCCC....","....CCCCLCCC....",
"....CCCCBCCC....","....CBCCCCBC....","....CBCCCCBC....","....CCCCCCCC....",
".....CCCCCC.....","........LL......",".......LLLL.....","......LLLLLL...."],
{C:"#8a94a6",B:"#3f7bd9",L:"#5a6472"})});
poke("zhou",{name:"PPT暴龙",t1:"普通",t2:"加班",boss:{lv:38,leader:"周主管"},
 base:{hp:140,atk:22,def:14,spd:12},m1:["ppt_bomb","deduct_claw","pie_heal"],p2:"overtime_tyrant",
 flavor:"周主管气场实体化。它嘴里的每一页PPT，都是一次加班。",
 art:px([
"................","....GGGGGG......","...GGGGGGGG.....","...GWWGGGGGG....",
"...GKWGGKGGG....","...GGGGGGGGG....","....GGGGGGG.....","..GGGDDDDGGG....",
".GGGDRRRRDDGG...",".GWWGGRRRGGGG...",".GWYWGGRRGGGG...",".GWWGGGGGGGGG...",
"..GGGDDDDGGGG...","...GGGDDGGGG....","...GGG..GGG.....","...GG....GG....."],
{G:"#5d9c46",D:"#3a6b2e",W:"#f4f7fb",K:"#1c2118",R:"#d64541",Y:"#f2c879"})});
poke("he",{name:"KPI金蝎",t1:"毒",t2:"绩效",boss:{lv:35,leader:"何姐"},
 base:{hp:125,atk:20,def:12,spd:14},m1:["kpi_sting","kpi_claw","kpi_pressure"],p2:"kpi_fury",
 flavor:"何姐的绩效考核表，长出了尾巴和钳子。尾刺是一支季度柱状图。",
 art:px([
".............K..","............GGG.","...........GGGG.","..........GGGG..",
"..........GGG...",".....GGGGGGG....","....GGGGGGGGG...","....GKGGGGKGG...",
"..GG.GGGGGGG.GG.",".GGG.GGGGGGG.GG.","....GGDDDDGG....","...GG.GGGG.GG...",
"..GG...GG...GG..","................","................","................"],
{G:"#d9a83c",D:"#8a6a1f",K:"#3a2c10"})});
poke("wei",{name:"404幽灵",t1:"幽灵",t2:"机房",boss:{lv:33,leader:"阿伟"},
 base:{hp:110,atk:18,def:10,spd:16},m1:["gw_flash","gw_heal","gw_404"],p2:"gw_storm",
 flavor:"机房凌晨三点的报错，凝聚成了一团光。它其实只是想被人夸一次。",
 art:px([
"................","....GGGGGGGG....","...GGGGGGGGGG...","..GGGGGGGGGGGG..",
"..GGKGGGGGGKGG..","..GGKGGGGGGKGG..","..GGGGGGGGGGGG..","..GGLGGGLGGGLGG.",
"..GGGGGGGGGGGG..","..GGGKKKKKGGG...","..GGGGGGGGGGGG..","..GGGGGGGGGGGG..",
".GGG.GG.GG.GGG..","................","................","................"],
{G:"#8f7ae0",K:"#1c1830",L:"#cfd6ff"})});
poke("big",{name:"退休之影·大老板",t1:"传说",t2:"资本",boss:{lv:60,leader:"大老板"},
 base:{hp:210,atk:26,def:16,spd:10},m1:["big_wave","big_seal","big_opt"],p2:"big_tide",
 flavor:"三年前'退休'的大老板。公司换了三代领导，他的椅子还是温的。",
 art:px([
"....TTTTTTTT....","...TTTTTTTTTT...","...TTSSSSSSTT...","...TSSSSSSSST...",
"...TSSRRSRRST...","...TSSSSSSSST...","...TTSSSSSSTT...","...TSSSSSSSST...",
"..SSSSSSSSSSSS..",".SSSSSSSSSSSSSS.",".SSSSSSSSSSSSSS.",".SSSSSSSSSSSSSS.",
"..TTTTTTTTTTTT..","..TT......TT....","..TT......TT....","................"],
{T:"#2a2438",S:"#14101f",R:"#e05548"})});

const WILD={desk:["mole","marker"],pantry:["coffee","cup"],meeting:["printer","marker"],lobby:["fan"]};
const DEX_KEYS=["badge","mole","marker","printer","coffee","cup","fan","zhou","he","wei","big"];
const TYPE_DEPT={"普通":"前台","花园":"天台花园","墨水":"会议室","文书":"总务科","咖啡":"茶水间","水":"茶水间","电":"机房","加班":"行政部","毒":"法务部","绩效":"人事科","幽灵":"已注销科","机房":"IT科","传说":"集团总部","资本":"集团总部"};
const BALLS={snack:{n:"零食球",base:.42,c1:"#f2c879",c2:"#e8b04a"},tea:{n:"奶茶球",base:.60,c1:"#c98a4b",c2:"#8a5a33"},bonus:{n:"年终奖球",base:.80,c1:"#ffd166",c2:"#d64541"}};

/* ---------------- 状态 ---------------- */
function ensurePoke(){
 if(!S)return;
 if(!S.poke)S.poke={party:[],caught:{},seen:[],dex:{},inv:{snack:3,tea:1,bonus:0,drink:1},wins:0};
 const p=S.poke;
 p.party=p.party||[];p.caught=p.caught||{};p.seen=p.seen||[];p.dex=p.dex||{};p.inv=p.inv||{snack:3,tea:1,bonus:0,drink:1};
 if(!p.party.includes("badge")){
  p.party.push("badge");p.caught.badge={lvl:5,hp:statFor("badge",5).hp};
  if(!p.seen.includes("badge"))p.seen.push("badge");p.dex.badge=true;saveGame();}
 for(const k of p.party){const c=p.caught[k];if(!c)continue;
  if(c.hp==null)c.hp=statFor(k,c.lvl).hp;}
}
function statFor(key,lvl){
 const p=POKES[key];
 if(p.boss)return{hp:p.base.hp,atk:p.base.atk,def:p.base.def,spd:p.base.spd};
 return{hp:p.base.hp+lvl*3,atk:Math.round(p.base.atk+lvl*2),def:p.base.def+lvl,spd:p.base.spd+Math.floor(lvl/2)};
}
function makeFighter(key,lvl){
 const p=POKES[key];const st=statFor(key,lvl);
 return{key,lvl,name:p.name,t1:p.t1,t2:p.t2,maxhp:st.hp,hp:st.hp,atk:st.atk,def:st.def,spd:st.spd,
  status:null,atkSt:0,defSt:0,evade:false,taunt:false,phase:false,
  moves:p.boss?p.m1.slice():p.moves.slice(),p2:p.boss?p.p2:null};
}
function partyRuntime(){
 const out=[];
 for(const k of S.poke.party){
  const c=S.poke.caught[k];if(!c)continue;
  const f=makeFighter(k,c.lvl);f.hp=clamp(c.hp||statFor(k,c.lvl).hp,0,f.maxhp);out.push(f);}
 return out;
}
function healParty(){
 if(!S||!S.poke)return;
 for(const k of S.poke.party){const c=S.poke.caught[k];if(c){c.hp=statFor(k,c.lvl).hp}}
}
function dexCount(){return S.poke?Object.keys(S.poke.dex).length:0}
function dexLine(){
 if(!S.poke)return"";
 const names=S.poke.party.map(k=>POKES[k].name).join("、")||"无";
 return "<br>图鉴 <b>"+dexCount()+'</b>/11 · 队伍：'+names;
}

/* ---------------- 音效（WebAudio 小合成器） ---------------- */
const Snd={on:(function(){try{return localStorage.getItem("officeMythSound")!=="0"}catch(e){return true}})(),ctx:null,
 init(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){this.ctx=null}}},
 tone(f,d,type,vol,delay,slide){
  if(!this.ctx)return;const t0=this.ctx.currentTime+(delay||0);
  const o=this.ctx.createOscillator(),g=this.ctx.createGain();
  o.type=type||"square";o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t0+d);
  g.gain.setValueAtTime(vol||.12,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);
  o.connect(g);g.connect(this.ctx.destination);o.start(t0);o.stop(t0+d+.02);},
 play(nm){
  if(!this.on)return;this.init();if(!this.ctx)return;
  try{
   if(nm==="click")this.tone(760,.05,"square",.06);
   else if(nm==="hit")this.tone(190,.13,"square",.14,0,70);
   else if(nm==="super"){this.tone(240,.09,"square",.14,0,120);this.tone(360,.12,"square",.14,.08,180)}
   else if(nm==="heal"){this.tone(420,.1,"sine",.12,0,840);this.tone(620,.12,"sine",.1,.09,1240)}
   else if(nm==="throw")this.tone(640,.22,"sine",.1,0,180);
   else if(nm==="shake")this.tone(150,.07,"square",.12);
   else if(nm==="catch"){[523,659,784].forEach((f,i)=>this.tone(f,.12,"square",.12,i*.11))}
   else if(nm==="win"){[523,659,784,1046].forEach((f,i)=>this.tone(f,.14,"square",.13,i*.13))}
   else if(nm==="lose"){[440,349,293,220].forEach((f,i)=>this.tone(f,.16,"triangle",.13,i*.15))}
   else if(nm==="phase")this.tone(70,.5,"sawtooth",.16,0,45);
  }catch(e){}
 }};

/* ---------------- 战斗对象 ---------------- */
let BT=null;
let _twIv=null,_twDone=null;
const bLog=(line)=>{if(!BT)return;BT.log.push(line);
 const el=$("b2log");if(!el)return;
 el.innerHTML=BT.log.slice(-14).map(l=>'<div class="b2ln">'+esc(l)+"</div>").join("");
 if(Battle._fast){el.scrollTop=el.scrollHeight;return}
 if(_twIv){clearInterval(_twIv);_twIv=null}
 const nl=el.children[el.children.length-1];
 const full=nl.textContent;nl.textContent="";
 let i=0;
 _twDone=()=>{if(_twIv){clearInterval(_twIv);_twIv=null}nl.textContent=full};
 _twIv=setInterval(()=>{i+=2;nl.textContent=full.slice(0,i);el.scrollTop=el.scrollHeight;if(i>=full.length){clearInterval(_twIv);_twIv=null}},16);
};

function openBattleModal(){
 const modal=$("modal");
 $("overlay").classList.remove("hidden");
 modal.className="card battle b2";
}
function closeBattleModal(){
 if(BT&&BT._kd)document.removeEventListener("keydown",BT._kd);
 $("overlay").classList.add("hidden");
 BT=null;
 render();
}
function locName(){return LOCS[S.loc]?LOCS[S.loc].name:"办公室"}
function locBg(){const L=LOCS[S.loc];return L?L.bg:""}

/* ---------------- 渲染 ---------------- */
function chip(t){return '<span class="b2-chip" style="border-color:'+TYPE_COLOR[t]+';color:'+TYPE_COLOR[t]+'">'+t+"</span>"}
function hpColor(p){return p>.5?"#5fce8f":p>.25?"#f2c879":"#e06060"}
function spriteCanvas(key,scale){
 const cv=document.createElement("canvas");
 cv.width=16*scale;cv.height=16*scale;
 const p=POKES[key];const g=cv.getContext("2d");if(!g)return cv
 p.art.spr.forEach((row,y)=>{
  if(row.length!==16&&typeof console!=="undefined")console.warn("[battle] 精灵行宽错误 "+key+" 第"+(y+1)+"行: "+row.length);
  for(let x=0;x<16;x++){const c=row[x];if(!c||c===".")continue;
  g.fillStyle=p.art.pal[c]||"#ff00ff";g.fillRect(x*scale,y*scale,scale,scale)}});
 return cv;
}
function statusChips(f){
 const s=[];
 if(f.status==="poison")s.push('<span class="b2-st po">中毒</span>');
 if(f.status==="para")s.push('<span class="b2-st pa">麻痹</span>');
 if(f.atkSt>0)s.push('<span class="b2-st up">攻+'+f.atkSt+"</span>");
 if(f.atkSt<0)s.push('<span class="b2-st dn">攻'+f.atkSt+"</span>");
 if(f.defSt>0)s.push('<span class="b2-st up">防+'+f.defSt+"</span>");
 if(f.defSt<0)s.push('<span class="b2-st dn">防'+f.defSt+"</span>");
 if(f.taunt)s.push('<span class="b2-st po">分心</span>');
 return s.join("");
}
function plate(f,side){
 const p=f.hp/f.maxhp;
 const pct=p*100;
 BT._pw=BT._pw||{};
 const oldw=BT._pw[side]!=null?BT._pw[side]:pct;
 BT._pw[side]=pct;
 const w0=Battle._fast?pct:oldw;
 return '<div class="b2-plate"><div class="b2-plate-r1"><b>'+esc(f.name)+'</b> <span class="b2-lv">Lv.'+f.lvl+"</span> "
  +chip(f.t1)+(f.t2!==f.t1?chip(f.t2):"")+"</div>"
  +'<div class="b2-hp"'+(Battle._fast?"":' data-new="'+pct.toFixed(1)+'%"')+'><i class="hpg" style="width:'+w0.toFixed(1)+'%"></i><i class="hpm" style="width:'+w0.toFixed(1)+'%;background:'+hpColor(p)+'"></i></div>'
  +'<div class="b2-hptxt">HP '+f.hp+"/"+f.maxhp+"</div>"+'<div class="b2-sts">'+statusChips(f)+"</div></div>";
}
function bRender(){
 if(!BT)return;
 const b=BT;
 const cmd=b.cmdHTML();
 $("modal").innerHTML=
  '<div class="b2-head"><span class="eyebrow">娱乐版 · 宝可梦式对战</span><span class="b2-loc">'+ic("spark")+esc(locName())+"</span>"
  +(b.wild?'<span class="b2-tag wild">野生遭遇</span>':'<span class="b2-tag boss">领导对决</span>')
  +'<span class="sp"></span><button class="pxbtn" id="b2snd" title="战斗音效">'+(Snd.on?"♪ 开":"♪ 关")+"</button></div>"
  +'<div class="b2-arena" id="b2arena" style="background-image:url(\''+locBg()+'\')">'
  +'<div class="b2-hype'+(b.hype>=100?" max":"")+'"><span><span class="cup"></span>全场合势'+(b.hype>=100?" · 沸腾!":b.hype)+'</span><div class="tr"><i style="width:'+clamp(b.hype,0,100)+'%"></i></div></div>'
  +'<div class="b2-side b2-foe'+(b.foe.phase?" b2-phase":"")+'"><div class="b2-plate-wrap foe">'+plate(b.foe,"foe")+'</div><div class="b2-sprite" id="b2fspr"></div></div>'
  +'<div class="b2-side b2-me"><div class="b2-sprite" id="b2mspr"></div><div class="b2-plate-wrap me">'+plate(b.me,"me")+"</div></div>"
  +'<div class="b2-fx" id="b2fx"></div></div>'
  +'<div class="b2-log" id="b2log">'+b.log.map(esc).join("\n")+"</div>"
  +'<div class="b2-cmd" id="b2cmd">'+cmd+"</div>"
  +'<div class="b2-team">'+b.party.map((f,i)=>
    '<div class="b2-tslot'+(f===b.me?" on":"")+'" title="'+esc(f.name)+' Lv.'+f.lvl+'"><b>'+esc(f.name)+'</b> <span>Lv'+f.lvl+"</span>"
    +'<div class="b2-hp"><i style="width:'+(f.hp/f.maxhp*100).toFixed(1)+'%;background:'+hpColor(f.hp/f.maxhp)+'"></i></div></div>').join("")+"</div>";
 const fspr=$("b2fspr"),mspr=$("b2mspr");
 if(fspr){fspr.innerHTML="";fspr.append(spriteCanvas(b.foe.key,10))}
 if(mspr){mspr.innerHTML="";mspr.append(spriteCanvas(b.me.key,10))}
 const lb=$("b2log");if(lb){lb.scrollTop=lb.scrollHeight;lb.onclick=()=>{_twDone&&_twDone()}}
 if(!Battle._fast){
  requestAnimationFrame(()=>{
   if(!BT)return;
   document.querySelectorAll(".b2-hp[data-new]").forEach(hp=>{
    const w=hp.getAttribute("data-new");
    const a=hp.querySelector(".hpm"),g=hp.querySelector(".hpg");
    if(a)a.style.width=w;
    if(g)g.style.width=w;
   });
  });
 }
 const snd=$("b2snd");if(snd)snd.onclick=()=>{Snd.on=!Snd.on;try{localStorage.setItem("officeMythSound",Snd.on?"1":"0")}catch(e){};bRender()};
 b.bindCmd();
}
/* 命令区 HTML（按模式） */
Battle.cmdHTML=function(){
 const b=BT;
 if(b.mode==="end")return b.endHTML();
 if(b.mode==="wait")return '<button class="primary b2-cont" id="b2cont">继续</button>';
 if(b.mode==="release")return '<div class="b2-subtitle">队伍满了！放出一只才能收服 '+esc(b.foe.name)+'</div><div class="b2-sub">'
  +b.party.map((f,i)=>'<button class="choice" data-rel="'+i+'">释放 '+esc(f.name)+"（Lv."+f.lvl+"）</button>").join("")
  +'<button class="choice" id="b2skipcap">算了，先不收了</button></div>';
 if(b.mode==="switch")return '<div class="b2-subtitle">谁上？</div><div class="b2-sub">'
  +b.party.filter(f=>f!==b.me).map(f=>'<button class="choice" data-swp="'+b.party.indexOf(f)+'" '+(f.hp<=0?"disabled":"")+'>'+esc(f.name)+(f.hp<=0?"（全灭）":"")+"</button>").join("")
  +'<button class="choice" id="b2forfeit">放弃战斗</button></div>';
 if(b.sub==="moves")return '<div class="b2-subtitle">选择招式 · '+esc(b.me.name)+"</div><div class='b2-sub'>"
  +b.me.moves.map(id=>{const m=MOVES[id];return '<button class="choice b2-mv" data-mv="'+id+'"><span>'+esc(m.n)+" "+chip(m.t)+'</span><small>'+moveDesc(m)+"</small></button>"}).join("")
  +'<button class="choice" id="b2back">← 返回</button></div>';
 if(b.sub==="bag")return '<div class="b2-subtitle">道具包</div><div class="b2-sub">'
  +Object.keys(BALLS).map(k=>'<button class="choice" data-ball="'+k+'" '+((b.inv[k]||0)<=0?"disabled":"")+'><span>'+BALLS[k].n+" ×"+(b.inv[k]||0)+'</span><small>收服率'+(BALLS[k].base*100|0)+"%</small></button>").join("")
  +'<button class="choice" data-item="drink" '+((b.inv.drink||0)<=0?"disabled":"")+'><span>能量饮料 ×'+(b.inv.drink||0)+'</span><small>出战满血</small></button>'
  +'<button class="choice" data-item="snack" '+(S.snacks<=0?"disabled":"")+'><span>零食 ×'+S.snacks+'</span><small>回45HP · 25%对方分心</small></button>'
  +'<button class="choice" id="b2back">← 返回</button></div>';
 if(b.sub==="team")return '<div class="b2-subtitle">更换出战</div><div class="b2-sub">'
  +b.party.map((f,i)=>'<button class="choice" data-swp="'+i+'" '+(f===b.me?"disabled":"")+(f.hp<=0?" disabled":"")+'>'+esc(f.name)+"（Lv."+f.lvl+"）"+(f===b.me?" · 出战中":"")+(f.hp<=0?" · 全灭":"")+"</button>").join("")
  +'<button class="choice" id="b2back">← 返回</button></div>';
 /* 主命令 */
 return '<button class="cbtn" id="b2pmv">'+ic("zap")+"<b>招式</b><kbd>1</kbd></button>"
  +'<button class="cbtn" id="b2bag">'+ic("backpack")+"<b>道具</b><kbd>2</kbd></button>"
  +'<button class="cbtn" id="b2team">'+ic("users")+"<b>队伍</b><kbd>3</kbd></button>"
  +(b.wild?'<button class="cbtn" id="b2flee">'+ic("walk")+"<b>逃跑</b><kbd>4</kbd></button>"
          :'<span class="cbtn lock">'+ic("crown")+"<b>无法逃离</b><kbd>×</kbd></span>");
};
Battle.bindCmd=function(){
 const b=BT;if(!b)return;const $c=id=>$(id);
 const on=(id,fn)=>{const e=$(id);if(e)e.onclick=fn};
 if(b.mode==="wait"){on("b2cont",()=>{Snd.play("click");if(b.over)return;b.mode="cmd";b.sub=null;bRender()});return}
 if(b.mode==="end")return;
 if(b.mode==="release"){
  b.party.forEach((f,i)=>{const e=document.querySelector('[data-rel="'+i+'"]');if(e)e.onclick=async()=>{Snd.play("click");await releaseAndCapture(i)}});
  on("b2skipcap",async()=>{Snd.play("click");bLog("你把手里的球收回了口袋。");b.mode="cmd";await enemyTurn();await finishRound()});
  return}
 if(b.mode==="switch"){
  document.querySelectorAll("[data-swp]").forEach(e=>{e.onclick=async()=>{Snd.play("click");await doSwitch(parseInt(e.dataset.swp))}});
  on("b2forfeit",async()=>{Snd.play("click");await forfeit()});
  return}
 if(b.sub==="moves"){
  document.querySelectorAll("[data-mv]").forEach(e=>{e.onclick=()=>{Snd.play("click");doPlayerMove(e.dataset.mv)}});
  on("b2back",()=>{Snd.play("click");b.sub=null;bRender()});return}
 if(b.sub==="bag"){
  document.querySelectorAll("[data-ball]").forEach(e=>{e.onclick=()=>{Snd.play("click");throwBall(e.dataset.ball)}});
  document.querySelectorAll("[data-item]").forEach(e=>{e.onclick=()=>{Snd.play("click");useItem(e.dataset.item)}});
  on("b2back",()=>{Snd.play("click");b.sub=null;bRender()});return}
 if(b.sub==="team"){
  document.querySelectorAll("[data-swp]").forEach(e=>{if(e.disabled)return;e.onclick=()=>{Snd.play("click");doSwitch(parseInt(e.dataset.swp),true)}});
  on("b2back",()=>{Snd.play("click");b.sub=null;bRender()});return}
 on("b2pmv",()=>{Snd.play("click");b.sub="moves";bRender()});
 on("b2bag",()=>{Snd.play("click");b.sub="bag";bRender()});
 on("b2team",()=>{Snd.play("click");b.sub="team";bRender()});
 on("b2flee",async()=>{Snd.play("click");await tryFlee()});
 if(BT._kd)document.removeEventListener("keydown",BT._kd);
 BT._kd=function(e){
  if(!BT||BT.over)return;
  if(BT.mode==="wait"&&(e.key===" "||e.key==="Enter")){const c=$("b2cont");if(c){e.preventDefault();c.click()}}
  else if(BT.mode==="cmd"){
   const map={"1":"b2pmv","2":"b2bag","3":"b2team","4":"b2flee"};
   const el=map[e.key]&&$(map[e.key]);
   if(el&&!el.disabled)el.click();
  }
 };
 document.addEventListener("keydown",BT._kd);
};
Battle.endHTML=function(){
 const b=BT;
 return '<div class="b2-end"><div class="b2-end-title">'+b.endTitle+'</div><p>'+esc(b.endTxt)+"</p>"
  +'<button class="primary" id="b2done">回到工位</button></div>';
};

/* 飘字 / 动画 */
function floatText(side,text,cls){
 const fx=$("b2fx");if(!fx)return;
 const d=document.createElement("div");d.className="float-dmg "+(cls||"");d.textContent=text;
 d.style[side==="foe"?"right":"left"]="24%";d.style[side==="foe"?"top":"bottom"]="38%";
 fx.append(d);setTimeout(()=>d.remove(),1000);
}
function popText(text,color){
 const fx=$("b2fx");if(!fx)return;
 const d=document.createElement("div");d.className="pop";d.textContent=text;d.style.borderColor=color;d.style.color=color;
 d.style.left="50%";d.style.top="42%";d.style.transform="translateX(-50%)";
 fx.append(d);setTimeout(()=>d.remove(),1100);
}
 function burstStars(){
  const fx=$("b2fx");if(!fx||Battle._fast)return;
  for(let i=0;i<6;i++){
   const d=document.createElement("div");d.className="b2-star";
   d.style.left=(48+Math.random()*44-22)+"%";
   d.style.top=(28+Math.random()*34-17)+"%";
   d.style.width=d.style.height=(10+Math.random()*16)+"px";
   d.style.animationDelay=(Math.random()*0.3)+"s";
   fx.append(d);setTimeout(()=>d.remove(),1400);
  }
 }
 function confetti(){
  const host=$("b2arena");if(!host||Battle._fast)return;
  const cols=["#e8d9b5","#d4493c","#6b9bc9","#f0c46c","#8fd0a8"];
  for(let i=0;i<26;i++){
   const d=document.createElement("div");d.className="confetti";
   d.style.left=(Math.random()*100)+"%";
   d.style.background=cols[i%cols.length];
   d.style.animationDelay=(Math.random()*0.6)+"s";
   d.style.animationDuration=(2+Math.random()*1.2)+"s";
   host.append(d);setTimeout(()=>d.remove(),4200);
  }
 }
function anim(el,cls,ms){if(!el)return;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),ms)}
function shakeArena(){const a=$("b2arena");anim(a,"arena-shake",450)}

/* ---------------- 伤害 ---------------- */
function calcDamage(att,dft,mvO){
 let mult=typeMult(mvO.t,dft.t1,dft.t2);
 let atk=att.atk*(1+0.25*att.atkSt);
 let def=dft.def*(1+0.25*dft.defSt);
 let dmg=mvO.p*atk/(def*2.2)*mult;
 dmg*=rnd(0.85,1.15);
 const crit=Math.random()<0.08;if(crit)dmg*=1.5;
 if(sideOf(att)==="me"&&BT&&BT.hype>=100)dmg*=1.25;
 return{dmg:Math.max(1,Math.round(dmg)),mult,crit};
}
async function hitAnim(side){
 const el=$(side==="foe"?"b2fspr":"b2mspr");
 anim(el,"a-hit",420);Snd.play("hit");
}
async function atkAnim(side){
 const el=$(side==="foe"?"b2fspr":"b2mspr");
 anim(el,side==="foe"?"a-atk-r":"a-atk",400);
 await wait(180);
}
async function faintAnim(side){
 const el=$(side==="foe"?"b2fspr":"b2mspr");
 anim(el,"a-faint",600);Snd.play("lose");await wait(550);
}

/* ---------------- LLM ---------------- */
const BOSS_LINE_FB={
 zhou:"'正好，新人。让你见识一下本公司的企业文化——PPT文化。'",
 he:"'HR的建议很简单：适应，或者调岗。让金蝎来帮你评估。'",
 wei:"'404 Not Found。这场战斗……被找到了。'",
 big:"'我退休三年了。但资本，从不下班。'"};
async function bossLine(key){
 const fb=BOSS_LINE_FB[key]||"'接招吧，新人。'";
 if(Battle._noLLM)return fb;
 try{
  if(llmOK===false)return fb;
  const t=await llm([{role:"user",content:"在热血搞笑的职场宝可梦对战游戏里，为<"+POKES[key].boss.leader+">（领导，指挥"+POKES[key].name+"）写一句开场挑衅台词（50字内，热血/搞笑，符合领导人设）。只输出这一句台词，不要引号不要前缀。"}],{maxTokens:60,temp:1,timeout:12000});
  const s=String(t||"").trim().replace(/^["'“”‘']+|["'“”‘']+$/g,"");
  return (s&&s.length<80)?s:fb;
 }catch(e){return fb}
}
async function roundComment(summary){
 if(Battle._noLLM)return null;
 try{
  if(llmOK===false)return null;
  const t=await llm([{role:"user",content:"你是热血动漫风战斗解说员。对这场办公室宝可梦对局的这一回合，写一句不超过40字的解说，热血、有旁白感，可带感叹号。本回合："+summary+"只输出这一句。"}],{maxTokens:60,temp:1,timeout:12000});
  const s=String(t||"").trim();
  return (s&&s.length<90)?("解说："+s):null;
 }catch(e){return null}
}

/* ---------------- 战斗启动 ---------------- */
function startBattleCore(key,ctx,wild){
 const p=POKES[key];if(!p)return false;
 ensurePoke();
 const party=partyRuntime();
 if(!party.length||!party.some(f=>f.hp>0)){toast("队伍全灭，明天上班回满","#e06060");return false}
 if(!S.poke.seen.includes(key))S.poke.seen.push(key);
 const foe=wild?makeFighter(key,5+S.day):makeFighter(key,p.boss.lv);
 const me=party.find(f=>f.hp>0);
 BT={key,foe,me,party,turn:0,hype:clamp(10+S.intel*3+S.allies.length*6+(S.st.qi>30?((S.st.qi-30)>>2):0),10,70),
  wild:!!wild,inv:S.poke.inv,log:[],mode:"wait",sub:null,busy:false,over:false,
  endTitle:"",endTxt:"",
  cmdHTML:Battle.cmdHTML.bind(Battle),bindCmd:Battle.bindCmd.bind(Battle),endHTML:Battle.endHTML.bind(Battle)};
 openBattleModal();
 bLog("【对战开始】"+(ctx||(wild?("你在"+locName()+"撞见了它！"):p.boss.leader+"的气场，在你面前实体化了！")));
 bLog((wild?"野生的 ":"")+foe.name+"（Lv."+foe.lvl+" · "+foe.t1+"/"+foe.t2+"）登场！");
 bLog("你派出了 "+me.name+"（Lv."+me.lvl+"）！");
 return true;
}
Battle.startBattle=async function(key,ctx){
 if(!S||S.ended)return;
 if(BT&&!BT.over)return;
 if(!startBattleCore(key,ctx,false))return;
 const line=await bossLine(key);
 bLog("<"+POKES[key].boss.leader+">："+line);
 bRender();
};
Battle.wildRoll=function(){
 return !!(S&&!S.ended&&isFun()&&WILD[S.loc]&&Math.random()<0.35);
};
Battle.wildEncounter=async function(){
 if(BT&&!BT.over)return;
 ensurePoke();
 const key=pick(WILD[S.loc]);
 if(!startBattleCore(key,null,true))return;
 bLog("它歪了歪脑袋，似乎并不想上班。");
 bRender();
};

/* ---------------- 回合 ---------------- */
function other(side){return side==="me"?BT.foe:BT.me}
function sideOf(f){return f===BT.me?"me":"foe"}
function alive(f){return f&&f.hp>0}
function addHype(n){
 if(!BT||BT.hype>=100)return;
 BT.hype=clamp(BT.hype+n,0,100);
 if(BT.hype>=100){bLog("全场沸腾！！同事们拍桌呐喊，斗志拉满！（伤害+25%）");Snd.play("win")}
}
async function applyStatus(att,dft,mvO){
 const fx=mvO.fx;
 if(fx==="poison25"||fx==="poison40"){
  if(dft.status!=="poison"&&Math.random()<(fx==="poison40"?0.4:0.25)){dft.status="poison";bLog(dft.name+"中毒了！");popText("中毒!","#b06ad0")}
 }else if(fx==="para30"){
  if(dft.status!=="para"&&Math.random()<0.3){dft.status="para";bLog(dft.name+"被麻痹了，行动变得迟缓！");popText("麻痹!","#ffd166")}
 }else if(fx==="atkDown"){
  if(dft.atkSt>-3){dft.atkSt--;bLog(dft.name+"的攻击下降了！");popText("攻↓","#e06060")}
 }else if(fx==="atkDown25"){
  if(Math.random()<0.35&&dft.atkSt>-3){dft.atkSt--;bLog(dft.name+"的攻击下降了！")}
 }else if(fx==="evadeAfter"){
  dft.evade=true;bLog(dft.name+"的身影变得模糊……（下次攻击将落空）");
 }
}
async function doMove(att,dft,mvId){
 const m=MOVES[mvId];
 const aSide=sideOf(att);
 bLog((aSide==="me"?"":"对手 "+dft.name+" → ")+att.name+" 使出【"+m.n+"】！");
 if(m.heal){
  const h=Math.min(m.heal,att.maxhp-att.hp);att.hp+=h;
  floatText(aSide,"+"+h,"float-heal");Snd.play("heal");bRender();await wait(450);
  return;
 }
 if(m.fx==="atkUp"||m.fx==="defUp"){
  if(m.fx==="atkUp")att.atkSt=Math.min(3,att.atkSt+1);else att.defSt=Math.min(3,att.defSt+1);
  floatText(aSide,m.fx==="atkUp"?"攻↑":"防↑","float-heal");Snd.play("heal");bRender();await wait(450);
  return;
 }
 /* 攻击 */
 await atkAnim(aSide);
 const hits=m.fx==="multi2"?2:1;
 for(let i=0;i<hits;i++){
  if(m.fx==="multi2"&&i===1)bLog("二段冲击！");
  if(dft.evade){
   dft.evade=false;bLog("攻击落空了——404 Not Found！");popText("MISS","#8f7ae0");await wait(500);continue;
  }
  if(att.status==="para"&&Math.random()<0.25){
   bLog(att.name+"想移动，但麻痹让它僵在原地……");
   if(i===0){bLog("（本回合攻击取消）");break}
  }
  const acc=m.acc||100;
  if(Math.random()*100>acc){
   bLog("但是没有击中！");popText("MISS","#8fa0b3");await wait(480);continue;
  }
  const r=calcDamage(att,dft,m);
  dft.hp=Math.max(0,dft.hp-r.dmg);
  await hitAnim(sideOf(dft));
  floatText(sideOf(dft),String(r.dmg),r.crit?"float-crit":"");
  if(r.mult>1.001){popText("效果拔群！","#5fce8f");Snd.play("super");if(aSide==="me")addHype(10)}
  else if(r.mult<0.999){popText("不太有效……","#8fa0b3")}
  if(r.crit){popText("会心一击！","#f2c879");if(aSide==="me")addHype(8);shakeArena()}
  bLog("造成 "+r.dmg+" 点伤害"+(r.crit?"（会心一击）":"")+(r.mult>1.001?"（效果拔群）":r.mult<0.999?"（不太有效）":"")+"！");
  bRender();await wait(520);
  if(dft.hp<=0)break;
 }
 if(dft.hp>0&&m.fx)await applyStatus(att,dft,m);
 if(dft.hp<=0){
  bLog(dft.name+" 失去了战斗能力！");
  await faintAnim(sideOf(dft));
  if(sideOf(dft)==="foe")await victory();else await meFainted();
 }
 /* 首领二阶段 */
 if(alive(BT.foe)&&!BT.foe.phase&&BT.foe.hp<=BT.foe.maxhp*0.5){
  BT.foe.phase=true;Snd.play("phase");shakeArena();
  bLog("★ "+BT.foe.name+" 进入狂化状态！气场翻了三倍！");
  const el=$("b2fspr");if(el)el.parentElement.classList.add("b2-phase");
  bRender();await wait(450);
 }
}
function aiPick(){
 const f=BT.foe,mv=f.moves.map(id=>MOVES[id]);
 const heals=mv.filter(m=>m.heal);
 if(f.hp<f.maxhp*0.35&&heals.length&&Math.random()<0.55)return f.moves[mv.indexOf(heals[0])];
 if(f.phase&&f.p2&&Math.random()<0.4)return f.p2;
 const atk=mv.filter(m=>m.p);
 if(!atk.length)return f.moves[0];
 /* 状态招式优先（若对方无异常） */
 const st=atk.filter(m=>m.fx&&m.fx!=="multi2"&&!BT.me.status);
 if(st.length&&Math.random()<0.5)return f.moves[mv.indexOf(pick(st))];
 const w=atk.map(m=>m.p);let tot=w.reduce((a,c)=>a+c,0),r=Math.random()*tot;
 for(let i=0;i<atk.length;i++){r-=w[i];if(r<=0)return f.moves[mv.indexOf(atk[i])]}
 return f.moves[mv.indexOf(atk[atk.length-1])];
}
async function enemyTurn(){
 if(!BT||BT.over||!alive(BT.foe))return;
 const f=BT.foe;
 if(f.taunt){f.taunt=false;bLog(f.name+"被零食吸引走了，这一回合愣在原地……");bRender();await wait(500);return}
 const mvId=aiPick();
 await doMove(f,BT.me,mvId);
}
async function poisonTick(f,side){
 if(f.status==="poison"&&alive(f)){
  const d=Math.max(3,Math.round(f.maxhp*0.05));
  f.hp=Math.max(0,f.hp-d);
  bLog(f.name+"受到毒素的侵蚀（-"+d+"）");
  floatText(side,"-"+d,"float-poison");Snd.play("hit");bRender();await wait(420);
  if(f.hp<=0){
   bLog(f.name+" 失去了战斗能力！");
   await faintAnim(side);
   if(side==="foe")await victory();else await meFainted();
  }
 }
}
async function doPlayerMove(mvId){
 const b=BT;if(!b||b.busy||b.mode!=="cmd")return;
 b.busy=true;b.sub=null;
 const order=b.me.spd+(b.me.status==="para"?-Math.ceil(b.me.spd/2):0)
  >= b.foe.spd+(b.foe.status==="para"?-Math.ceil(b.foe.spd/2):0);
 if(order){
  await doMove(b.me,b.foe,mvId);
  if(!b.over)await enemyTurn();
 }else{
  await enemyTurn();
  if(!b.over&&b.mode!=="switch")await doMove(b.me,b.foe,mvId);
 }
 await finishRound();
}
async function finishRound(){
 const b=BT;if(!b||b.over)return;
 await poisonTick(b.me,"me");
 if(!b.over)await poisonTick(b.foe,"foe");
 if(!b.over){
  const c=await roundComment(b.log.slice(-4).join(" "));
  if(c)bLog(c);
 }
 b.turn++;
 b.busy=false;
 if(!b.over&&b.mode!=="switch")b.mode="wait";
 bRender();
}
async function doSwitch(idx,fromPanel){
 const b=BT;if(!b||b.busy)return;
 const f=b.party[idx];if(!f||f===b.me||f.hp<=0)return;
 b.busy=true;
 if(fromPanel){
  bLog("换下 "+b.me.name+"，换出 "+f.name+"！");
  b.me=f;b.sub=null;bRender();
  await wait(420);
  await enemyTurn();
  await finishRound();
  return;
 }
 /* 全灭换人：不消耗回合 */
 bLog("换出 "+f.name+"！");
 b.me=f;b.mode="cmd";b.sub=null;b.busy=false;bRender();
}
async function tryFlee(){
 const b=BT;if(!b||b.busy||!b.wild)return;
 b.busy=true;b.sub=null;
 const chance=clamp(0.6+(b.me.spd-b.foe.spd)*0.04,0.3,0.92);
 if(Math.random()<chance){
  bLog("你成功溜了！（摸鱼也是一种战斗方式）");
  bRender();await wait(600);
  endBattle("flee",null);
 }else{
  bLog("想跑，但"+b.foe.name+"堵住了退路！");
  bRender();await wait(500);
  await enemyTurn();
  await finishRound();
 }
}
async function useItem(id){
 const b=BT;if(!b||b.busy||b.mode!=="cmd")return;
 if(id==="drink"){
  if((b.inv.drink||0)<=0)return;
  b.busy=true;b.sub=null;b.inv.drink--;
  const h=b.me.maxhp-b.me.hp;b.me.hp=b.me.maxhp;
  bLog("你灌了口能量饮料，"+b.me.name+"满血复活（+"+h+"HP）！");
  floatText("me","+"+h,"float-heal");Snd.play("heal");bRender();
  await wait(500);await enemyTurn();await finishRound();
 }else if(id==="snack"){
  if(S.snacks<=0)return;
  b.busy=true;b.sub=null;S.snacks--;
  const h=Math.min(45,b.me.maxhp-b.me.hp);b.me.hp+=h;
  bLog("你掏出一包零食，边吃边指挥（+"+h+"HP）！");
  floatText("me","+"+h,"float-heal");Snd.play("heal");
  if(Math.random()<0.25){b.foe.taunt=true;bLog(b.foe.name+"闻到了辣条味，口水直流……");popText("对方分心!","#f2c879")}
  bRender();await wait(500);await enemyTurn();await finishRound();
 }
}
async function throwBall(ballId){
 const b=BT;if(!b||b.busy||b.mode!=="cmd")return;
 if((b.inv[ballId]||0)<=0)return;
 b.busy=true;b.sub=null;
 const ball=BALLS[ballId];
 /* 动画 */
 const fx=$("b2fx");
 if(fx&&!Battle._fast){
  const d=document.createElement("div");d.className="b2-ball";
  d.style.background="linear-gradient(180deg,"+ball.c1+" 46%,#20242c 46%,#20242c 54%,"+ball.c2+" 54%)";
  fx.append(d);await wait(720);
  d.style.animation="none";d.style.left="64%";d.style.bottom="56%";
  for(let i=0;i<3;i++){if(Math.random()>(0.25+b.inv[ballId]*0.1))break;d.classList.remove("shake");void d.offsetWidth;d.classList.add("shake");Snd.play("shake");await wait(420)}
  d.remove();
 }else{await wait(10)}
 b.inv[ballId]--;
 const foe=b.foe;
 const hpPct=foe.hp/foe.maxhp;
 let p=ball.base*(1-0.55*hpPct)*(foe.status?1.4:1)*(POKES[b.key].boss?0.42:1)*(b.key==="big"&&hpPct>0.3?0.6:1);
 const ok=Math.random()<p;
 if(ok){
  await bLog("咔哒——"+ball.n+" 晃了三下，静止了。");
  Snd.play("catch");addHype(6);
  burstStars();
  await doCapture(foe.lvl);
 }else{
  bLog(ball.n+"晃了几下，'啪'地弹开了！"+foe.name+"跳了出来！");
  Snd.play("hit");
  bRender();await wait(500);
  await enemyTurn();
  await finishRound();
 }
}
async function doCapture(lvl){
 const b=BT;
 S.poke.dex[b.key]=true;
 if(!b.wild){S.flags["pet_"+b.key]=true;S.flags.battleDoneDay=S.flags.battleDoneDay||{};S.flags.battleDoneDay[b.key]=S.day}
 if(b.party.length<3){
  S.poke.party.push(b.key);
  S.poke.caught[b.key]={lvl:lvl,hp:statFor(b.key,lvl).hp};
 }else{
  b.mode="release";b.pendingLvl=lvl;bRender();
  /* 等待玩家选择（release 面板由 bindCmd 处理） */
  return;
 }
 await finalizeCapture(lvl);
}
async function releaseAndCapture(idx){
 const b=BT;
 const rel=b.party[idx];
 b.party[idx]=makeFighter(b.key,b.pendingLvl);
 const si=S.poke.party.indexOf(rel.key);
 if(si>=0)S.poke.party[si]=b.key;
 S.poke.caught[b.key]={lvl:b.pendingLvl,hp:statFor(b.key,b.pendingLvl).hp};
 b.mode="cmd";
 await finalizeCapture(b.pendingLvl);
}
async function finalizeCapture(lvl){
 const b=BT;
 const p=POKES[b.key];
 bLog("★ "+p.name+"（Lv."+lvl+"）加入了你的队伍！图鉴已点亮！");
 toast("收服成功："+p.name,"#f2c879");
 confetti();
 if(!b.wild){logIt("收服领导宝可梦："+p.name);if(b.key==="big")S.flags.bigBeaten=true}
 const fx=b.wild?{mood:5}:{favor:15,mood:15,qi:10,kpi:5};
 b.endTitle=b.wild?"收服成功！":"收服成功！";
 b.endTxt=b.wild?p.name+"跟着你回了工位。它似乎已经接受了新的工位分配。"
  :CAP_TXT[b.key]||"它的归属权，从此写的是你的名字。";
 endBattle("captured",b.wild?null:fx);
}
const CAP_TXT={
 zhou:"周主管看着空无一物的投影仪陷入沉思。",
 he:"何姐看着它喝奶茶，喃喃：'乖，KPI要稳。'",
 wei:"阿伟给它挂上工牌：'新来的，欢迎。'",
 big:"全公司屏息。它坐进大老板的旧椅子，椅子发出一声叹息。"};
function syncPartyToSave(){
 const b=BT;
 for(const f of b.party){
  const c=S.poke.caught[f.key];
  if(c){c.lvl=f.lvl;c.hp=f.hp}
 }
}
async function victory(){
 const b=BT;if(!b||b.over)return;
 const p=POKES[b.key];
 confetti();
 if(b.wild){
  /* 掉落 */
  const r=Math.random();let drop="";
  if(r<0.45){S.snacks++;drop="零食×1"}
  else if(r<0.70){b.inv.tea=(b.inv.tea||0)+1;drop="奶茶球×1"}
  else if(r<0.90){b.inv.drink=(b.inv.drink||0)+1;drop="能量饮料×1"}
  else{b.inv.bonus=(b.inv.bonus||0)+1;drop="年终奖球×1"}
  bLog("战斗胜利！"+p.name+"化作一缕办公气息消散了。掉落："+drop+"。");
  S.poke.wins=(S.poke.wins||0)+1;
  levelUp(b.me,1);
  b.endTitle="胜利！";
  b.endTxt="你赢了野生的"+p.name+"。"+(drop?"掉落："+drop+"。":"");
  syncPartyToSave();saveGame();
  endBattle("win",{mood:4,qi:4});
  return;
 }
 /* 首领胜利 */
 b.endTitle="胜利！";
 b.endTxt=WINTXT[b.key]||p.name+"倒下了，化作一片PPT碎片。";
 if(b.key==="big")S.flags.bigBeaten=true;
 S.flags.battleDoneDay=S.flags.battleDoneDay||{};
 S.flags.battleDoneDay[b.key]=S.day;
 logIt("宝可梦对战获胜："+p.name);
 const drops=[];
 levelUp(b.me,1);
 if(Math.random()<0.3){b.inv.bonus=(b.inv.bonus||0)+1;drops.push("年终奖球×1")}
 if(drops.length)b.endTxt+="  战利品："+drops.join("、")+"。";
 syncPartyToSave();saveGame();
 endBattle("win",{favor:12,kpi:8,money:500,mood:12,qi:15});
}
const WINTXT={
 zhou:"周主管（不知道为什么）向你竖起了大拇指。你的PPT暴龙，收编进公司文化了。",
 he:"何姐的笑容僵了半秒——从此，'优化名单'上没有你的名字了。",
 wei:"机房灯闪了闪。阿伟说：404幽灵其实很希望被夸。",
 big:"整栋楼响起掌声——包括打印机、咖啡机和正门。你，就是新的传说。"};
function levelUp(f,n){
 if(!f)return;
 const before=f.lvl;
 f.lvl=Math.min(25,f.lvl+n);
 if(f.lvl===before)return;
 const st=statFor(f.key,f.lvl);
 f.maxhp=st.hp;f.atk=st.atk;f.def=st.def;f.spd=st.spd;
 f.hp=Math.min(f.maxhp,f.hp+Math.round(f.maxhp*0.3));
 bLog(f.name+" 升到了 Lv."+f.lvl+"！");
 toast(f.name+" Lv."+f.lvl,"#5fce8f");
 Snd.play("heal");
 addHype(5);
}
async function meFainted(){
 const b=BT;if(!b)return;
 const rest=b.party.filter(f=>f!==b.me&&f.hp>0);
 if(rest.length){
  b.me.hp=0;
  b.mode="switch";bRender();
 }else{
  await defeat();
 }
}
async function defeat(){
 const b=BT;if(!b||b.over)return;
 b.me.hp=0;
 syncPartyToSave();
 if(b.wild){
  b.endTitle="撤退了……";
  b.endTxt="你的队伍暂时退回了工位。它盯着你看了三秒，然后自己回茶水间了。";
  endBattle("lose",{mood:-4});
  return;
 }
 b.endTitle="斗败……";
 b.endTxt=LOSETXT[b.key]||"你的队伍溃散了。你在工位上趴了半小时才缓过来，同事在你的桌上放了一瓶脉动。";
 S.flags.battleDoneDay=S.flags.battleDoneDay||{};
 S.flags.battleDoneDay[b.key]=S.day;
 endBattle("lose",{mood:-12,qi:5,favor:-3});
}
const LOSETXT={
 zhou:"周主管拍了拍你的肩：'年轻人，加班是对你的锻炼。' 你信了，也趴了。",
 he:"何姐在系统里打了个勾。你感觉自己的KPI亮了一下。",
 wei:"404幽灵飘到你头顶：连接超时。",
 big:"你听见椅子吱呀一声。它说：'不错，有点资本的味道。'"};
async function forfeit(){
 const b=BT;if(!b)return;
 if(b.wild){b.endTitle="撤退了……";b.endTxt="你选择了战略性撤退。它耸了耸肩（如果它有肩的话）。";endBattle("lose",{mood:-2})}
 else await defeat();
}
function endBattle(reason,fx){
 const b=BT;if(!b)return;
 b.over=true;b.mode="end";
 if(fx)applyFx(fx,true);
 Snd.play(reason==="lose"?"lose":(reason==="win"||reason==="captured"?"win":"click"));
 syncPartyToSave();
 saveGame();
 bRender();
 const done=$("b2done");
 if(done)done.onclick=()=>{Snd.play("click");closeBattleModal()};
}

/* ---------------- 图鉴 / 队伍面板 ---------------- */
Battle.openDex=function(){
 if(!S)return;
 ensurePoke();
 if(BT&&!BT.over){toast("先打完这一仗！","#e06060");return}
 const modal=$("modal");$("overlay").classList.remove("hidden");modal.className="card dex";
 const pk=S.poke;
 let tab="team";
 const draw=()=>{
  const teams=pk.party.map((k,i)=>{
   const c=pk.caught[k]||{lvl:1,hp:0};const st=statFor(k,c.lvl);
   const p=POKES[k];
   return '<div class="dex-tm"><div class="dex-tm-art" data-dexart="'+k+'"></div>'
    +'<div class="dex-tm-info"><b>'+esc(p.name)+'</b> <span class="b2-lv">Lv.'+c.lvl+"</span> "+chip(p.t1)+(p.t2!==p.t1?chip(p.t2):"")
  +'<div class="dex-dept">部门 · '+(TYPE_DEPT[p.t1]||"综合部")+(p.t2!==p.t1&&TYPE_DEPT[p.t2]?" / "+TYPE_DEPT[p.t2]:"")+'</div>'
    +'<div class="b2-hp"><i style="width:'+(clamp(c.hp,0,st.hp)/st.hp*100).toFixed(1)+'%;background:'+hpColor(c.hp/st.hp)+'"></i></div>'
    +'<div class="dex-stats">HP '+c.hp+"/"+st.hp+' · 攻'+st.atk+' · 防'+st.def+' · 速'+st.spd+"</div>"
    +'<div class="dex-moves">'+(p.boss?p.m1:p.moves).map(id=>MOVES[id].n).join(" / ")+"</div>"
    +'<div class="dex-tmbtns">'
    +(i===0?'<span class="b2-lv">★ 队长</span>':'<button class="mini" data-lead="'+i+'">设为队长</button>')
    +(pk.party.length>1?'<button class="mini warn" data-free="'+i+'">释放</button>':'')
    +"</div></div></div>";
  }).join("")||'<div class="dex-empty">队伍空了——明天回满前，先安心上班吧。</div>';
  const dex=DEX_KEYS.map(k=>{
   const p=POKES[k];const seen=pk.seen.includes(k);const got=!!pk.dex[k];
   return '<div class="dex-cell'+(seen?"":" dim")+'"><div class="dex-cell-art" data-dexart="'+k+'" data-dim="'+(seen?"0":"1")+'"></div>'
    +'<b>'+(seen?esc(p.name):"？？？")+"</b>"
    +'<div class="dex-st '+(got?"got":seen?"seen":"none")+'">'+(got?"已收服":seen?"已调档":"档案封存")+"</div>"
    +(seen?'<div class="dex-flavor">'+esc(p.flavor)+"</div>":"")+"</div>";
  }).join("");
  const inv='<div class="dex-inv">'
   +Object.keys(BALLS).map(k=>'<div class="dex-inv-row">'+BALLS[k].n+' ×'+(pk.inv[k]||0)+"</div>").join("")
   +'<div class="dex-inv-row">能量饮料 ×'+(pk.inv.drink||0)+"</div>"
   +'<div class="dex-inv-row">零食 ×'+S.snacks+"</div>"
   +'<div class="dex-chart"><b>克制关系（1.5×）</b><br>咖啡→加班 → 文书 → 咖啡<br>水→咖啡 · 电→水 · 花园→电<br>墨水→文书 · 幽灵⇄机房 · 毒→绩效<br><span class="b2-lv">资本系受伤 -15%，免疫克制</span></div></div>';
  modal.innerHTML='<div class="eyebrow">娱乐版 · 我的宝可梦</div>'
   +'<div class="dex-tabs">'
   +'<button class="pxbtn'+(tab==="team"?" on":"")+'" data-dtab="team">队伍</button>'
   +'<button class="pxbtn'+(tab==="dex"?" on":"")+'" data-dtab="dex">图鉴 '+dexCount()+'/11</button>'
   +'<button class="pxbtn'+(tab==="items"?" on":"")+'" data-dtab="items">道具</button>'
   +'<span class="sp"></span><button class="pxbtn" id="dexclose">关闭</button></div>'
   +(tab==="team"?'<div class="dex-team">'+teams+"</div>":tab==="dex"?'<div class="dex-grid">'+dex+"</div>":inv);
  /* 画精灵 */
  modal.querySelectorAll("[data-dexart]").forEach(d=>{
   const k=d.getAttribute("data-dexart");
   d.innerHTML="";d.append(spriteCanvas(k,parseInt(d.getAttribute("data-dim")||"0")===1?4:5));
   if(d.getAttribute("data-dim")==="1")d.firstChild.style.filter="brightness(0)",d.firstChild.style.opacity=".3";
  });
  modal.querySelectorAll("[data-dtab]").forEach(e=>e.onclick=()=>{tab=e.getAttribute("data-dtab");draw()});
  $("dexclose").onclick=()=>{$("overlay").classList.add("hidden");if(!BT)render()};
  modal.querySelectorAll("[data-lead]").forEach(e=>e.onclick=()=>{
   const i=parseInt(e.getAttribute("data-lead"));
   const k=pk.party[i];pk.party.splice(i,1);pk.party.unshift(k);
   saveGame();toast(k&&POKES[k].name+" 成为队长","#5fce8f");draw();
  });
  modal.querySelectorAll("[data-free]").forEach(e=>e.onclick=()=>{
   const i=parseInt(e.getAttribute("data-free"));const k=pk.party[i];
   pk.party.splice(i,1);delete pk.caught[k];
   saveGame();toast("释放了 "+POKES[k].name,"#8fa0b3");draw();render();
  });
 };
 draw();
};

Battle.dexLine=dexLine;
Battle.healParty=healParty;
Battle.ensurePoke=ensurePoke;
/* ---------------- 测试钩子（无头截图/冒烟用） ---------------- */
Battle._autoContinue=function(){
  if(BT&&!BT.over&&BT.mode==="wait"){BT.mode="cmd";BT.sub=null;bRender()}};
Battle._cheat=function(o){
  if(!BT)return;
  if(o&&o.foeHp!=null)BT.foe.hp=clamp(o.foeHp,1,BT.foe.maxhp);
  if(o&&o.meHp!=null)BT.me.hp=clamp(o.meHp,1,BT.me.maxhp);
  if(o&&o.inv)Object.assign(BT.inv,o.inv);
  if(BT.mode!=="end")bRender();
};
Battle._state=function(){
  if(!BT)return null;
  return{mode:BT.mode,sub:BT.sub,over:BT.over,busy:BT.busy,key:BT.key,wild:BT.wild,turn:BT.turn,hype:BT.hype,
   foe:{name:BT.foe.name,hp:BT.foe.hp,max:BT.foe.maxhp,status:BT.foe.status||null,phase:!!BT.foe.phase},
   me:{name:BT.me.name,key:BT.me.key,hp:BT.me.hp,max:BT.me.maxhp,status:BT.me.status||null},
   party:BT.party.map(f=>({name:f.name,key:f.key,hp:f.hp})),
   inv:Object.assign({},BT.inv),endTitle:BT.endTitle};
};
Battle._testParty=function(){
 ensurePoke();
 const pk=S.poke;
 const want=[["badge",10],["coffee",9],["cup",8]];
 pk.party=want.map(w=>w[0]);
 for(const [k,l] of want){pk.caught[k]={lvl:l,hp:statFor(k,l).hp};if(!pk.seen.includes(k))pk.seen.push(k)}
 pk.inv={snack:3,tea:2,bonus:1,drink:2};
 saveGame();
};
window.Battle=Battle;
})();
