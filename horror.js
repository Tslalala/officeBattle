"use strict";

// 《请于下班前离开》：关键事实、代价和逃生条件由剧本控制。
// 大模型只解释玩家的自由文字并扮演 NPC，不决定新的线索或胜负。
const Horror=(()=>{
 const RULES=[
  "守则1：18:00 的第一次下班铃响起时，立即收拾东西。此后任何叫你留下的广播都不是公司广播。",
  "守则2：茶水间只有六只杯子。第七只即使写着熟人的名字，也不要碰。",
  "守则3：第四张工位可以查看，但不要用自己的账号登录。",
  "守则4：如果有人说昨天没见过你，请先附和，离开后再核对记录。",
  "守则5：监控室值班表只应有老赵一个名字。多出的姓名要从旧录像里查证，不要念出声。",
  "守则6：18:00 后不要照卫生间的镜子；镜中的门与真实出口不同。",
  "守则7：工牌失效时走消防楼梯，不要进电梯。"
 ];
 const CLUES={note:"陈序的便签",file:"2019 年人事档案",footage:"监控录像片段",backup:"门禁备份",route:"消防楼梯路线图"};
 const INCIDENTS=[
  {title:"第七只杯子",text:"茶水间的沥水架上多了一只杯子。杯口还冒着热气，杯身像是写着你熟悉的名字。",ok:"不碰杯子，记下它出现的时间",bad:"拿起来确认名字",good:"你记下了时间。杯子自己停住了晃动。",wrong:"杯底冰冷。你想起了一个从未认识的人，却忘了刚才是几点。",rule:2},
  {title:"倒写的名字",text:"监控室值班表上，老赵下面又多了一个倒写的名字。门后有人轻轻问：‘你能念出来吗？’",ok:"不念，去核对旧录像",bad:"把名字念出来",good:"你没有开口。显示器里那张空椅子慢慢转回原位。",wrong:"声音从你的喉咙里出来，却像另一个人。值班表又多了一行。",rule:5},
  {title:"失效的工牌",text:"门禁灯突然变红。电梯门适时打开，里面亮着一盏很暖的灯。",ok:"转身走消防楼梯",bad:"走进电梯",good:"楼梯间的声控灯逐级亮起，像有人在前面为你引路。",wrong:"电梯显示屏没有楼层，只有你的工号。门再次打开时，你少记得了一段路。",rule:7},
  {title:"第二次广播",text:"18:00 的铃声已经响过。广播又说：‘系统更正，所有员工请留在原位，等待主管点名。’",ok:"收拾东西，继续往出口走",bad:"留下等待点名",good:"你没有停下。广播在念到你的名字前戛然而止。",wrong:"广播准确念出了你的名字，连你没告诉任何人的小名都念了出来。",rule:1},
  {title:"昨日的空位",text:"林棠看着你，忽然说：‘我们昨天见过吗？’她的笔尖停在值班名单被擦去的位置。",ok:"先附和，稍后查记录",bad:"坚持说出昨天的每个细节",good:"她轻轻点头，悄悄把档案室的钥匙推到你手边。",wrong:"你说得越详细，她的眼神越陌生。你开始怀疑昨天是否真的存在。",rule:4}
 ];
 const EVIDENCE_ORDER=["note","file","footage","backup","route"];
 const label=()=>EVIDENCE_ORDER.map(k=>(S.horror.clues.includes(k)?"✓ ":"□ ")+CLUES[k]).join(" · ");
 function ensure(){
  S.rules=RULES.slice();
  if(!S.horror)S.horror={clues:[],violations:0,daysEscaped:0,chenTrust:0,incidentKeys:[],memo:[],routeKnown:false};
  if(!Array.isArray(S.horror.clues))S.horror.clues=[];
  if(!Array.isArray(S.horror.incidentKeys))S.horror.incidentKeys=[];
  if(!Array.isArray(S.horror.memo))S.horror.memo=[];
 }
 function remember(key){ensure();if(S.horror.clues.includes(key))return false;S.horror.clues.push(key);toast("获得线索："+CLUES[key],"#f2c879");logIt("发现"+CLUES[key]);saveGame();return true}
 function cost(san,weird,reason){
  ensure();S.horror.violations++;S.horror.memo.push({d:S.day,t:(typeof timeStr==="function"?timeStr():""),r:String(reason||"违反守则")});logIt("违反守则："+reason);applyFx({san:-san,weird});saveGame();
 }
 function finish(text,{clue=null,san=0,weird=0,violate=null}={}){
  if(clue)remember(clue);
  if(violate)cost(san||12,weird||10,violate);else if(san||weird)applyFx({san,weird});
  if(S.ended)return;
  say("旁白",text,[["继续，时间向前推进",()=>{saveGame();advanceTime()}]],"线索："+S.horror.clues.length+"/5");saveGame();
 }
 function renderActions(){
  ensure();const box=$("actions");box.replaceChildren();
  const title=document.createElement("h4");title.textContent="调查与逃生";box.append(title);
  const add=(txt,desc,fn)=>{const b=document.createElement("button");b.className="act";b.textContent=txt+" · "+desc;b.onclick=fn;box.append(b)};
  add("调查当前地点",LOCS[S.loc].name,investigate);
  add("自己写下行动","自由输入",freeInput);
  add("整理线索，等待","触发一件守则事件",event);
  add("查看线索","已找到 "+S.horror.clues.length+"/5",showClues);
  add("重读守则","违反会影响理智",openRules);
  if(S.loc==="lobby")add("尝试离开大楼","核对逃生路线",attemptEscape);
 }
 function showClues(){ensure();say("调查笔记","你把目前能确认的事实写在纸背面。\n"+label()+"\n\n违反守则 "+S.horror.violations+" 次。理智 "+S.st.san+"/100。",[["继续调查",()=>render()]],"仍可在任何地点自由输入行动")}
 function moveTo(k){
  ensure();if(!LOCS[k]||(LOCS[k].horror&&!isHorror()))return;
  if(k==="elevator"){
   S.loc=k;render();say("电梯间","电梯门开着。按键板上的楼层全都熄灭了。你想起守则第 7 条。",[["走消防楼梯",()=>moveTo("stairs")],["仍然进电梯",()=>finish("门关上的瞬间，镜面里的你没有转身。再开门时，你回到了同一层，却失去了一段记忆。",{violate:"乘坐异常电梯",san:16,weird:13})]]);return;
  }
  S.loc=k;render();saveGame();
  if(k==="wc"){say("卫生间","镜子蒙着雾，门却看得很清楚。墙上用胶带贴着一张守则第 6 条。",[["不看镜子，离开",()=>moveTo("desk")],["抬头照镜子",()=>S.slot>=6?finish("镜中的门在你身后打开，真正的门却关着。你闭眼摸索，终于回到走廊。",{violate:"18:00 后照镜子",san:12,weird:9}):say("旁白","镜子里只有疲惫的你。守则第 6 条要等 18:00 后才生效。",[["离开",()=>moveTo("desk")]])],["调查洗手台",investigate]]);return}
  say("旁白","你来到"+LOCS[k].name+"。"+(k==="lobby"?"大门就在眼前，但离开之前，你需要知道自己究竟在逃离什么。":""),[["调查这里",investigate],["自己写下行动",freeInput]],"可点击场景中的人物自由对话");
 }
 function investigate(){
  ensure();const done=k=>S.horror.clues.includes(k);
  const repeat=(t)=>say("旁白",t,[["换个地点",()=>render()],["自己写下行动",freeInput]]);
  switch(S.loc){
   case "desk":
    if(done("note"))return repeat("抽屉里的便签已被你收好。第四张工位的电脑仍亮着登录界面。");
    return say("第四张工位","抽屉中有一张便签：‘如果我明天不在，替我记住——我叫陈序。’电脑提示你用自己的账号登录。",[["收起便签，不登录",()=>finish("便签背面有一串旧员工编号。你拍下它，没有在电脑留下自己的名字。",{clue:"note",san:2})],["用自己的账号登录",()=>finish("系统欢迎你回来。屏幕上出现的是陈序的头像，工号却变成了你的。你匆忙拔掉电源，仍带走便签。",{clue:"note",violate:"用个人账号登录第四工位",san:15,weird:12})]]);
   case "archive":
    if(done("file"))return repeat("陈序的旧档案已在你的调查笔记里。纸页边缘显示 2019 年的调岗记录被撕走。");
    return say("档案室","2019 年的一盒人事档案被重新封过。封条上只有一个被刮花的姓氏。",[["核对便签编号，拆开档案",()=>finish(done("note")?"编号相同：陈序在 2019 年被标注为‘仍在岗’，但每年出勤天数都是零。你把复印页带走。":"你找到陈序的档案，但缺少编号佐证。你先抄下内容，之后还要与便签核对。",{clue:done("note")?"file":null,san:-2})],["把档案交给周主管",()=>finish("主管没有看档案，只问你有没有读过。你说没有。他替你把柜门锁上。",{san:-5,weird:3})]]);
   case "security":
    if(done("footage"))return repeat("监控片段已经拷贝。18:00 后的影像里，第四张椅子一直有人坐着。");
    return say("监控室","值班表上除老赵外还有一个倒写的名字。旧录像停在 18:00，第四张工位的椅子缓缓转动。",[["不念名字，复制录像",()=>finish("你复制了监控片段。画面角落里，陈序把一张卡塞进了消防楼梯的门缝。",{clue:"footage",san:-2})],["念出多出来的名字",()=>finish("监控画面里的所有人同时转向镜头。你按下静音键，却听见耳边有人答应。",{violate:"念出监控室多出的姓名",san:13,weird:11})]]);
   case "server":
    if(done("backup"))return repeat("门禁备份已写入你的 U 盘。它显示真正的出口在消防楼梯后方。");
    return say("机房","一台旧服务器仍在运行。门禁备份需要同时输入员工编号和录像时间戳。",[["用档案编号与监控时间戳恢复",()=>{if(!done("file")||!done("footage"))return repeat("还缺人事档案或监控片段。盲猜密码只会把记录锁得更深。");finish("备份恢复成功：每天 18:00 后，电梯会将员工送回第十层；消防楼梯才连着真正的大堂。",{clue:"backup",san:-3})}],["直接拔掉服务器电源",()=>finish("风扇停下后，门禁灯一盏盏熄灭。你重新合闸，知道不能靠破坏设备逃走。",{san:-7,weird:6})]]);
   case "stairs":
    if(done("route"))return repeat("你记得路线：先下两层，再穿过没有楼层标识的门，最后不要回应第二次广播。");
    return say("消防楼梯","安全门背后有一张被折起的楼层图。图中十层与一层之间多了一道没有编号的门。",[["对照录像和门禁备份标记路线",()=>{if(!done("footage")||!done("backup"))return repeat("图纸有两条互相矛盾的路线。你还需要录像和门禁备份来判断哪条通向出口。");finish("你确认了逃生路线：下两层，穿过无编号门，再继续往下。不要回应第二次广播。",{clue:"route",san:2})}],["随便选一扇门",()=>finish("你推开门，看见自己刚刚离开的楼梯平台。脚步声却从下一层追了上来。",{san:-8,weird:6})]]);
   case "pantry":
    return say("茶水间","架上摆着七只杯子。第七只杯口还冒着热气，旁边贴着一张写有‘陈序’的便利贴。",[["不碰杯子，拍下便利贴",()=>finish("照片里只有六只杯子，便利贴却清晰地留在了画面中。",{san:2})],["拿起第七只杯子",()=>finish("杯子里的倒影不是你。你放下它时，杯架上只剩六只。",{violate:"触碰第七只杯子",san:12,weird:11})]]);
   case "lobby":return attemptEscape();
   case "wc":return say("卫生间","洗手台的镜子渐渐起雾，雾上出现一条向左的箭头。",[["不理镜子，沿真实走廊离开",()=>finish("你扶着墙回到走廊。雾里的箭头没有跟出来。",{san:2})],["顺着镜中的箭头走",()=>finish("你撞上了墙，听见墙另一侧有人用你的声音道歉。",{violate:"相信镜中出口",san:13,weird:10})]]);
   default:return repeat("这里暂时没有能固定下来的证据。也许该去档案室、监控室或机房核对陈序留下的痕迹。");
  }
 }
 function event(){
  ensure();const pool=S.slot>=6?[3]:[0,1,2,4],idx=pool[(S.day+S.slot)%pool.length],ev=INCIDENTS[idx],key=S.day+":"+S.slot;
  if(S.horror.incidentKeys.includes(key))return say("旁白","异样的声音已经过去。你仍记得自己刚才做出的选择。",[["继续",advanceTime]]);
  S.horror.incidentKeys.push(key);saveGame();
  say("【守则事件】"+ev.title,ev.text,[[ev.ok,()=>finish(ev.good,{san:3})],[ev.bad,()=>finish(ev.wrong,{violate:"违反守则第 "+ev.rule+" 条",san:12,weird:10})],["翻看守则再决定",()=>{openRules();say("【守则事件】"+ev.title,ev.text,[[ev.ok,()=>finish(ev.good,{san:3})],[ev.bad,()=>finish(ev.wrong,{violate:"违反守则第 "+ev.rule+" 条",san:12,weird:10})]])}]],"也可以在右侧输入自己的做法");
 }
 function evening(){
  ensure();render();
  say("18:00 · 第一次下班铃","广播说：‘请于下班前离开。’你听见远处的电梯门打开。第二次广播似乎正在酝酿。",[["按守则准时离开，明天继续",()=>{S.horror.daysEscaped++;applyFx({san:5,mood:4});logIt("在第一次铃声后安全离开");saveGame();endDay()}],["核对证据，尝试彻底逃离",attemptEscape],["留下加班并继续调查",()=>{cost(10,8,"第一次铃声后仍留在楼内");if(!S.ended)say("旁白","灯一盏盏暗下去。你赶在第二次广播念出名字前离开。",[["进入下一天",endDay]])}]],"今晚的线索 "+S.horror.clues.length+"/5");
 }
 function attemptEscape(){
  ensure();const missing=EVIDENCE_ORDER.filter(k=>!S.horror.clues.includes(k));
  if(missing.length)return say("大堂出口","闸机上的名字一遍遍变化。你还不能确定哪条路能带你离开。缺少："+missing.map(k=>CLUES[k]).join("、")+"。",[["继续调查",()=>render()],["今晚先安全下班",()=>{if(S.slot>=6)endDay();else render()}]]);
  if(S.day<3)return say("大堂出口","证据已经拼齐，但门禁备份注明逃生通道只在第三天的第一次下班铃后短暂开放。先保住理智，等到第三天。",[["继续调查",()=>render()],["今晚按守则离开",()=>{if(S.slot<6)return say("旁白","第一次铃声还没响。你可以调查，或等到 18:00。",[["返回",()=>render()]]);S.horror.daysEscaped++;applyFx({san:5,mood:4});endDay()}]]);
  if(S.slot<6)return say("大堂出口","真正的出口只在 18:00 第一次铃响后开放。现在去那里，闸机会把你送回工位。今天仍要遵守守则，直到第一声铃响。",[["留意周围的异象",event],["继续准备",()=>render()]]);
  say("最后一道门","你握着便签、档案、录像、门禁备份和路线图。第二次广播说：‘请乘电梯，楼梯正在检修。’",[["按录像路线走消防楼梯",()=>{if(S.st.san<=0)return endGame("san0");S.horror.routeKnown=true;saveGame();say("消防楼梯","下两层。推开无编号门。身后传来陈序的声音：‘你忘了什么？’那声音停在门外，像是在替你挡住别的东西。",[["不回头，继续下楼",()=>endGame("escape")],["回头寻找陈序",()=>{cost(9,8,"逃生途中回应第二次呼唤");if(!S.ended)say("旁白","你只看见空楼梯。再转身时，出口仍在，但你不确定门外是否还是原来的城市。",[["推门出去",()=>endGame("escape")]])}]])}],["相信广播，乘电梯",()=>{cost(18,16,"相信第二次广播并乘电梯");if(!S.ended)say("电梯","它把你送回熟悉的办公室。你知道今晚必须先活下来。",[["等明天再试",endDay]])}]],"这是最后一次路线选择");
 }
 function newDayStart(){
  ensure();render();const intro=S.day===1?"入职第一天。林棠把一张守则塞到你手里：‘别急着记住所有人，先记住怎么回家。’第四张工位的椅子朝向你。":"第 "+S.day+" 天。昨天带走的证据仍在口袋里，但门禁记录显示你昨晚没有离开过。";
  say("旁白",intro,[["阅读办公室守则",openRules],["开始调查",()=>moveTo("desk")],["自己写下行动",freeInput]],"目标：查清陈序，再从真正的出口离开");saveGame();
 }
 function npcContext(nid){
  ensure();const known=S.horror.clues.map(k=>CLUES[k]).join("、")||"尚无";
  return "\n这是《请于下班前离开》的规则怪谈剧情。玩家已找到的线索："+known+"；理智 "+S.st.san+"，违反守则 "+S.horror.violations+" 次。真实事实：陈序在 2019 年被从公司记忆和考勤中抹去；18:00 后电梯循环回办公室；消防楼梯通向真实出口。"+
   "只提供与你身份有关的暗示，不凭空授予线索，不替玩家完成调查，不修改游戏状态；不在玩家没有查到档案和录像前直接说出全部真相。"+
   (nid==="chen"?"你是陈序，想帮助玩家，但害怕他们用自己的账号登录第四工位。":"");
 }
 function onNpcTalk(nid,line,reply){
  ensure();const ask=/陈序|守则|下班|广播|楼梯|电梯|门禁|监控|档案|出口|逃|工位|名字/.test(line);
  if(ask){S.horror.chenTrust+=nid==="chen"?2:1;saveGame();}
  if(nid==="zhao"&&/楼梯|电梯|门禁|出口/.test(line))reply+="\n（老赵压低声音）工牌失灵时，别搭电梯。楼梯间那扇没编号的门，你得自己认出来。";
  if(nid==="lin"&&/陈序|工位|名字/.test(line))reply+="\n（林棠看了看第四张桌子）如果明天我不记得你，请先答应我，再去查档案。";
  if(nid==="wei"&&/监控|门禁|服务器|机房/.test(line))reply+="\n（阿伟敲了敲机柜）备份要两个东西：档案编号和旧录像的时间戳。";
  return reply;
 }
 function freeInput(){
  ensure();say("你的行动","你可以写下自己想说的话或想做的事。大模型会理解你的意图；实际线索仍要通过调查获得。",[["返回",()=>render()]],"例如：我去监控室核对录像");
  const row=$("chatrow"),input=$("chatIn");row.classList.remove("hidden");row.classList.add("on");input.value="";input.placeholder="写下你要说或做的事…";input.focus();
  const send=()=>{const v=input.value.trim();if(!v||LLM_BUSY)return;row.classList.add("hidden");row.classList.remove("on");resolveFree(v)};
  $("chatSend").onclick=send;input.onkeydown=e=>{if(e.key==="Enter")send()};
 }
 function localIntent(v){
  if(/去|前往|走到|进入|回到/.test(v)&&Object.values(LOCS).some(loc=>v.includes(loc.name)))return "move";
  if(/守则|规则|手册/.test(v))return "rules";
  if(/问|询问|对话|交谈|找.*聊|告诉/.test(v))return "talk";
  if(/电梯/.test(v)&&/进|乘|坐|搭|按/.test(v))return "elevator";
  if(/逃|离开大楼|出口|出门/.test(v))return "escape";
  if(/查看|调查|寻找|检查|翻|搜索|核对|拍照|录像|档案|便签|备份|楼梯|杯子/.test(v))return "inspect";
  if(/等待|休息|过一会|下班/.test(v))return "wait";
  return "other";
 }
 async function resolveFree(v){
  LLM_BUSY=true;say("旁白","你试着这样做："+v+"\n周围安静下来，像是在等你的下一步。",[],"正在理解你的行动…");
  let intent=localIntent(v),narration="";
  try{
   const sys="你是《请于下班前离开》的动作理解器。只输出 JSON：{\"intent\":\"move|inspect|rules|escape|elevator|wait|talk|other\",\"target\":\"地点名称或人物名称，没有则为空\",\"narration\":\"30字以内的克制悬疑描写\"}。当前地点："+LOCS[S.loc].name+"。玩家自由行动："+v+"。只能从八个 intent 选一项。move 表示去某个明确地点，inspect 表示调查当前地点，talk 表示与具体人物对话；不得宣称获得线索、逃脱或改动理智。";
   const j=parseJSON(await llm([{role:"user",content:sys}],{maxTokens:130,temp:0.35,timeout:12000}));
   if(["move","inspect","rules","escape","elevator","wait","talk","other"].includes(j.intent))intent=j.intent;
   narration=String(j.narration||"").slice(0,80);
  }catch(e){setLLM(false)}
  LLM_BUSY=false;
  if(localIntent(v)==="move")intent="move";
  const intro=narration?narration+"\n\n":"";
  if(intent==="move"){
   const target=Object.keys(LOCS).find(k=>v.includes(LOCS[k].name));
   if(target)return moveTo(target);
   return say("旁白",intro+"你想去别的地方。请写出地图上显示的地点名称。",[["重新输入",freeInput]]);
  }
  if(intent==="inspect")return investigate();
  if(intent==="talk"){
   const target=Object.keys(NPCS).find(k=>v.includes(NPCS[k].name)||v.includes(k==="zhao"?"老赵":k==="wei"?"阿伟":k==="chen"?"陈序":"◇"));
   if(target)return npcTurn(target,v);
   return say("旁白",intro+"你想找人谈谈。先走到对方所在地点，点击人物，或写出对方的名字。",[["返回",freeInput]]);
  }
  if(intent==="rules")return openRules();
  if(intent==="escape")return attemptEscape();
  if(intent==="elevator")return moveTo("elevator");
  if(intent==="wait")return event();
  say("旁白",intro+"这个做法暂时没有改变调查结果。你可以查看当前地点、询问场景中的人，或写出更具体的行动。",[["换个说法",freeInput],["调查当前地点",investigate],["返回",()=>render()]]);
 }
 function endGame(kind){
  ensure();if(S.ended)return;S.ended=true;
  const data={
   escape:["逃出生天","你没有回应第二次广播。楼梯尽头的玻璃门外是真正的清晨。手机上多了一条没有发件人的消息：‘这次，你带着我的名字出来了。’你回头看，大楼的第十层仍亮着一盏灯。", "陈序的名字被保留下来，而你终于离开了循环。"],
   san0:["名字被替换","你已无法分清哪条记忆属于自己。第二天，第四张工位上多了一位熟练的员工。周主管说：‘他一直都在。’", "理智耗尽"],
   weird:["夜班永久员工","门禁系统终于承认你属于这里。它为你发了一张永不过期的工牌，却从来不显示出口。", "怪异度达到上限"],
   review:["第十天的名单","第十天，新的入职名单贴在前台。你找遍上面每一行，都没看到自己的名字。抽屉里却多了一张给下一个人的便签。", "没有在第十天之前找齐线索并逃离"],
   quit:["离职申请","周主管收走了申请书。第二天，它又完整地出现在你的工位上。", "你放弃了调查"]
  }[kind]||["故事暂告一段落","走廊尽头仍有一盏灯。",""];
  const modal=$("modal");$("overlay").classList.remove("hidden");modal.className="card";modal.replaceChildren();
  const eyebrow=document.createElement("div");eyebrow.className="eyebrow";eyebrow.textContent="请于下班前离开 · "+data[2];
  const h=document.createElement("h1");h.textContent=data[0];const p=document.createElement("p");p.textContent=data[1];
  const stats=document.createElement("p");stats.className="small";stats.textContent="线索 "+S.horror.clues.length+"/5 · 理智 "+S.st.san+" · 违反守则 "+S.horror.violations+" 次";
  const again=document.createElement("button");again.className="primary";again.textContent="重新开始";again.onclick=()=>{localStorage.removeItem("officeMyth");location.reload()};
  modal.append(eyebrow,h,p,stats,again);localStorage.removeItem("officeMyth");
 }
 return {ensure,renderActions,moveTo,investigate,event,evening,attemptEscape,newDayStart,npcContext,onNpcTalk,freeInput,resolveFree,endGame,showClues};
})();
