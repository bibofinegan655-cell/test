const baseState = {
  hp: 12,
  maxHp: 12,
  mana: 5,
  maxMana: 5,
  gold: 12,
  level: 1,
  xp: 0,
  day: 1,
  location: "晨雾村",
  node: "village_hub",
  inventory: { 旧地图: 1, 面包: 2 },
  story: {
    fairyAlliance: false,
    ruinsSeal: false,
    seaPearl: false,
    dragonTreaty: false,
    finalGateOpened: false,
    endingReached: false,
  },
  quests: {
    main1: "active",
    main2: "locked",
    main3: "locked",
    main4: "locked",
    sideHerb: "active",
    sideGuild: "active",
    sideDragon: "locked",
  },
  log: ["你从晨雾村广场醒来，决定写下属于自己的英雄史诗。"],
};

let state = structuredClone(baseState);

const jobBoard = [
  { name: "清理史莱姆巢穴", gold: 6, xp: 7, damage: 1, text: "你在湿地剿灭一群史莱姆。" },
  { name: "护送商队去峡道", gold: 9, xp: 8, damage: 2, text: "途中遭遇盗匪伏击，你成功护送商队。" },
  { name: "夜巡古井", gold: 5, xp: 6, damage: 0, text: "你在古井边击退幽影，村民纷纷感谢你。" },
  { name: "回收遗失符石", gold: 8, xp: 9, damage: 1, text: "你在山道寻回符石，法师塔奖励你报酬。" },
];

const questMeta = {
  main1: "主线Ⅰ：调查遗迹异动",
  main2: "主线Ⅱ：寻找三重封印材料",
  main3: "主线Ⅲ：缔结龙族盟约",
  main4: "主线Ⅳ：开启星门，远征浮空城",
  sideHerb: "支线：持续收集月露草（成长向）",
  sideGuild: "支线：冒险者公会委托（可重复）",
  sideDragon: "支线：龙语试炼",
};

const nodes = {
  village_hub: {
    title: "晨雾村广场",
    text: "广场上人来人往。酒馆、公会、法师塔和北方道路都在这里汇聚。你可以慢慢成长，也可以直接推进主线。",
    image: "assets/village.svg",
    choices: [
      { text: "前往银叶森林", next: "forest_entrance", effect: () => passDay("你沿着林间小道前进。") },
      { text: "前往古代遗迹", next: "ruins_gate", effect: () => passDay("你踏上通往遗迹的石阶。") },
      { text: "前往潮汐海湾", next: "bay_port", effect: () => passDay("你朝海风吹拂的南岸前进。") },
      {
        text: "去冒险者公会接委托（可重复刷资源）",
        next: "guild_hall",
        effect: () => passDay("你推开公会大门，任务板上贴满委托。"),
      },
      {
        text: "前往法师塔训练（消耗金币换成长）",
        next: "mage_tower",
      },
      {
        text: "在旅店休息（恢复生命和魔力）",
        next: "village_hub",
        effect: restAtInn,
      },
      {
        text: "查看主线目标提示",
        next: "main_hint",
      },
    ],
  },

  main_hint: {
    title: "远征手札",
    text: "你翻开手札：先调查遗迹 → 再收集三重封印材料（妖精星尘、海潮明珠、古咒核心）→ 与龙族盟约 → 开启星门。",
    image: "assets/ruins.svg",
    choices: [{ text: "返回晨雾村广场", next: "village_hub" }],
  },

  guild_hall: {
    title: "冒险者公会",
    text: "任务板每次都会刷新。你可以长时间刷委托来升级、攒金、准备终章战。",
    image: "assets/village.svg",
    choices: [
      { text: "接取随机委托（1）", next: "guild_hall", effect: () => doGuildJob() },
      { text: "接取随机委托（2）", next: "guild_hall", effect: () => doGuildJob() },
      {
        text: "提交 3 株月露草给药师（奖励）",
        next: "guild_hall",
        requirement: () => itemCount("月露草") >= 3,
        failureText: "月露草不够，去森林采集吧。",
        effect: () => {
          removeItem("月露草", 3);
          state.gold += 14;
          gainXp(10);
          addLog("药师收下月露草，支付 14 金币并传授你草药知识。");
        },
      },
      { text: "返回晨雾村广场", next: "village_hub" },
    ],
  },

  mage_tower: {
    title: "法师塔",
    text: "白袍导师愿意训练你。你可以花金币提升战力，为后续章节做准备。",
    image: "assets/fairy.svg",
    choices: [
      {
        text: "花 10 金币学习冥想（+1 最大魔力）",
        next: "mage_tower",
        requirement: () => state.gold >= 10,
        failureText: "金币不足。",
        effect: () => {
          state.gold -= 10;
          state.maxMana += 1;
          state.mana += 1;
          gainXp(6);
          passDay("你完成一次深层冥想。", false);
        },
      },
      {
        text: "花 10 金币锻体（+1 最大生命）",
        next: "mage_tower",
        requirement: () => state.gold >= 10,
        failureText: "金币不足。",
        effect: () => {
          state.gold -= 10;
          state.maxHp += 1;
          state.hp += 1;
          gainXp(6);
          passDay("你完成负重训练，体魄明显增强。", false);
        },
      },
      {
        text: "花 18 金币购买奥术药剂（恢复并+经验）",
        next: "mage_tower",
        requirement: () => state.gold >= 18,
        failureText: "金币不足。",
        effect: () => {
          state.gold -= 18;
          state.hp = state.maxHp;
          state.mana = state.maxMana;
          gainXp(12);
          addLog("奥术药剂让你神清气爽，状态全满。");
        },
      },
      { text: "返回晨雾村广场", next: "village_hub" },
    ],
  },

  forest_entrance: {
    title: "银叶森林入口",
    text: "巨树投下银色光斑。这里有采集路线、妖精圣坛和一处被荆棘封锁的深林遗径。",
    image: "assets/forest.svg",
    choices: [
      {
        text: "采集月露草（稳定恢复线）",
        next: "forest_entrance",
        effect: () => {
          addItem("月露草", 1);
          state.hp = Math.min(state.maxHp, state.hp + 2);
          gainXp(4);
          passDay("你采集到月露草，体力有所恢复。", false);
        },
      },
      {
        text: "挑战林中魔狼",
        next: "forest_entrance",
        effect: () => {
          combatCheck({ hpCost: 3, manaCost: 1, rewardGold: 8, rewardXp: 10, rewardItem: "狼牙" });
          passDay("你与魔狼缠斗一番后归来。", false);
        },
      },
      {
        text: "前往妖精圣坛（主线材料：星尘）",
        next: "fairy_sanctum",
      },
      {
        text: "返回晨雾村广场",
        next: "village_hub",
      },
    ],
  },

  fairy_sanctum: {
    title: "妖精圣坛",
    text: "圣坛被光蝶环绕。妖精女王表示，只有帮助森林恢复平衡，才会赠予星尘符文。",
    image: "assets/fairy.svg",
    choices: [
      {
        text: "净化枯萎树心（消耗 2 魔力）",
        next: "fairy_sanctum",
        requirement: () => state.mana >= 2,
        failureText: "魔力不足，无法净化。",
        effect: () => {
          state.mana -= 2;
          gainXp(9);
          addItem("森林露珠", 1);
          passDay("你完成一次净化仪式。", false);
        },
      },
      {
        text: "提交 2 份森林露珠换取星尘符文",
        next: "fairy_sanctum",
        requirement: () => itemCount("森林露珠") >= 2 && !state.story.fairyAlliance,
        failureText: "条件不足，或你已完成该步骤。",
        effect: () => {
          removeItem("森林露珠", 2);
          addItem("星尘符文", 1);
          state.story.fairyAlliance = true;
          state.quests.main2 = "active";
          addLog("你与妖精缔结盟约，获得主线材料【星尘符文】。", "good");
        },
      },
      { text: "返回森林入口", next: "forest_entrance" },
    ],
  },

  ruins_gate: {
    title: "古代遗迹外环",
    text: "断裂石柱中涌出黑雾。这里藏有主线关键材料“古咒核心”。",
    image: "assets/ruins.svg",
    choices: [
      {
        text: "调查外环铭文（主线Ⅰ）",
        next: "ruins_gate",
        requirement: () => !state.story.ruinsSeal,
        failureText: "你已经完成了初步调查。",
        effect: () => {
          gainXp(8);
          state.quests.main1 = "done";
          state.quests.main2 = "active";
          addLog("你记录下裂隙规律，确认需要三重材料进行终极封印。", "good");
          passDay("调查耗费了半天。", false);
        },
      },
      {
        text: "深入裂隙试炼（消耗 4 生命，奖励古咒核心）",
        next: "ruins_gate",
        requirement: () => !itemCount("古咒核心"),
        failureText: "你已经拿到古咒核心。",
        effect: () => {
          state.hp -= 4;
          if (state.hp <= 0) {
            state.hp = 1;
            addLog("你几乎倒下，被余烬符文护住一命。", "warn");
          }
          addItem("古咒核心", 1);
          gainXp(14);
          addLog("你从裂隙深处取回【古咒核心】。", "good");
          passDay("你拖着疲惫身体返回营地。", false);
        },
      },
      {
        text: "封印外溢黑雾（可重复，获取金币）",
        next: "ruins_gate",
        effect: () => {
          const manaSpend = Math.min(2, state.mana);
          state.mana -= manaSpend;
          state.gold += 6 + state.level;
          gainXp(5);
          addLog("你维持临时结界，附近村落暂时安全。");
          passDay("你在遗迹驻守了一天。", false);
        },
      },
      { text: "返回晨雾村广场", next: "village_hub" },
    ],
  },

  bay_port: {
    title: "潮汐海湾",
    text: "海雾吞没码头，渔民谈论着会发光的深海神殿。你需要明珠作为第二份封印材料。",
    image: "assets/ending_true.svg",
    choices: [
      {
        text: "租船出海探查（花费 8 金币）",
        next: "bay_deep",
        requirement: () => state.gold >= 8,
        failureText: "金币不足，无法租船。",
        effect: () => {
          state.gold -= 8;
          passDay("你乘船驶向暴风圈。", false);
        },
      },
      {
        text: "码头打工（赚钱 + 小经验）",
        next: "bay_port",
        effect: () => {
          state.gold += 5;
          gainXp(4);
          passDay("你帮渔民修网，赚到一点旅费。", false);
        },
      },
      {
        text: "返回晨雾村广场",
        next: "village_hub",
      },
    ],
  },

  bay_deep: {
    title: "深海神殿",
    text: "潮汐在石柱间回响。神殿守卫会考验你的体魄与魔力。",
    image: "assets/ending_good.svg",
    choices: [
      {
        text: "接受守卫试炼（至少 6 生命 + 2 魔力）",
        next: "bay_deep",
        requirement: () => state.hp >= 6 && state.mana >= 2,
        failureText: "你的状态不足，先去休整。",
        effect: () => {
          state.hp -= 3;
          state.mana -= 2;
          gainXp(14);
          if (!state.story.seaPearl) {
            addItem("海潮明珠", 1);
            state.story.seaPearl = true;
            addLog("你通过神殿试炼，得到【海潮明珠】。", "good");
          } else {
            state.gold += 10;
            addLog("你再次通过试炼，神殿奖励金币。", "good");
          }
          passDay("海潮退去时你返回岸边。", false);
        },
      },
      { text: "撤回潮汐海湾", next: "bay_port" },
    ],
  },

  dragon_peak: {
    title: "龙脊峰",
    text: "风雪呼啸。古龙监察者要求你证明实力与诚意，才会同意缔约。",
    image: "assets/ending_bad.svg",
    choices: [
      {
        text: "献上狼牙与金币（2 狼牙 + 20 金币）",
        next: "dragon_peak",
        requirement: () => itemCount("狼牙") >= 2 && state.gold >= 20,
        failureText: "材料或金币不足。",
        effect: () => {
          removeItem("狼牙", 2);
          state.gold -= 20;
          state.story.dragonTreaty = true;
          state.quests.main3 = "done";
          state.quests.main4 = "active";
          state.quests.sideDragon = "done";
          gainXp(20);
          addLog("龙族接受你的誓约，第三章主线完成。", "good");
        },
      },
      {
        text: "接受龙语试炼（高难战斗）",
        next: "dragon_peak",
        effect: () => {
          if (state.level < 5) {
            state.hp -= 5;
            addLog("你等级不足，试炼失败并受伤。建议至少 5 级再来。", "warn");
            if (state.hp < 1) state.hp = 1;
            return;
          }
          state.hp -= 2;
          state.mana = Math.max(0, state.mana - 2);
          gainXp(16);
          addItem("龙印", 1);
          state.quests.sideDragon = "active";
          addLog("你通过部分龙语试炼，获得龙印。", "good");
        },
      },
      { text: "返回晨雾村广场", next: "village_hub" },
    ],
  },

  star_gate: {
    title: "星门祭台",
    text: "三重材料在祭台上共鸣。若你已完成盟约，便可开启前往浮空城的星门。",
    image: "assets/ruins.svg",
    choices: [
      {
        text: "尝试启动星门（终章）",
        next: "ending_long",
        requirement: () => canOpenFinalGate(),
        failureText: "条件不足：需要星尘符文、海潮明珠、古咒核心、龙族盟约。",
        effect: () => {
          state.story.finalGateOpened = true;
          state.story.endingReached = true;
          state.quests.main4 = "done";
          gainXp(30);
          addLog("星门开启，浮空城的钟声跨越云海传来。", "good");
        },
      },
      { text: "返回晨雾村广场", next: "village_hub" },
    ],
  },

  ending_long: {
    title: "长篇终章：浮空城远征",
    text: "你抵达浮空城，成为“星辉远征团”首席。至此主线完整通关。你仍可继续刷委托、练级、收集并挑战更高效率路线。完整体验时长可达 1 小时以上。",
    image: "assets/ending_true.svg",
    ending: true,
    choices: [
      { text: "继续自由冒险（不重置）", next: "village_hub" },
      { text: "开启新周目（保留攻略经验）", next: "village_hub", reset: true },
    ],
  },
};

const hpEl = document.querySelector("#hp");
const manaEl = document.querySelector("#mana");
const levelEl = document.querySelector("#level");
const xpEl = document.querySelector("#xp");
const goldEl = document.querySelector("#gold");
const dayEl = document.querySelector("#day");
const locationEl = document.querySelector("#location");
const titleEl = document.querySelector("#scene-title");
const textEl = document.querySelector("#scene-text");
const imageEl = document.querySelector("#scene-image");
const choicesEl = document.querySelector("#choices");
const inventoryEl = document.querySelector("#inventory-list");
const questEl = document.querySelector("#quest-list");
const logEl = document.querySelector("#log-list");
const restartBtn = document.querySelector("#restart-btn");
const saveBtn = document.querySelector("#save-btn");
const loadBtn = document.querySelector("#load-btn");

restartBtn.addEventListener("click", () => {
  state = structuredClone(baseState);
  addLog("你重新整理行囊，新的远征开始。", "good");
  render();
});

saveBtn.addEventListener("click", () => {
  const data = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  navigator.clipboard
    .writeText(data)
    .then(() => addLog("存档码已复制到剪贴板。", "good"))
    .catch(() => addLog("复制失败，请手动复制弹窗内容。"));
  prompt("这是你的存档码，请复制保存：", data);
});

loadBtn.addEventListener("click", () => {
  const code = prompt("粘贴存档码：");
  if (!code) return;
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(code))));
    state = { ...structuredClone(baseState), ...parsed };
    addLog("存档读取成功。", "good");
    render();
  } catch {
    addLog("存档码无效，读取失败。", "warn");
    render();
  }
});

function addLog(message, type = "normal") {
  const prefix = type === "warn" ? "⚠️ " : type === "good" ? "✅ " : "";
  state.log.unshift(prefix + message);
  state.log = state.log.slice(0, 12);
}

function addItem(name, amount = 1) {
  state.inventory[name] = (state.inventory[name] || 0) + amount;
  addLog(`获得物品：${name} x${amount}`);
}

function removeItem(name, amount = 1) {
  if (!state.inventory[name]) return;
  state.inventory[name] -= amount;
  if (state.inventory[name] <= 0) {
    delete state.inventory[name];
  }
}

function itemCount(name) {
  return state.inventory[name] || 0;
}

function gainXp(amount) {
  state.xp += amount;
  while (state.xp >= xpNeed()) {
    state.xp -= xpNeed();
    state.level += 1;
    state.maxHp += 2;
    state.maxMana += 1;
    state.hp = state.maxHp;
    state.mana = state.maxMana;
    addLog(`你升到 ${state.level} 级！生命与魔力上限提升并恢复。`, "good");
  }
  autoUnlockProgress();
}

function xpNeed() {
  return 16 + state.level * 4;
}

function passDay(message, increaseDay = true) {
  if (increaseDay) state.day += 1;
  addLog(message);
}

function restAtInn() {
  const price = 6;
  if (state.gold < price) {
    addLog("你金币不够，无法住店。", "warn");
    return;
  }
  state.gold -= price;
  state.hp = state.maxHp;
  state.mana = state.maxMana;
  state.day += 1;
  addLog("你在旅店休息一晚，状态全满。", "good");
}

function doGuildJob() {
  const job = jobBoard[Math.floor(Math.random() * jobBoard.length)];
  state.gold += job.gold + Math.floor(state.level / 2);
  gainXp(job.xp);
  if (job.damage > 0) {
    state.hp = Math.max(1, state.hp - Math.max(0, job.damage - Math.floor(state.level / 3)));
  }
  if (Math.random() > 0.65) addItem("月露草", 1);
  passDay(`${job.name}：${job.text}`, false);
}

function combatCheck({ hpCost, manaCost, rewardGold, rewardXp, rewardItem }) {
  const hpNeed = Math.max(1, hpCost - Math.floor(state.level / 2));
  const manaNeed = Math.max(0, manaCost - Math.floor(state.level / 4));
  if (state.hp <= hpNeed) {
    addLog("你状态太差，战斗失败。", "warn");
    state.hp = 1;
    return;
  }
  state.hp -= hpNeed;
  state.mana = Math.max(0, state.mana - manaNeed);
  state.gold += rewardGold;
  gainXp(rewardXp);
  if (rewardItem) addItem(rewardItem, 1);
  addLog(`战斗获胜：+${rewardGold} 金币，+${rewardXp} 经验。`, "good");
}

function autoUnlockProgress() {
  if (state.story.fairyAlliance && state.story.seaPearl && itemCount("古咒核心") > 0) {
    state.quests.main2 = "done";
    state.quests.main3 = "active";
  }

  if (state.quests.main3 === "active" && state.level >= 4) {
    nodes.village_hub.choices = nodes.village_hub.choices.filter((c) => c.next !== "dragon_peak" && c.next !== "star_gate");
    nodes.village_hub.choices.push({ text: "前往龙脊峰（主线Ⅲ）", next: "dragon_peak", effect: () => passDay("你攀向风雪中的龙脊峰。") });
  }

  if (state.story.dragonTreaty) {
    nodes.village_hub.choices = nodes.village_hub.choices.filter((c) => c.next !== "star_gate");
    nodes.village_hub.choices.push({ text: "前往星门祭台（主线Ⅳ）", next: "star_gate", effect: () => passDay("你带着三重材料走向祭台。") });
  }
}

function canOpenFinalGate() {
  return (
    itemCount("星尘符文") > 0 &&
    itemCount("海潮明珠") > 0 &&
    itemCount("古咒核心") > 0 &&
    state.story.dragonTreaty
  );
}

function choose(choice) {
  if (choice.reset) {
    state = structuredClone(baseState);
    addLog("你带着前世记忆重启远征。", "good");
  }

  if (choice.requirement && !choice.requirement()) {
    addLog(choice.failureText || "条件不足，无法执行。", "warn");
    render();
    return;
  }

  if (choice.effect) {
    choice.effect();
  }

  state.node = choice.next;
  state.location = nodes[choice.next].title;

  if (state.hp <= 0) {
    state.hp = 1;
    addLog("你濒死撤退，勉强保住性命。", "warn");
    state.node = "village_hub";
    state.location = nodes.village_hub.title;
  }

  state.mana = Math.min(state.maxMana, state.mana + 1);
  autoUnlockProgress();
  render();
}

function renderChoices(node) {
  choicesEl.innerHTML = "";
  node.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-btn";
    button.textContent = choice.text;
    button.addEventListener("click", () => choose(choice));
    choicesEl.appendChild(button);
  });
}

function renderStatus() {
  hpEl.textContent = `${state.hp}/${state.maxHp}`;
  manaEl.textContent = `${state.mana}/${state.maxMana}`;
  levelEl.textContent = state.level;
  xpEl.textContent = `${state.xp}/${xpNeed()}`;
  goldEl.textContent = state.gold;
  dayEl.textContent = state.day;
  locationEl.textContent = state.location;

  const items = Object.entries(state.inventory);
  inventoryEl.innerHTML = items.length
    ? items.map(([name, count]) => `<li>${name} x${count}</li>`).join("")
    : "<li>（空）</li>";

  questEl.innerHTML = Object.entries(questMeta)
    .map(([key, label]) => `<li class="${state.quests[key] === "done" ? "done" : "active"}">${label}：${state.quests[key]}</li>`)
    .join("");

  logEl.innerHTML = state.log.map((msg) => `<li>${msg}</li>`).join("");
}

function render() {
  const node = nodes[state.node] || nodes.village_hub;
  titleEl.textContent = node.title;
  textEl.textContent = node.text;
  imageEl.src = node.image;
  imageEl.alt = `${node.title} 场景插画`;

  renderChoices(node);
  renderStatus();

  if (node.ending) {
    textEl.innerHTML = `<span class="ending">${node.text}</span>`;
  }
}

autoUnlockProgress();
render();
